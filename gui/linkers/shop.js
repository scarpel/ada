import { get_all_products_from_db, get_shopInfos_from_db, get_img_src, get_favicon_src, 
    get_most_recent_price, delete_product, get_known_product, get_unknown_product, 
    store, get_shopWebsiteInfo, fetch_invalid_prices, save_price, get_product_by_url, store_user_shop_product } from "./modules/shop/shopFacade.js"
import { get_main_url, treat_all_url } from "./modules/utils/websiteUtils.js"
import { ProductProperties, TitleProperties, PriceProperties, ImgProperties } from "./modules/utils/shopDataTypes.js"
import { getValuesFromObj } from "./modules/utils/utils.js"
import ProductCard from "./components/ProductCard.js"
import Counter from "./components/Counter.js"
import NewPrice from "./components/NewPrice.js"
import WebsiteProducts from "./components/WebsiteProducts.js"
import { InvalidProduct } from "./modules/shop/shopExceptions.js"
import { replaceAll } from "./modules/utils/strFuncs.js"
import { convert_price_from_db } from "./modules/utils/priceFuncs.js"
import { getDecimalPlaces } from "./modules/consts/decimalPlaces.js"

window.connection = window.parent.database
window.daysCounter = new Counter(1, 1, 365)
window.todayTimestamp = moment({hour:0, minute:0}).unix()

let storeInfo, products, shopInfos, websiteIdLookup, productNodes, lastUpdate, alreadyLoading

const displayElementId = "products"

const displayOptions = {
    NEWEST: 1,
    OLDEST: 2,
    LOWER_PRICE: 3,
    BIGGER_PRICE: 4,
    WEBSITE_NAME: 5
}

const displayFunctions = {
    [displayOptions.NEWEST]: newstDisplay,
    [displayOptions.OLDEST]: oldestDisplay,
    [displayOptions.LOWER_PRICE]: lowestPriceDisplay,
    [displayOptions.BIGGER_PRICE]: biggerPriceDisplay,
    [displayOptions.WEBSITE_NAME]: websiteNameDisplay
}

const addToProductsFuncs = {
    [displayOptions.NEWEST]: addProductToNewest,
    [displayOptions.OLDEST]: addProductToOldest,
    [displayOptions.LOWER_PRICE]: addProductToLower,
    [displayOptions.BIGGER_PRICE]: addProductToBigger,
    [displayOptions.WEBSITE_NAME]: addProductToWebsiteName
}

let currentDisplay = displayOptions.NEWEST

window.shopSetup = async () => {
    changeTitleBarBackground("rgb(255, 210, 15)")
    changeContentBackground("rgb(255, 210, 15)")

    alreadyLoading = false
    lastUpdate = moment.unix(LAST_UPDATE_DATES[LAST_UPDATE_IDS.SHOP])
    document.getElementById("product-display-update-in").appendChild(daysCounter.createCounter("product-display-counter"))
    let sortBy = document.getElementById("sort-by")
    sortBy.getElementsByTagName("option")[currentDisplay-1].selected = 'selected'
    sortBy.onchange = handleSelectChange

    if(!shopInfos){
        let arr = get_shopInfos_from_db(connection, userInfo.id)
        shopInfos = arr[0]
        websiteIdLookup = arr[1]
    }

    if(!products) products = get_all_products_from_db(connection, userInfo.id)

    let productsValues = getValuesFromObj(products)
    let productLength = productsValues.length

    productNodes = get_products_component(productsValues)
    displayAllProducts(products, productNodes)
    
    let today = moment()
    if(productLength>0 && today.isAfter(lastUpdate, "days")){
        let updateBtn = document.getElementById("updating-btn")
        updateBtn.style.display = "initial"

        await update_invalid_prices(database, products, productsValues)
        updateLastUpdateDate(LAST_UPDATE_IDS.SHOP, today.unix())
        lastUpdate = today

        updateBtn.style.display = "none"
    }
}

function newstDisplay(products, nodes){
    let fragment = document.createDocumentFragment()
    for(let value in nodes){
        fragment.prepend(nodes[value])
    }

    return fragment
}

