import { index_after, get_until, count_last_spaces } from "../utils/strFuncs.js"
import { get_body_or_main, get_tag_property, get_tag_content, decode_html_text, objectifyTag, get_link_from_data_dynamic, isEndTag } from "../utils/htmlUtils.js"
import { PriceProperties, ImgProperties, TitleProperties, ParsedProductProperties, REQUIRED_FIELDS, TAG_ID_PRIORITY } from "../utils/shopDataTypes.js"
import { get_price_and_currency, check_after_price, check_for_price_interval } from "../utils/priceFuncs.js"
import { hasSomePropertiesInSet, trimTitle } from "../utils/shopUtils.js"
import { get, lTrim, count } from "../utils/utils.js"
import { getBreadcrumbers } from "../utils/breadcrumberFinder.js"

const defaultDesirableTags = new Set(["div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "br", "source", "form", "fieldset", "header", "strong", "figure", "td", "tr", "tbody", 
    "table", "button", "bdi", "em"])
const unaryTags = new Set(["img", "text", "br", "hr"])

const tagIdentifiersPriority = TAG_ID_PRIORITY
const lenTagIdentifiersPriority = tagIdentifiersPriority.length

const containerTags = new Set(["div", "li", "fieldset", "tr", "table", "button", "em"])
const InvalidPriceClassKeywords = ["strike", "coupon", "checkout", "saving", "shipping"]

const ParseStatus = {
    HALTED: 1,
    PARSING: 2,
    PRICE_INTERVAL: 3,
    SUCCESS: 4
}

class ShopHTMLParser{
    constructor(desirableTags=null, minSizePerc = 0.35, maxSizePerc=1.5, minEqualityPerc=0.3){
        this.desirableTags = desirableTags? desirableTags: defaultDesirableTags
        this.minSizePerc = minSizePerc
        this.maxSizePerc = maxSizePerc
        this.minEqualityPerc = minEqualityPerc
        this.invalidTagStart = new Set(["!", "?"])
    }

    _getMinEqualityPerc = () => {
        let value = Math.floor(this.titleSetLength * this.minEqualityPerc)
        return value>0? value: 1
    }

    _cleanVariables = () => {
        this.parents = []
        this.index = 0
        this.possibleTitles = 0
        this.imgs = []
        this.prices = []
        this.texts = [[]]
        this.countText = 0
        this.countPrice = 0
        this.hasElegibleText = [false]
        this.objectfiedParent = null
        this.abortParsing = false
        this.status = ParseStatus.HALTED
        this.failedImgs = []
        this.titles = []
        this.addedToPrices = [false]
        this.breadcrumb = []
    }

    prepare_html = (rawHtml) => {
        return get_body_or_main(rawHtml).replaceAll("\n", "").replaceAll("\t"," ").replaceAll("\r","").replaceAll(String.fromCharCode(160), " ")
    }

    parse = (rawHtml, breadcrumb=undefined) => {
        if(!rawHtml) return null

        this.title = get_tag_content(rawHtml, "title", 0, rawHtml.length)

        if(this.title){
            this._cleanVariables()
            this.title = decode_html_text(this.title)
            this.titleSet = new Set(trimTitle(this.title).toLowerCase().split(" "))
            this.titleLength = this.title.length
            this.titleSetLength = this.titleSet.size
            this._minEqualityPerc = this._getMinEqualityPerc()

            this.html = this.prepare_html(rawHtml)
            this.endHtml = this.html.length
            this.status = ParseStatus.PARSING

            this._obtainTagArray(this._handleUnaryTag, this._handleTitle, this._handlePrice)
            this.breadcrumb = getBreadcrumbers(this.html, undefined, breadcrumb)
            console.log(this.breadcrumb)
            return this._getParsedObj()
        }else return null
    }
    
    get_prices(rawHtml){
        if(!rawHtml) return null

        this._cleanVariables()

        this.html = this.prepare_html(rawHtml)
        this.endHtml = this.html.length
        this.status = ParseStatus.PARSING

        this.possibleTitles = true
        this._obtainTagArray(() => {}, () => {}, this._handlePrice)
        
        return this.prices
    }

