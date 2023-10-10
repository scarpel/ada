import { ParsedProductProperties, TitleProperties, TAG_ID_PRIORITY, PriceProperties, ImgProperties, SEPARATORS_SET, ProductProperties } from "./shopDataTypes.js"
import { get } from "./utils.js"
// import { predictPrice, predictImg } from "../ Shop.shopPredictor"
// from Utils.websiteUtils import { get_main_url } from "./websi"
// from .databaseUtils import { get_last_id, insert }
import { SHOP_PRODUCTS, SHOP_TITLE_IDS, SHOP_IMG_IDS, SHOP_PRICES, SHOP_WEBSITES } from "../consts/databaseConsts.js"

const imgComparisonProps = [...TAG_ID_PRIORITY, "src", "width", "height"]

function doFetchJavascriptPage(parsedProduct){
    if(parsedProduct[ParsedProductProperties.TITLE].length === 0 || 
        parsedProduct[ParsedProductProperties.PRICES].length<5 || 
        parsedProduct[ParsedProductProperties.IMGS].length<5)
        return true
    else return false
}

function doRunJavascript(parsedProduct){
    if(parsedProduct && parsedProduct[ParsedProductProperties.TITLE].length && parsedProduct[ParsedProductProperties.PRICES].length && parsedProduct[ParsedProductProperties.IMGS].length)
        return false
    else return true
}

function isSameTag(firstTag, secondTag, comparisonProperties=null){
    if(get(firstTag, "tag", null) !== get(secondTag, "tag", null)) return false
    if(!comparisonProperties) comparisonProperties = TAG_ID_PRIORITY

    for (let prop of comparisonProperties)
        if(get(firstTag, prop, null) != get(secondTag, prop,null)) return false
    
    return true
}

function _isSameTag(firstTag, secondTag, comparisonProperties=null){
    if(firstTag && secondTag) return isSameTag(firstTag, secondTag, comparisonProperties)
    else if(!firstTag && !secondTag) return true
    else return false
}

function isSameTitle(firstTitle, secondTitle){
    if(firstTitle && secondTitle){
        if(firstTitle[TitleProperties.TITLE] !== secondTitle[TitleProperties.TITLE] || !isSameTag(firstTitle[TitleProperties.TAG], secondTitle[TitleProperties.TAG]))
            return false
        else return true
    }else if(!firstTitle && !secondTitle) return true
    else return false
}

function isSamePrice(firstPrice, secondPrice){
    if(firstPrice && secondPrice){
        if(firstPrice[PriceProperties.PRICE] !== secondPrice[PriceProperties.PRICE] || !isSameTag(firstPrice[PriceProperties.TAG], secondPrice[PriceProperties.TAG]))
            return false
        else return true
    }else if(!firstPrice && !secondPrice) return true
    else return false
}

function isSameImg(firstImg, secondImg){
    if(firstImg && secondImg){
        firstImg = firstImg[ImgProperties.TAG]
        secondImg = secondImg[ImgProperties.TAG]

        if(isSameTag(firstImg, secondImg, imgComparisonProps) && _isSameTag(get(firstImg, "parent", null), get(secondImg, "parent", null))) 
            return true
        else return false
    }else if(!firstImg && !secondImg) return true
    else return false
}

function isSameProduct(firstProduct, secondProduct){
    if(firstProduct && secondProduct)
        return isSameTitle(firstProduct[ProductProperties.TITLE], secondProduct[ProductProperties.TITLE]) && isSamePrice(firstProduct[ProductProperties.PRICE], secondProduct[ProductProperties.PRICE]) && isSameImg(firstProduct[ProductProperties.IMG], secondProduct[ProductProperties.IMG])
    else if(!firstProduct && !secondProduct) return true
    else return false
}

function getLastIndexes(text){
    let indexes = {}
    let length = text.length

    for(let i=0; i<length; i++){
        indexes[i] = i
    }

    return indexes
}

function getFurtherIndexOfSet(text, separatorsSet){
    let index = -1

    for (let separator of separatorsSet){
        let newIndex = text.lastIndexOf(separator)
        if(newIndex>index) index = newIndex
    }
    
    return index !== -1? index: undefined
}

function trimTitle(title, separatorsSet=SEPARATORS_SET, minDistancePercentage=0.75){
    let index = getFurtherIndexOfSet(title, separatorsSet)
    
    if(index && (index/title.length)>=minDistancePercentage)
        return title.slice(0, index)
    else return title
}

// function get_HTML_Session(){
//     let session = new HTMLSession()
//     session.headers.update({"user-agent":'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36'})
//     return session
// }

// function isSameTagWithIn(orinalObjectfied, otherFullTag){
//     return `${orinalObjectfied["tag"]}` in otherFullTag && get(orinalObjectfied, "class", "") in otherFullTag && get(orinalObjectfied, "id", "") in otherFullTag && get(orinalObjectfied, "itemprop", "") in otherFullTag
// }

function hasSameTagProperties(orinalObjectfied, comparisonObjectfied){
    return get(orinalObjectfied, "class", null) === get(comparisonObjectfied, "class", null) && get(orinalObjectfied, "id", null) === get(comparisonObjectfied, "id", null) && get(orinalObjectfied, "itemprop", null) == get(comparisonObjectfied, "itemprop", null)
}

function hasSomePropertiesInSet(tagObjectfied, setIdentifiers){
    for (let id of TAG_ID_PRIORITY){
        if(setIdentifiers.has(get(tagObjectfied, id, null)))
            return true
    }

    return false
}

function isProductValid(product){
    return product && product[ProductProperties.TITLE] && product[ProductProperties.PRICE] && product[ProductProperties.IMG]
}

// function store_product(cursor, product, shopInfo){
//     let product_id = get_last_id(cursor, SHOP_PRODUCTS)
//     product_id = product_id? product_id+1: 1

//     let [titleAdded, imgAdded] = shopInfo.updateWithProduct(product)

//     for (let titleClass in titleAdded){
//         insert(cursor, SHOP_TITLE_IDS, "?,?", [titleClass, shopInfo.website_id])
//     }

//     for (let imgClass in imgAdded){
//         insert(cursor, SHOP_IMG_IDS, "?,?", [imgClass, shopInfo.website_id])
//     }

//     insert(cursor, SHOP_PRODUCTS, "?, ?, ?, ?, ?", [null, product["url"], product[ProductProperties.TITLE][TitleProperties.TITLE], "cu", shopInfo.website_id])
    
//     let [currency, value] = product[ProductProperties.PRICE][PriceProperties.PRICE]
//     insert(cursor, SHOP_PRICES, "?, ?, ?, ?, ?", [null, currency, convert_price(value), str(date.today()), product_id])
// }

// function store_shop_website(cursor, shopInfo, directory){
//     let website_id = get_last_id(cursor, SHOP_WEBSITES)
//     website_id = website_id? website_id+1: 1

//     insert(cursor, SHOP_WEBSITES, "?,?,?,?,?", [null, shopInfo.url, shopInfo.name, shopInfo.url_id, shopInfo.hasJavascript])
//     shopInfo.website_id = website_id

//     let favName = `${shopInfo.url_id}.ico`
//     try{
//         rename(join(directory, TEMP, favName), join(directory, FAVICONS, favName))
//     }catch(FileExistsError){}
// }

export { imgComparisonProps, doFetchJavascriptPage, doRunJavascript, _isSameTag, isSameTitle, isSameImg, isSamePrice,
    isSameProduct, getLastIndexes, getFurtherIndexOfSet, trimTitle, hasSameTagProperties,
    hasSomePropertiesInSet, isProductValid }  