function oldestDisplay(products, nodes){
    let fragment = document.createDocumentFragment()
    for(let value in nodes){
        fragment.appendChild(nodes[value])
    }

    return fragment
}

function lowestPriceDisplay(products, nodes){
    let ordenedArr = getValuesFromObj(products).sort((a, b) => a.price.value<b.price.value?-1:1)
    let fragment = document.createDocumentFragment()
    let length = ordenedArr.length

    for(let i=0; i<length; i++) fragment.appendChild(nodes[ordenedArr[i].id])

    return fragment
}

function biggerPriceDisplay(products, nodes){
    let ordenedArr = getValuesFromObj(products).sort((a, b) => a.price.value<b.price.value?-1:1)
    let fragment = document.createDocumentFragment()
    let length = ordenedArr.length

    for(let i=0; i<length; i++) fragment.prepend(nodes[ordenedArr[i].id])

    return fragment
}

function websiteNameDisplay(products, nodes){
    let sortedWebsites = getValuesFromObj(shopInfos).sort((a,b) => a.name.localeCompare(b.name))
    let websiteProducts = {}

    for(let key in products){
        let {id, website_id} = products[key]
        let websiteProduct = websiteProducts[website_id]
        if(websiteProduct) websiteProduct.prepend(nodes[id])
        else{
            websiteProduct = document.createElement("div")
            websiteProduct.prepend(nodes[id])
            websiteProducts[website_id] = websiteProduct
        }
    }

    let fragment = document.createDocumentFragment()
    for(let i=sortedWebsites.length-1; i>=0; i--){
        let shopInfo = sortedWebsites[i]
        fragment.prepend(WebsiteProducts(shopInfo, websiteProducts[shopInfo.id]))
    }

    return fragment
}

function displayAllProducts(products, nodes, displayOpc = currentDisplay){
    let element = document.getElementById(displayElementId)

    while(element.firstChild) element.removeChild(element.firstChild)

    element.className = displayOpc === displayOptions.WEBSITE_NAME? "website-set": "products-set"
    element.appendChild(displayFunctions[displayOpc](products, nodes))
}

function addProductToNewest(product, productNode){
    document.getElementById(displayElementId).prepend(productNode)
}

function addProductToOldest(product, productNode){
    document.getElementById(displayElementId).appendChild(productNode)
}

function addProductToLower(product, productNode){
    let mainDiv = document.getElementById(displayElementId)
    let childNodes = document.getElementById(displayElementId).childNodes
    let elementAfter = binary_search(0, childNodes.length, childNodes, product.price.value)

    if(elementAfter) mainDiv.insertBefore(productNode, elementAfter)
    else mainDiv.appendChild(productNode)
}

function addProductToBigger(product, productNode){
    let mainDiv = document.getElementById(displayElementId)
    let childNodes = document.getElementById(displayElementId).childNodes
    let elementAfter = binary_search_desc(0, childNodes.length, childNodes, product.price.value)
    
    if(elementAfter) mainDiv.insertBefore(productNode, elementAfter)
    else mainDiv.appendChild(productNode)
}

function addProductToWebsiteName(product, productNode){
    document.getElementById(`website-${product.website_id}`).prepend(productNode)
}

function handleSelectChange(event){
    let option = parseInt(event.target.value)
    if(option !== currentDisplay){
        currentDisplay = option
        displayAllProducts(products, productNodes)
    }
}

function deleteProduct(productId){
    document.getElementById(productId).remove()
    delete_product(connection, userInfo.id, productId)
    delete products[productId]
    delete productNodes[productId]
}

function goToProduct(productId){
    let product = products[productId]
    let shopInfo = shopInfos[product.website_id]
    goTo( "../pages/product.html", {product, shopInfo})
}

function _getIdFromNode(node){
    return node?parseInt(node.id):null
}