    _getParsedObj = () => {
        return {
            [ParsedProductProperties.TITLE]: this.titles,
            [ParsedProductProperties.IMGS]: this.imgs,
            [ParsedProductProperties.PRICES]: this.prices,
            [ParsedProductProperties.BREADCRUMB]: this.breadcrumb,
        }
    }

    _isValidTag = (tag) => {
        if(!this.invalidTagStart.has(tag[0])) return true
        else return false
    }

    _parseNonUsefulTag = (tag) => {
        let endTag = index_after(this.html, "</"+tag+">", this.index, this.endHtml)

        if(endTag != -1){
            let numPossibleTags = this._numAllPossibleTags(tag, this.index, endTag)

            while(numPossibleTags != 0){
                let index = endTag

                for(var i=0; i<numPossibleTags; i++){
                    endTag = index_after(this.html, "</"+tag+">", endTag, this.endHtml)
                    if(endTag === -1) break
                }

                numPossibleTags = this._numAllPossibleTags(tag, index, endTag)
            }

            this.index = endTag
        }
    }

    _numAllPossibleTags = (tag, start, end) => {
        let numPossibleTags = 0
        let fullTag = `<${tag}`
        let indexPossibleTag = this.html.find(fullTag, start, end)
        let endIndex = indexPossibleTag + fullTag.length

        while(indexPossibleTag != -1 && indexPossibleTag<end && [" ", ">"].indexOf(this.html[endIndex]) != -1){
            if(this._elegiblePossibleTag(indexPossibleTag)) numPossibleTags += 1
            indexPossibleTag = this.html.find(fullTag, index_after(this.html, ">", indexPossibleTag, end), end)
        }
        
        return numPossibleTags
    }

    _elegiblePossibleTag = (index) => {
        if(index>1){
            let lastChar = this.html.slice(index-2, index)
            if(lastChar != "\\n"){
                if(["'", '"'].indexOf(lastChar[1]) === -1) return true
            }
        }else if(index>0)
            if(["'", '"'].indexOf(this.html[index-1]) === -1) return true
        
        return false
    }

    _getObjectfiedParent = () => {
        if(!this.objectfiedParent){
            let [_, fullTag] = this.parents.last(-1)
            this.objectfiedParent = objectifyTag(fullTag, REQUIRED_FIELDS)
        }

        return this.objectfiedParent
    }

    _getID = (fullTag) => {
        let end = fullTag.length

        for(var i=0; i<lenTagIdentifiersPriority; i++){
            let id = get_tag_property(fullTag, tagIdentifiersPriority[i], 0, end)
            if(id) return (tagIdentifiersPriority[i], id)
        }
        
        return null
    }
    
    _treatIMG = (imgObj) => {
        let src = imgObj["src"]
        if(!src || (src.indexOf("http") === -1 && src.slice(0,2) !== "//")){
            let newSrc = get_link_from_data_dynamic(get(imgObj, "data-a-dynamic-image", null))
            if(newSrc){
                imgObj["src"] = newSrc
                delete imgObj["data-a-dynamic-image"]
            }else{
                let newSrc = get(imgObj, "data-desktop-src", null)
                if(newSrc){
                    imgObj["src"] = newSrc
                    delete imgObj["data-desktop-src"]
                }else return null
            }
        }

        return imgObj
    }

    _parseIMG = (fullTag) => {
        return this._treatIMG(objectifyTag(fullTag, REQUIRED_FIELDS))
    }

    _isIMGValid = (parsedImg) => {
        let parentClass = get_tag_property(this.parents.last(-1)[1], "class", 0)

        if(parentClass && parentClass.toLowerCase().indexOf("thumb") !== -1) return false

        if(parsedImg["itemprop"]) return true
        else{
            let imgClass = get(parsedImg,"class", "").toLowerCase()
            if(imgClass) return !["thumb", "hide"].some(item => imgClass.indexOf(item) !== -1)
            else return true
        }
        
        return false
    }
    
    _imgHasIdentifier = (imgObj) => {
        return get(imgObj, "itemprop", false) || get(imgObj, "id", false) || get(imgObj, "class", false)
    }

    _getTextScore = (textSet) => {
        let count = 0

        for(let word of textSet.values())
            if(this.titleSet.has(word)) count += 1

        return count
    }

