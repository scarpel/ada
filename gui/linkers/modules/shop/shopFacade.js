import { get_main_url, trim_url_protocols, treat_all_url, add_protocol, get_file_extension } from "../utils/websiteUtils.js"
import { ShopHTMLParser } from "./shopParser.js"
import { predict, predictPrice } from "./shopPredictor.js"
import { fetch_js, fetch_html, download_img, fetch_all, fetch_all_js } from "../utils/htmlFetcher.js"
import { doRunJavascript, isSameProduct, isProductValid } from "../utils/shopUtils.js"
import { get_basic_website_info } from "../utils/websiteUtils.js"
import { SHOP_WEBSITES, SHOP_PRODUCTS, SHOP_TITLE_IDS, SHOP_IMG_IDS, SHOP_PRICES, USERS_SHOP_PRODUCTS, USERS } from "../consts/databaseConsts.js"
import { get_last_id } from "../utils/databaseUtils.js"
import { ShopWebsiteInfo, ProductProperties, ImgProperties, TitleProperties, PriceProperties, ParsedProductProperties } from "../utils/shopDataTypes.js"
import { SHOP_FAVICONS, PRODUCT_IMAGES } from "../consts/paths.js"
import { convertPriceToFloat, convert_price_to_db } from "../utils/priceFuncs.js"
import { InvalidProduct } from "./shopExceptions.js"
import { filterBreadcrumbers } from "../utils/breadcrumberFinder.js"

const moment = window.parent.moment

const parser = new ShopHTMLParser()

async function get_known_product(url, shopInfo, update=(()=>{}), timeout=30){
    timeout *= 1000

    let html = await (shopInfo.hasJavascript? fetch_js(url, timeout): fetch_html(url))
    let parsedObj = parser.parse(html, shopInfo.breadcrumbClass);
    let product = predict(parsedObj, shopInfo);

    if(isProductValid(product)){
        product[ProductProperties.URL] = url
        product[ProductProperties.BREADCRUMB] = filterBreadcrumbers(parsedObj[ParsedProductProperties.BREADCRUMB], shopInfo.name)
        return product
    }else throw new InvalidProduct()
}

async function get_unknown_product(url, main_url=null, update=(()=>{}), timeout=30){
    timeout *= 1000

    let hasJavascript = false
    let html = await fetch_html(url)
    let parsedObj = parser.parse(html)
    let page_title = parser.title
    let product = predict(parsedObj)

    if(doRunJavascript(parsedObj)){
        html = await fetch_js(url, timeout)

        let parsedJsObj = parser.parse(html)

        let productJs = predict(parsedJsObj)

        if(!isSameProduct(product, productJs)){
            hasJavascript = true
            product = productJs
            parsedObj = parsedJsObj
        }
    }

    if(isProductValid(product)){
        main_url = main_url? main_url: get_main_url(url)
        const basicInfo = get_basic_website_info(main_url, page_title, html);
        product[ProductProperties.URL] = url
        product[ProductProperties.BREADCRUMB] = filterBreadcrumbers(parsedObj[ParsedProductProperties.BREADCRUMB], basicInfo.websiteName)
        return [product, {hasJavascript, ...basicInfo}]
    }else throw new InvalidProduct()
}

async function get_product(url, main_url=null, update=(text => {}), timeout=30){
    timeout *= 1000
    update("Fetching html...")
    main_url = main_url? main_url: get_main_url(url)

    if(shopInfo){
        let product = await get_known_product(url, shopInfo, timeout)
        if(isProductValid(product)) return product
    }else{
        let [product, hasJavascript, page_title, html] = await get_unknown_product(url, timeout)

        if(isProductValid(product)){
            return [{product}, {hasJavascript, ...get_basic_website_info(main_url, page_title, html)}]
        }
    }

    throw new InvalidProduct()
}

function get_product_price_from_html(html){
    let priceArray = parser.get_prices(html)
    return priceArray? predictPrice(priceArray, 0): null
}

async function get_product_prices_from_db(connection, productId, desc=false){
    return await connection.all(`SELECT * FROM ${SHOP_PRICES} WHERE product_id=${productId} ORDER BY id${desc?" DESC":""}`)
}