function binary_search(start, end, nodes, value){
    if(end-start <= 1){
        return value>products[_getIdFromNode(nodes[start])].price.value? nodes[start+1]: nodes[start]
    }
    
    let middle = start + ((end-start)>>1)
    
    if(value>products[_getIdFromNode(nodes[middle])].price.value){
        let productId = _getIdFromNode(nodes[middle+1])
        
        if(!productId || value<products[productId].price.value) return nodes[middle+1]
        else return binary_search(middle, end, nodes, value)
    }else return binary_search(start, middle, nodes, value)
}

function binary_search_desc(start, end, nodes, value){
    if(end-start <= 1){
        return value>products[_getIdFromNode(nodes[start])].price.value? nodes[start]: nodes[start+1]
    }
    
    let middle = start + ((end-start)>>1)
    
    if(value<products[_getIdFromNode(nodes[middle])].price.value){
        let productId = _getIdFromNode(nodes[middle+1])
        
        if(!productId || value<products[productId].price.value) return nodes[middle+1]
        else return binary_search_desc(middle, end, nodes, value)
    }else return binary_search_desc(start, middle, nodes, value)
}

function get_products_component(products){
    let nodes = {}
    
    for(let i=products.length-1; i>=0; i--){
        let product = products[i]
        product.price = get_most_recent_price(connection, product.id)
        let imgSrc = get_img_src(product.id)
        let faviconSrc = get_favicon_src(product.website_id)
        let websiteName = shopInfos[product.website_id].name
        
        nodes[product.id] = ProductCard(product, imgSrc, faviconSrc, websiteName, goToProduct, () => {deleteProduct(product.id)}, openInBrowser)
    }
    
    return nodes
}

async function update_invalid_prices(connection, products, productValues=null){
    let newPrices = await fetch_invalid_prices(productValues? productValues: getValuesFromObj(products), shopInfos)
    let date = moment().unix()
    
    for(let i=newPrices.length-1; i>=0; i--){
        let {product, currency, value} = newPrices[i]
        let diff = value - product.price.value
        let id = product.id
        save_price(connection, currency, value, id, date, false)
        
        if(diff !== 0){
            product.price.value = value
            document.getElementById(`${id}-price`).classList.add("older-price")
            document.getElementById(`${id}-price-info`).append(NewPrice(id, diff, currency, value))
        }
    }
}

window.hideElement = function hideElement(elementId){
    document.getElementById("body").style.filter = "none"
    document.getElementById(elementId).style.webkitAnimationName = ""
    document.getElementById(elementId).style.webkitAnimationName = "pull-tag"
    setTimeout(() => {document.getElementById(elementId).style.display = "none"}, 1000)
}

function showElement(elementId, display){
    document.getElementById("body").style.filter = "blur(5px)"
    document.getElementById(elementId).style.display = display
    document.getElementById(elementId).style.webkitAnimationName = ""
}

function setupProductDisplay(product, faviconSrc, siteName){
    daysCounter.reset()
    document.getElementById("product-display-favicon").src = faviconSrc
    document.getElementById("product-display-website-name").innerText = siteName
    let currency, value
    
    if(product.alreadyStored){
        ({currency, value} = product.price)
        value = convert_price_from_db(currency, value).toFixed(getDecimalPlaces(currency))
        document.getElementById("product-display-name").innerHTML = product.name
        document.getElementById("product-display-img").src = get_img_src(product.id)
    }else{
        ([currency, value] = product[ProductProperties.PRICE][PriceProperties.PRICE])
        document.getElementById("product-display-img").src = product[ProductProperties.IMG][ImgProperties.TAG].src
        document.getElementById("product-display-name").innerHTML = replaceAll(product[ProductProperties.TITLE][TitleProperties.TITLE], "-", '&#8209;')
    }
    
    document.getElementById("product-display-price").innerText = `${currency}${value}`
}

function setStoreInfo(product, productInfo, shopInfo){
    return {product, productInfo, shopInfo}
}

