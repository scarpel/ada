function store_product(connection, shopInfo, product){
    if(shopInfo.id){
        connection.prepare(`INSERT INTO ${SHOP_PRODUCTS} VALUES (?,?,?,?,?)`).run(null, product[ProductProperties.URL], product[ProductProperties.TITLE][TitleProperties.TITLE], product.update_in, shopInfo.id)
        return get_last_id(connection, SHOP_PRODUCTS)
    }else return null
}

function store_product_ids(connection, product, shopInfo){
    if(shopInfo.id){
        let [titleIds, imgIds] = shopInfo.updateWithProduct(product)
        
        const titleInsert = connection.prepare(`INSERT INTO ${SHOP_TITLE_IDS} VALUES (?, ${shopInfo.id})`)
        const imgInsert = connection.prepare(`INSERT INTO ${SHOP_IMG_IDS} VALUES (?, ${shopInfo.id})`)

        for (const title of titleIds) titleInsert.run(title)
        for (const img of imgIds) imgInsert.run(img)
        
        return true
    }else return false
}

function save_favicon(faviconUrl, path, faviconName){
    download_img(faviconUrl, path, faviconName, "ico")
}

async function save_img(imgUrl, path, imgName, imgExtensionWithoutDot="png"){
    await download_img(imgUrl, path, imgName, imgExtensionWithoutDot)
}

function save_product_website(connection, mainUrl, name, hasJavascript){
    connection.prepare(`INSERT INTO ${SHOP_WEBSITES} VALUES (?,?,?,?)`).run(null, mainUrl, name, hasJavascript?1:0)
    return get_last_id(connection, SHOP_WEBSITES)
}

function save_price(connection, currency, price, productId, timestamp=null, convertPrice=true){
    if(convertPrice) price = convert_price_to_db(currency, price)
    timestamp = timestamp? timestamp: moment().unix()

    connection.prepare(`INSERT INTO ${SHOP_PRICES} VALUES(?,?,?,?,?)`).run(null, currency, price, timestamp, productId)
    return price
}

async function store_shopInfo(connection, productInfo){
    let {mainUrl, domain, websiteName, hasJavascript, faviconUrl} = productInfo

    const websiteId = save_product_website(connection, mainUrl, websiteName, hasJavascript)
    if(websiteId){
        let shopInfo = new ShopWebsiteInfo(websiteId, mainUrl, domain, websiteName, hasJavascript)

        if(shopInfo){
            save_favicon(faviconUrl, SHOP_FAVICONS, websiteId)
            return shopInfo
        }else throw "Unable to create shopWebsiteInfo."
    }else throw "Unable to save website."
}

async function store_full_product(connection, lastProduct, lastShopInfo){
    const productId = save_product(connection, lastShopInfo, lastProduct)

    if(productId){
        lastProduct.id = productId

        if(save_product_ids(connection, lastProduct, lastShopInfo)){
            let valueConverted = save_price(connection, ...lastProduct[ProductProperties.PRICE][PriceProperties.PRICE], productId)

            download_img(lastProduct[ProductProperties.IMG][ImgProperties.TAG]["src"], PRODUCT_IMAGES, productId, "png")

            return [lastProduct, lastShopInfo, valueConverted]
        }else throw "Unable to store product ids!"
    }else throw "Unable to store product!"
}

async function store(connection, product, productInfo=null, shopInfo=null, mainPath=window.parent.mainPath){
    try{
        connection.prepare("BEGIN").run()

        if(!shopInfo){
            shopInfo = await store_shopInfo(connection, productInfo, mainPath)
        }

        let [newProduct, newShopInfo, priceValue] = await store_full_product(connection, product, shopInfo, mainPath)
        connection.prepare("COMMIT").run()

        return [product_like_db(newProduct, newShopInfo.id, priceValue), newShopInfo]
    }catch(err){
        connection.prepare("ROLLBACK").run()
        throw err
    }
}