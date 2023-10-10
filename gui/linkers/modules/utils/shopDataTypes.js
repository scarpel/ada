import { WebsiteInfo } from "./dataTypes.js"
import { get_domain } from "../utils/websiteUtils.js"
import { get } from "./utils.js"

const ITEMPROP = "itemprop"
const ID = "id"
const CLASS = "class"

const TAG_ID_PRIORITY = [ITEMPROP, ID, CLASS]
const REQUIRED_FIELDS = new Set(["src", "width", "height", "id", "class", "itemprop", "data-a-dynamic-image", "data-src", "data-desktop-src"])
const IDENTIFIERS_WITHOUT_CLASS = [ITEMPROP, ID]

const SEPARATORS_SET = new Set(["|", "{", "-"])

const PriceProperties = {
    ID: 1,
    TAG: 2,
    PRICE: 3,
    PRICE_ID: 4
}

const ImgProperties = {
    ID: 1,
    TAG: 2
}

const TitleProperties = {
    ID: 1,
    TAG: 2,
    TITLE: 3,
    FULL_TAG: 4
}

const ParsedProductProperties = {
    TITLE: 1,
    IMGS: 2,
    PRICES: 3,
    BREADCRUMB: 4
}

const ProductProperties = {
    TITLE: 1,
    IMG: 2,
    PRICE: 3,
    URL: 4,
    BREADCRUMB: 5
}

class ShopWebsiteInfo extends WebsiteInfo{
    constructor(id, url, domain, name, hasJavascript=false, titleIds=null, imgIds=null){
        super(id, url, domain, name)
        this.titleIdentifiers = titleIds? titleIds: new Set()
        this.imgIdentifiers = imgIds? imgIds: new Set()
        this.hasJavascript = hasJavascript
    }

    toString(){
        return [
            `${this.name}: ${this.url}`,
            `  - Website ID: ${this.website_id}`,
            `  - Favicon Name: ${this.url_id}.ico`,
            `  - Has Javascript? ${this.hasJavascript}`,
            `  - Titles IDs: ${this.titleIdentifiers}`,
            `  - Images IDs: ${this.imgIdentifiers}`
        ].join("\n")
    }

    _addToIdentifiers(tagObjectfied, identifiersSet){
        let addedAtLeastOne = false
        let added = []
        let tag = tagObjectfied["tag"]

        for (let id of IDENTIFIERS_WITHOUT_CLASS){
            let tagClass = get(tagObjectfied, id, null)
            if(tagClass){
                tagClass = `${id}.${tagClass}`

                if(!identifiersSet.has(tagClass)){
                    identifiersSet.add(id)

                    added.push(tagClass)
                    addedAtLeastOne = true
                }else return []
            }
        }
        
        if(!addedAtLeastOne){
            let tagClass = tagObjectfied[CLASS]
            if(tagClass){
                tagClass = `${CLASS}.${tagClass}`
                
                if(!identifiersSet.has(tagClass)){
                    identifiersSet.add(tagClass)
                    added.push(tagClass)
                }
            }
        }
        
        return added
    }

    addToTitleIdentifiers(tagObjectfied){
        return this._addToIdentifiers(tagObjectfied, this.titleIdentifiers)
    }
    
    addToImgIdentifiers(tagObjectfied){
        return this._addToIdentifiers("parent" in tagObjectfied? tagObjectfied["parent"]: tagObjectfied, this.imgIdentifiers)
    }
    
    updateWithProduct(product){
        if(product)
            return [this.addToTitleIdentifiers(product[ProductProperties.TITLE][TitleProperties.TAG]), this.addToImgIdentifiers(product[ProductProperties.IMG][ImgProperties.TAG])]
    }
    
    static from_db(info, titleIds, imgIds){
        return new this(info.id, info.url, get_domain(info.url), info.name, info.hasJavascript? true:false, titleIds, imgIds)
    }
}
        
class ShopWebsitesInfo{
    _websiteInfo = {}

    addWebsiteInfo(websiteInfo){
        this._websiteInfo[websiteInfo.url] = websiteInfo
    }
    
    removeWebsiteInfo(url){
        delete this._websiteInfo[url]
    }
    
    get(url, notFound){
        return get(this._websiteInfo, url, notFound)
    }
}

function getTagDictId(objectfied){
    if("tag" in objectfied){
        let arr = [objectfied["tag"]]

        for (let id of TAG_ID_PRIORITY)
            if(id in objectfied) arr.push(`${id}="${objectfied[id]}"`)
        
        return arr.join(" ")
    }else return null
}    

function get_product_obj(title, img, price){
    return {
        [ProductProperties.TITLE]: title,
        [ProductProperties.IMG]: img,
        [ProductProperties.PRICE]: price
    }
}

export { ITEMPROP, ID, CLASS, TAG_ID_PRIORITY, REQUIRED_FIELDS, IDENTIFIERS_WITHOUT_CLASS, SEPARATORS_SET,
    PriceProperties, ImgProperties, TitleProperties, ParsedProductProperties, ProductProperties, ShopWebsiteInfo,
    ShopWebsitesInfo, getTagDictId, get_product_obj }