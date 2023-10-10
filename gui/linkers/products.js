import {fetch_html, fetch_js, download_img} from "./modules/utils/htmlFetcher.js"
import { get_browser_info } from "./modules/utils/browserUtils.js"
import { ShopHTMLParser } from "./modules/shop/shopParser.js"
import { predict, isBiggerThanStr,isPriceLower } from "./modules/shop/shopPredictor.js"
import { find_space_after_last_letter, find_and_go_after } from "./modules/utils/strFuncs.js"
import { get_tag_content, get_start_end_tag, objectifyTag } from "./modules/utils/htmlUtils.js"
import { get_product, store, get_tagId_from_table, get_most_recent_price, get_product_from_db, get_all_products_from_db, get_last_n_prices, get_product_like_db, delete_product, get_shopInfos_from_db, fetch_invalid_prices, get_product_price, save_price } from "./modules/shop/shopFacade.js"
import { trim_url_protocols, get_main_url, get_domain } from "./modules/utils/websiteUtils.js"
import {ProductProperties, ImgProperties, TitleProperties, PriceProperties, ShopWebsiteInfo, ParsedProductProperties} from "./modules/utils/shopDataTypes.js"
import { getValuesFromObjAsArray } from "./modules/utils/utils.js"
import { get_formatted_date } from "./modules/utils/dateUtils.js"
import { convertPriceToFloat, get_difference_percentage, add_dot, convert_price_to_db } from './modules/utils/priceFuncs.js'
import { FAVICONS, PRODUCT_IMAGES } from "./modules/consts/paths.js"
import ProductCard from "./components/ProductCard.js"
import { SHOP_PRODUCTS } from "./modules/consts/databaseConsts.js"
import {get_price_and_currency, convert_price_from_db} from "./modules/utils/priceFuncs.js"
import NewPrice from "./components/NewPrice.js"
import Counter from "./components/Counter.js"

const Database = require("better-sqlite3")
const { remote } = require("electron")
const path = require("path")
const fs = require("fs")
const moment = require("moment")

const connection = new Database("shopTeste.sqlite", {verbose: console.log})
let shopInfos = {}
let websiteIdLookup = {}
let lastProduct, lastShopInfo;
const counter = new Counter(1, 1, 7)

function parseShopInfo(info, titleIds=null, imgIds=null){
    if(info) return new ShopWebsiteInfo(info.id, info.url, get_domain(info.url), info.name, info.websiteTag, Boolean(info.hasJavascript), titleIds, imgIds)
    else return info
}

function deleteProduct(productId){
    document.getElementById(productId).remove()
    delete_product(connection, productId)
}

function addProduct(product, imgSrc, faviconSrc, websiteId){
    product = get_product_like_db(product, websiteId)
    document.getElementById("display").prepend(ProductCard(product, imgSrc, faviconSrc, (() => deleteProduct(product.id)), product.price))
}

function getShopInfo(mainUrl){
    let shopInfo = shopInfos[mainUrl]
    if(!shopInfo){
        let info = connection.prepare(`SELECT * FROM websites WHERE url = '${mainUrl}'`).get()

        if(info){
            let titleIds = new Set(getValuesFromObjAsArray(connection.prepare(`SELECT tag_id FROM title_ids WHERE website_id=${info.id}`).all(), "tag_id"))
            let imgIds = new Set(getValuesFromObjAsArray(connection.prepare(`SELECT tag_id FROM img_ids WHERE website_id=${info.id}`).all(), "tag_id"))
            shopInfo = ShopWebsiteInfo.from_db(info, titleIds, imgIds)
            shopInfos[mainUrl] = shopInfo
        }
    }

    return shopInfo
}

const urls = [
    "https://www.saraiva.com.br/vade-mecum-tradicional-28-ed-2019-10577142/p",
    "https://www.bestbuy.ca/en-ca/product/star-wars-the-rise-of-skywalker-blu-ray-combo/M2231709",
    "https://www.saraiva.com.br/the-last-of-us-part-ii-ps4-10650654/p"
]

window.cu = async function cu(){
    let start = new Date().getTime()
    console.log(await fetch_all_js(urls, 30, false))
    console.log((new Date().getTime() - start)/1000)
    // start = new Date().getTime()
    // for(var i=0; i<3; i++){
    //     await fetch_js(urls[i], undefined, 50000)
    // }
    // console.log((new Date().getTime() - start)/1000)
}

// function teste(){
//     let url = document.getElementById("product-url").value