function product_like_db(product, website_id, priceValue){
    const [currency, value] = product[ProductProperties.PRICE][PriceProperties.PRICE]

    return {
        id: product.id,
        url: product[ProductProperties.URL],
        name: product[ProductProperties.TITLE][TitleProperties.TITLE],
        price: {
            currency,
            value: (priceValue || priceValue === 0)? priceValue: value
        },
        website_id,
        update_in: product.update_in,
        breadcrumbs: product[ProductProperties.BREADCRUMB] || {}
    }
}

async function save_product(connection, shopInfo, product){
    if(shopInfo.id){
        const { mainCategory = "", additionalCategories = "" } = product[ProductProperties.BREADCRUMB] || {}
        await connection.run(`INSERT INTO ${SHOP_PRODUCTS} VALUES (?,?,?,?,?,?)`, [
            null, 
            trim_url_protocols(product[ProductProperties.URL]), 
            product[ProductProperties.TITLE][TitleProperties.TITLE],
            mainCategory,
            additionalCategories,
            shopInfo.id,
        ])
        return await get_last_id(connection, SHOP_PRODUCTS)
    }else return null
}

async function save_product_ids(connection, product, shopInfo){
    if(shopInfo.id){
        let [titleIds, imgIds] = shopInfo.updateWithProduct(product)
        
        const titleInsert = connection.prepare(`INSERT INTO ${SHOP_TITLE_IDS} VALUES (?, ${shopInfo.id})`)
        const imgInsert = connection.prepare(`INSERT INTO ${SHOP_IMG_IDS} VALUES (?, ${shopInfo.id})`)

        for (const title of titleIds) titleInsert.run(title)
        for (const img of imgIds) imgInsert.run(img)
        
        return true
    }else return false
}

function save_favicon(faviconUrl, path, faviconName, extension="ico"){
    download_img(faviconUrl, path, faviconName, extension)
}

async function save_img(imgUrl, path, imgName, imgExtensionWithoutDot="png"){
    await download_img(imgUrl, path, imgName, imgExtensionWithoutDot)
}

async function save_product_website(connection, mainUrl, name, hasJavascript, faviconExtension){
    await connection.run(`INSERT INTO ${SHOP_WEBSITES} VALUES (?,?,?,?,?)`, [null, trim_url_protocols(mainUrl), name, hasJavascript?1:0, faviconExtension])
    return await get_last_id(connection, SHOP_WEBSITES)
}

async function save_price(connection, currency, price, productId, timestamp=null, convertPrice=true){
    if(convertPrice) price = convert_price_to_db(currency, price)
    timestamp = timestamp? timestamp: moment().unix()

    await connection.run(`INSERT INTO ${SHOP_PRICES} VALUES(?,?,?,?,?)`, [null, currency, price, timestamp, productId])

    return price;
}

async function store_shopInfo(connection, productInfo){
    let {mainUrl, domain, websiteName, hasJavascript, faviconUrl} = productInfo
    const faviconExtension = get_file_extension(faviconUrl);

    const websiteId = await save_product_website(connection, mainUrl, websiteName, hasJavascript, faviconExtension)
    if(websiteId){
        let shopInfo = new ShopWebsiteInfo(websiteId, mainUrl, domain, websiteName, hasJavascript, faviconExtension)

        if(shopInfo){
            save_favicon(faviconUrl, SHOP_FAVICONS, websiteId, faviconExtension)
            return shopInfo
        }else throw "Unable to create shopWebsiteInfo."
    }else throw "Unable to save website."
}

async function store_full_product(connection, lastProduct, lastShopInfo){
    const productId = await save_product(connection, lastShopInfo, lastProduct)

    if(productId){
        lastProduct.id = productId

        if(save_product_ids(connection, lastProduct, lastShopInfo)){
            let valueConverted = await save_price(connection, ...lastProduct[ProductProperties.PRICE][PriceProperties.PRICE], productId)
            download_img(lastProduct[ProductProperties.IMG][ImgProperties.TAG]["src"], PRODUCT_IMAGES, productId, "png")

            return [lastProduct, lastShopInfo, valueConverted]
        }else throw "Unable to store product ids!"
    }else throw "Unable to store product!"
}