function addProductToProducts(product, imgSrc, faviconSrc, websiteName){
    let productNode = ProductCard(product, imgSrc, faviconSrc, websiteName, goToProduct, () => {deleteProduct(product.id)}, openInBrowser)
    addToProductsFuncs[currentDisplay](product, productNode)
    products[product.id] = product
    productNodes[product.id] = productNode
}

function getShopInfo(mainUrl){
    let websiteId = websiteIdLookup[mainUrl]
    
    if(!websiteId){
        let shopInfo = get_shopWebsiteInfo(connection, null, mainUrl)
        if(shopInfo){
            websiteIdLookup[mainUrl] = shopInfo.id
            shopInfos[shopInfo.id] = shopInfo
            return shopInfo
        }
    }
    
    return shopInfos[websiteId]
}

window.handleStore = async () => {
    hideElement("product-display")
    let { product } = storeInfo
    product.update_in = daysCounter.currentValue
    
    try{
        if(storeInfo.productInfo){
            let [newProduct, shopInfo] = await store(connection, userInfo.id, product, storeInfo.productInfo, null)
            websiteIdLookup[shopInfo.url] = shopInfo.id
            shopInfos[shopInfo.id] = shopInfo
            
            addProductToProducts(newProduct, product[ProductProperties.IMG][ImgProperties.TAG].src, storeInfo.productInfo.faviconUrl, storeInfo.productInfo.websiteName)
        }else{
            let {shopInfo} = storeInfo
            if(product.alreadyStored){
                store_user_shop_product(connection, userInfo.id, product.id, product.update_in)
                addProductToProducts(product, get_img_src(product.id), get_favicon_src(shopInfo.id), shopInfo.name)
            }else{
                let [newProduct, _] = await store(connection, userInfo.id, product, null, storeInfo.shopInfo)
                addProductToProducts(newProduct, product[ProductProperties.IMG][ImgProperties.TAG].src, get_favicon_src(shopInfo.id), shopInfo.name)
            }
        }

    }catch (error){
        console.log(error)
        showMessage(MESSAGE_TYPES.ERROR, "What??", "Something strange happened and I couldn't save the product. Try again!")
    }
    
    storeInfo = {}
}

async function fetchProduct(url){
    if(url){
        try{
            let mainUrl = get_main_url(url)
            let shopInfo = getShopInfo(mainUrl)
            
            if(shopInfo){
                let product = get_product_by_url(database, url, shopInfo.id)

                if(product){
                    product.price = get_most_recent_price(database, product.id)
                    if(product.price.date>=todayTimestamp) product.alreadyStored = true
                    else product = undefined
                }

                if(!product) product = await get_known_product(url, shopInfo)
                
                if(product){
                    console.log(product)
                    setupProductDisplay(product, get_favicon_src(shopInfo.id), shopInfo.name)
                    storeInfo = setStoreInfo(product, null, shopInfo)
                }
            }else{
                let productInfo = await get_unknown_product(url, mainUrl)
                
                if(productInfo){
                    console.log(productInfo)
                    let [product, info] = productInfo
                    setupProductDisplay(product, info.faviconUrl, info.websiteName)
                    storeInfo = setStoreInfo(product, info, null)
                }
            }
        
            showElement("product-display", "block")
        }catch (error){
            if(error instanceof InvalidProduct){
                showMessage(MESSAGE_TYPES.ERROR, "Hmm... Are you sure?", "Sorry, but I couldn't identify any product in this page!")
            }else showMessage(MESSAGE_TYPES.ERROR, "What language is this?", "Wow, I can't read this website's language. Maybe I should improve my set of languages")
        }finally{
            alreadyLoading = toggleLoadingButton("add-product-btn")
        }
    }
}

window.handleSearchClick = async () => {
    let searchInput = document.getElementById("search-input")
    let url = searchInput.value
    
    if(url && !alreadyLoading){
        alreadyLoading = toggleLoadingButton("add-product-btn")
        fetchProduct(url)
        searchInput.value = ""
        searchInput.className = "hide-search-input"
    }else searchInput.className = "show-search-input"
}

$(document).ready(() => {
    shopSetup()
    setRenderFunction(shopSetup)
})