//     fetch(url)
//         .then(response => {
//             if(response.ok){
//                 response.blob()
//                     .then(blob => {
//                         fs.writeFile("cu.png", blob, 'binary', (err) => console.log(err))
//                         // saveAs
//                         // FileSaver.saveAs(blob, "teste.png")
//                         // console.log("Pronto!")
//                     })
//             }else console.log("Deu ruim!")
//         })
// }

window.onload = async () => {
    document.getElementById("card-counter").append(counter.createCounter())

    // [shopInfos, websiteIdLookup] = get_shopInfos_from_db(connection)

    // let products = get_all_products_from_db(connection)
    // console.log(products)
    // let productsObj = {}
    // products.map(product => {
    //     product.price = get_most_recent_price(connection, product.id)
    //     let src = path.join(remote.getGlobal("mainPath"), PRODUCT_IMAGES, `${product.id}.png`)
    //     let faviconSrc = path.join(remote.getGlobal("mainPath"), FAVICONS, `${product.website_id}.ico`)
    //     document.getElementById("display").prepend(ProductCard(product, src, faviconSrc, (() => deleteProduct(product.id))))

    //     productsObj[product.id] = product
    // })

    // let start = new Date().getTime()
    // let newPrices = await fetch_invalid_prices(products, shopInfos)

    // console.log(newPrices)
    // newPrices.map(priceObj => {
    //     let diff = priceObj.value - productsObj[priceObj.id].price.value
    //     if(diff){
    //         save_price(connection, priceObj.currency, priceObj.value, priceObj.id, false)
    //         document.getElementById(`${priceObj.id}-price`).classList.add("older-price")
    //         let newPrice = NewPrice(priceObj.currency, convert_price_from_db(priceObj.currency, diff))
    //         document.getElementById(`${priceObj.id}-price-info`).append(newPrice)
    //     }
    // })
    // console.log((new Date().getTime() - start)/1000)
}

window.t = async function t(){
    document.getElementById("frame").src = "../pages/product.html"
}

window.hide = function hide(elementId){
    document.getElementById(elementId).style.display = "none";
    document.getElementById("below").style.filter = "none"
    document.getElementById("below").style.filter = "none"
}

function show(elementId, display="flex"){
    document.getElementById(elementId).style.display = "flex"
    document.getElementById("below").style.filter = "blur(10px)"
}

function setupProduct(productInfo){
    if(productInfo){
        counter.reset()

        let {faviconUrl, siteName, ...product} = productInfo
        if(lastShopInfo){
            document.getElementById("favicon").src = path.join(remote.getGlobal("mainPath"), FAVICONS, (lastShopInfo.id+".ico"))
            document.getElementById("website-name").innerHTML = lastShopInfo.name
        }else{
            document.getElementById("favicon").src = faviconUrl
            document.getElementById("website-name").innerHTML = siteName
        }

        document.getElementById("card-img").src = product[ProductProperties.IMG][ImgProperties.TAG]["src"]
        document.getElementById("card-title").innerHTML = product[ProductProperties.TITLE][TitleProperties.TITLE]
        document.getElementById("card-price").innerHTML = product[ProductProperties.PRICE][PriceProperties.PRICE].join("")
    }
}

function update(text){
    document.getElementById("loading-text").innerHTML = text
}

async function handleFetchProduct(url){
    let mainUrl = get_main_url(url)
    let shopInfo = getShopInfo(mainUrl)
    let product = await get_product(url, mainUrl, shopInfo, update, 50)
    if(product){
        lastProduct = product
        lastShopInfo = shopInfo
    }

    return product
}

window.brow = async function brow(){
    show("loading")
    let start = new Date().getTime()
    let productInfo = await handleFetchProduct(document.getElementById("product-url").value)
    document.getElementById("product-url").value = ""
    hide("loading")
    if(productInfo){
        setupProduct(productInfo)
        show("card")
    }
    console.log((new Date().getTime()-start)/1000)
}

window.store = async () => {
    lastProduct.updateIn = counter.currentValue
    let [product, shopInfo] = await store(connection, lastProduct, lastShopInfo, remote.getGlobal("mainPath"))
    hide("card")
    let faviconUrl = product.faviconUrl? product.faviconUrl: path.join(remote.getGlobal("mainPath"), FAVICONS, `${lastShopInfo.id}.ico`)

    addProduct(product, product[ProductProperties.IMG][ImgProperties.TAG]["src"], faviconUrl, shopInfo.id)
    lastProduct = lastShopInfo = null
}

window.getDec = () => {
    console.log(convert_price_from_db("R$", document.getElementById("product-url").value))
}