async function store_user_shop_product(connection, userId, productId, updateIn){
    return connection.run(`INSERT INTO ${USERS_SHOP_PRODUCTS} VALUES (?,?,?)`, [userId, productId, updateIn])
}

async function store(connection, userId, product, productInfo=null, shopInfo=null, mainPath=window.parent.mainPath){
    try{
        await connection.run("BEGIN")

        if(!shopInfo){
            shopInfo = await store_shopInfo(connection, productInfo, mainPath)
        }

        let [newProduct, newShopInfo, priceValue] = await store_full_product(connection, product, shopInfo, mainPath)
        await store_user_shop_product(connection, userId, newProduct.id, newProduct.update_in)
        await connection.run("COMMIT")

        return [product_like_db(newProduct, newShopInfo.id, priceValue), newShopInfo]
    }catch(err){
        await connection.run("ROLLBACK")
        throw err
    }
}

function get_product_like_db(product, websiteId){
    let productPrice = product[ProductProperties.PRICE][PriceProperties.PRICE]

    return {
        id: product.id,
        name: product[ProductProperties.TITLE][TitleProperties.TITLE],
        price: {currency: productPrice[0], value: convert_price_to_db(...productPrice)},
        website_id: websiteId
    }
}

async function get_most_recent_price(connection, productId){
    return await connection.get(`SELECT currency, value, date FROM ${SHOP_PRICES} WHERE product_id=${productId} ORDER BY id DESC LIMIT 1`)
}

async function get_last_n_prices(connection, product_id, n=2){
    return await connection.all(`SELECT currency, value, date FROM ${SHOP_PRICES} WHERE product_id=${product_id} ORDER BY id DESC LIMIT ${n}`)
} 

async function get_all_products_from_db(connection, userId, websiteId=null){
    let products = {}
    const result = await connection.all(`SELECT p.*, u.update_in FROM ${SHOP_PRODUCTS} p, ${USERS_SHOP_PRODUCTS} u WHERE u.user_id=? AND u.product_id = p.id${websiteId?` AND p.website_id=${websiteId}`:""}`, [userId])
    
    for(let i=result.length-1; i>=0; i--){
        let product = result[i]
        product.url = add_protocol(product.url)
        products[product.id] = product
    }

    return products
}

async function get_product_from_db(connection, productId){
    let product = await connection.get(`SELECT * FROM ${SHOP_PRODUCTS} WHERE id=${productId}`)
    if(product) product.url = add_protocol(product.url)

    return product
}

function get_product_by_url(connection, url, websiteId){
    return connection.get(`SELECT * FROM ${SHOP_PRODUCTS} WHERE website_id=? AND url=?`, [websiteId, trim_url_protocols(url)])
}

async function get_shopWebsiteInfo(connection, website_id=null, url=null){
    let info = await connection.get(`SELECT * FROM ${SHOP_WEBSITES} WHERE ${website_id?(`id = ${website_id}`):(`url = '${trim_url_protocols(url)}'`)}`)
    if(info){
        info.url = treat_all_url(info)
        let titleSet = new Set(await get_tagId_from_table(connection, "shop_title_ids", info.id))
        let imgSet = new Set(await get_tagId_from_table(connection, "shop_img_ids", info.id))

        return ShopWebsiteInfo.from_db(info, titleSet, imgSet)
    }else return info
}

async function get_tagId_from_table(connection, tableName, websiteId){
    let tags = await connection.all(`SELECT tag_id FROM ${tableName} WHERE website_id = ${websiteId}`)
    return tags.map(obj => obj.tag_id)
}

// function get_all_shopInfos(connection, products){
//     let shopInfos = {}, lookup = new Set(), product = null

//     for(let i=products.length-1; i>=0; i--){
//         product = products[i]
//         if(!lookup.has(product.website_id)){
//             let shopInfo = get_shopWebsiteInfo(connection, product.website_id)
//             shopInfos[shopInfo.url] = shopInfo
//             lookup.add(product.website_id)
//         }
//     }