    _isTitle = (text, lenText, tag) => {
        let division = lenText/this.titleLength
        if(division <= this.maxSizePerc){
            let textSet = new Set(text.toLowerCase().split(" "))
            let score = this._getTextScore(textSet)
            if(score>=this._minEqualityPerc || textSet.size === score || tag === "h1") return true
        }
    
        return false
    }

    _getTitleObj = (text, tagObj=null) => {
        return {
            [TitleProperties.ID]: this.countText,
            [TitleProperties.TAG]: tagObj? tagObj: this._getObjectfiedParent(),
            [TitleProperties.TITLE]: text
        }
    }

    _handleTitle = (text, lenText, tag) => {
        if(this._isTitle(text, lenText, tag)){
            if(this.parents.last(-1)[0] != this.parents.last(-1)[1]){
                let tagObj = this._getObjectfiedParent()

                if(tagObj.class || tagObj.id || tagObj.itemprop){
                    this.titles.push(this._getTitleObj(text, tagObj))
                    if(this.parents.last(-1)[0] === "h1") this.possibleTitles += 1
    
                    return true
                }
            }

            this.hasElegibleText[this.hasElegibleText.length-2] = true
        }
        
        return false
    }

    _handleTitleWithSet = (text, lenText) =>{
        let [tag, fullTag] = this.parents.last(-1)
        let division = lenText/this.titleLength

        if(division >= this.minSizePerc && division <= this.maxSizePerc){
            if(tag !== fullTag){
                let titleObj = objectifyTag(fullTag, REQUIRED_FIELDS)
                if(hasSomePropertiesInSet(titleObj, this.titleIdentifiers)){
                    this.titleTag = this._getTitleObj(text, titleObj)
                    this.possibleTitles += 1
                    return true
                }else this._getTextScore(text)
            }else this.hasElegibleText[this.hasElegibleText.length-2] = true
        }

        return false
    }

    _handlePrice = (text, lenText) =>{
        let [tag, fullTag] = this.parents.last(-1)

        if(lenText<150){
            let priceClass = get_tag_property(this.parents.last(-1)[1], "class", 0)
            let lower = priceClass.toLowerCase()

            if(!priceClass || !InvalidPriceClassKeywords.some(item => lower.indexOf(item) != -1)){
                let [price, indexes] = get_price_and_currency(text)

                if(price && text[0] !== "+"){
                    let [_, priceEnd] = indexes

                    if(priceEnd>=lenText || check_after_price(text.slice(priceEnd))){

                        if(fullTag.length > tag.length){
                            if(!this.addedToPrices.last(-1)){
                                this.countPrice += 1
                                this.prices.push(
                                    {
                                        [PriceProperties.ID]: this.countText,
                                        [PriceProperties.PRICE_ID]: this.countPrice,
                                        [PriceProperties.TAG]: this._getObjectfiedParent(),
                                        [PriceProperties.PRICE]: price
                                    }
                                )
                                this.addedToPrices[this.addedToPrices.length-1] = true
                            }

                            return true
                        }else{
                            this.hasElegibleText[this.addedToPrices.length-2] = true
                        }
                    }else if(check_for_price_interval(text.slice(priceEnd))){
                        this.abortParsing = true
                        this.status = ParseStatus.PRICE_INTERVAL
                        return true
                    }
                }
            }else{
                this.texts[this.texts.length-1].pop()
                return true
            }
        }
        
        return false
    }

    _getIMG = (imgObj) => {
        return {[ImgProperties.ID]: this.countText, [ImgProperties.TAG]: imgObj}
    }

    _handleText = (text, tag, handleTitle, handlePrice) => {
        text = decode_html_text(text.trim())
        let lenText = text.length
        if(lenText>0){
            if(this.possibleTitles>2) return handlePrice(text, lenText)
            else return handleTitle(text, lenText, tag)? true: handlePrice(text, lenText)
        }else return false
    }