//     return shopInfos
// }

async function delete_product(connection, userId, productId){
    await delete_user_shop_product(connection, userId, productId)
    
    if(await count_product_references(connection, productId).count === 0){
        connection.run(`DELETE FROM ${SHOP_PRODUCTS} WHERE id=${productId}`)
        window.parent.unlinkSync(window.parent.path_join(PRODUCT_IMAGES, productId+".png"))
    }
}

function delete_user_shop_product(connection, userId, productId){
    return connection.run(`DELETE FROM ${USERS_SHOP_PRODUCTS} WHERE user_id=${userId} AND product_id=${productId}`)
}

async function count_product_references(connection, productId){
    return await connection.get(`SELECT COUNT(*) AS count FROM ${USERS_SHOP_PRODUCTS} WHERE product_id=${productId}`)
}

async function get_shopInfos_from_db(connection, userId){
    let shopInfos = {}
    let websiteIdLookup = {}
    let websites = await connection.all(`SELECT DISTINCT w.* FROM ${SHOP_WEBSITES} w, ${SHOP_PRODUCTS} p, ${USERS_SHOP_PRODUCTS} s WHERE s.user_id = ${userId} AND s.product_id = p.id AND p.website_id = w.id`);

    for(var i=websites.length-1; i>=0; i--){
        let website = websites[i]
        website.url = treat_all_url(website.url)
        let titleSet = new Set(await get_tagId_from_table(connection, "shop_title_ids", website.id))
        let imgSet = new Set(await get_tagId_from_table(connection, "shop_img_ids", website.id))
        shopInfos[website.id] = ShopWebsiteInfo.from_db(website, titleSet, imgSet)
        websiteIdLookup[website.url] = website.id
    }

    return [shopInfos, websiteIdLookup]
}

async function fetch_invalid_prices(products, shopInfos, date = new Date()){
    let jsUrls = []
    let jsUrlsProducts = []
    let urls = []
    let urlsProducts = []
    let today = moment()
    let prices = []

    for(let i=products.length-1; i>=0; i--){
        let product = products[i]
        if(moment.unix(product.price.date).add(product.update_in, "days").isSameOrBefore(today, "day")){
            if(shopInfos[product.website_id].hasJavascript){
                jsUrls.push(product.url)
                jsUrlsProducts.push(product)
            }else{
                urls.push(product.url)
                urlsProducts.push(product)
            }
        }
    }

    let start = new Date().getTime()
    let jsHtmls = fetch_all_js(jsUrls, 50)
    let htmls = await fetch_all(urls)
    console.log(new Date().getTime() - start)
    
    get_prices_from_htmls(urlsProducts, htmls, prices)
    get_prices_from_htmls(jsUrlsProducts, await jsHtmls, prices)
    console.log(new Date().getTime() - start)

    return prices
}

function get_prices_from_htmls(products, htmls, prices={}){
    for(let i=htmls.length-1; i>=0; i--){
        let priceObj = get_product_price_from_html(htmls[i])
        if(priceObj){
            let [currency, value] = priceObj[PriceProperties.PRICE]
            prices.push({product: products[i], currency, value: convert_price_to_db(currency, value)})
        }
    }

    return prices
}

function get_img_src(productId){
    return path_join(PRODUCT_IMAGES, `${productId}.png`)
}

function get_favicon_src(websiteId, faviconExtension="ico"){
    return path_join(SHOP_FAVICONS, `${websiteId}.${faviconExtension}`)
}

export { get_known_product, get_unknown_product, get_product, save_favicon, save_img, save_product, 
    save_product_ids, save_product_website, store, get_all_products_from_db, get_tagId_from_table,
    get_most_recent_price, get_product_from_db, get_last_n_prices, get_product_like_db, delete_product, 
    get_shopInfos_from_db, fetch_invalid_prices, get_product_price_from_html, save_price, get_img_src, 
    get_favicon_src, get_shopWebsiteInfo, get_product_prices_from_db, get_product_by_url, store_user_shop_product}