    _handleUnaryTag = (tag, startTag, endTag) => {
        if(tag === "img"){
            let imgObj = this._parseIMG(this.html.slice(startTag, endTag))

            if(imgObj && this._isIMGValid(imgObj)){
                if(!this._imgHasIdentifier(imgObj))
                    imgObj["parent"] = this._getObjectfiedParent()
                
                this.imgs.push(this._getIMG(imgObj))
            }
        }
    }
    
    _handleUnaryTagWithSet = (tag, startTag, endTag) => {
        if(this.imgs.length === 0 && tag === "img"){
            let imgObj = this._parseIMG(this.html.slice(startTag, endTag))
            if(imgObj && this._isIMGValid(imgObj)){
                if(!this._imgHasIdentifier(imgObj)) imgObj["parent"] = this._getObjectfiedParent()

                let img = this._getIMG(imgObj)
                if(hasSomePropertiesInSet(imgObj, this.imgIdentifiers)) this.imgs.push(img)
                else this.failedImgs.push(img)
            }
        }
    }

    _obtainTagArray = (handleUnaryTag, handleTitle, handlePrice) => {
        while(this.index>-1 && this.index<this.endHtml){
            let startTag = this.html.find("<", this.index, this.endHtml)
            if(this.index !== startTag){
                let text = this.html.slice(this.index, startTag)
                if(text.length>1){
                    text = lTrim(text)
                    let lenText = text.length
                    let count = count_last_spaces(text, lenText)
                    if(count>1) text = text.slice(0, lenText-count)
                }
                
                if(text){
                    this.countText += 1
                    this.texts.last(-1).push(text)
                    this.hasElegibleText[this.hasElegibleText.length-1] = true
                }
            }
            
            let endTag = this.html.find(">", startTag, this.endHtml)
            let numberQuotes = count(this.html.slice(startTag, endTag), '"')
            
            while(numberQuotes%2 != 0){
                if(numberQuotes - (count(this.html.slice(startTag, endTag), '="')*2) != 1){
                    endTag += 1
                    let newEndTag = this.html.find(">", endTag)
                    numberQuotes += count(this.html.slice(endTag, newEndTag), '"')
                    endTag = newEndTag
                }else break
            }

            let tag = get_until(this.html, " ", startTag+1, endTag)
            if(isEndTag(tag)){
                let tagWithoutSlash = tag.slice(1)
                
                if(this.desirableTags.has(tagWithoutSlash) && this.parents.last(-1)[0] === tagWithoutSlash){
                    let lenCurrentText = this.texts.last(-1).length

                    if(lenCurrentText>0 && (this.hasElegibleText.last(-1) || lenCurrentText>1)){
                        let text = this.texts.last(-1).join("")
                        let worthIt = this._handleText(text, tagWithoutSlash, handleTitle, handlePrice)

                        if(this.addedToPrices.last(-1) && !worthIt){
                            this.prices.pop()
                        }else if((this.addedToPrices.last(-1) || !worthIt) && !containerTags.has(this.parents.last(-1)[0])){
                            this.texts.last(-2).push(text)
                            this.addedToPrices[this.addedToPrices.length-2] = this.addedToPrices.last(-1)
                        }else if(this.abortParsing){
                            this.titleTag = null
                            return null
                        }
                    }

                    this.texts.pop()
                    this.parents.pop()
                    this.hasElegibleText.pop()
                    this.objectfiedParent = null
                    this.addedToPrices.pop()
                }

                this.index = endTag+1
            }else{
                this.index = endTag+1

                if(this.desirableTags.has(tag)){
                    if(unaryTags.has(tag)) handleUnaryTag(tag, startTag, endTag)
                    else{
                        let fullTag = this.html.slice(startTag+1, endTag)
                        this.parents.push([tag, fullTag])
                        this.texts.push([])
                        this.hasElegibleText.push(false)
                        this.addedToPrices.push(false)
                    }
                }else{
                    tag = tag.trim()
                    let index = tag.find("<")
                    if(index != -1) tag = tag.slice(index+1)

                    if(this.html[endTag-1] != "/" && tag[0] != "!") this._parseNonUsefulTag(tag)
                    else if(tag.indexOf("!--") != -1) this.index = index_after(this.html, "-->", startTag, this.endHtml)
                }
            }
        }

        this.status = ParseStatus.SUCCESS
    }
}

export { ShopHTMLParser }