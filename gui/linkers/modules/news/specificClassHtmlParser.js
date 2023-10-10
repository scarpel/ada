import { SimpleDivNode, SimpleTagNode, SimpleUnaryTagNode } from "../utils/htmlTreeStructure.js"
import { index_after, get_until, get_until_if_exists } from "../utils/strFuncs.js"
import { calculate_article_code, get } from "../utils/utils.js"
import { isEndTag, get_body_or_main, decode_html_text } from "../utils/htmlUtils.js"
import { isLinkValid } from "../utils/websiteUtils.js"
import { ArticleItems, LinkedList } from "../utils/dataTypes.js"
import { ArticleItem } from "../utils/newsDataType.js"
import { article_groups } from "./newsFacade.js"

const defaultDesirableTags = new Set(["div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
"img", "ol", "section", "br", "source", "article"])
const unaryTags = new Set(["img", "text", "br", "hr"])
const getTags = new Set(["div", "li", "article"])

class SpecificClassHTMLParser{
    constructor(desirableTags){
        this.desirableTags = desirableTags? desirableTags: defaultDesirableTags
    }

    prepare_html = (rawHtml) => {
        return get_body_or_main(rawHtml).replaceAll("\n", "").replaceAll("\t"," ").replaceAll("\r","").replaceAll(String.fromCharCode(160), " ")
    }

    parse = (html, classes, index=0) => {
        if(html && classes.size){
            html = this.prepare_html(html)
            this._setParser(html.length, index)
            this.aLinks = []
    
            return this._parseTags(html, classes)
        }else return {}
    }

    parseArticleElements = (html, newsInfo, byClass=false, index=0) => {
        html = this.prepare_html(html)
        this._setParser(html.length, index)
        this.aLinks = []

        return this._parseArticleElements(html, newsInfo, byClass)
    }

    _setParser = (lengthHtml, index) =>{
        this.endHtml = lengthHtml
        this.index = index
        this.noscriptOffset = 500
    }

    _parseTags = (html, classes) => {
        this.parents = []
        this.hasText = []
        let classNodes = {}
        let getDiv = false

        for(let _class of classes){
            classNodes[_class] = []
        }

        while(this.index<this.endHtml){
            let startIndex = html.find("<", this.index)
            let endIndex = html.find(">", startIndex)
            let tag = get_until(html, " ", startIndex+1, endIndex)

            if(!getDiv){
                if(getTags.has(tag)){
                    let tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                    if(classes.has(tagClass)){
                        let node = new SimpleDivNode(tagClass)
                        node.link = this.aLinks[this.aLinks.length-1]
                        this.parents.push(node)
                        this.hasText.push(true)
                        getDiv = true
                    }
                }else if(tag === "a") this.aLinks.push(get_until_if_exists(html, '"', index_after(html, 'href="', startIndex, endIndex), endIndex))
                else if(tag === "/a") this.aLinks.pop()
                
                this.index = endIndex+1
            }else{
                if(isEndTag(tag)){
                    let parentsLength = this.parents.length

                    if(startIndex !== this.index && this.hasText[this.hasText.length-1]){
                        this.parents[parentsLength-1].content = html.slice(this.index, startIndex)
                    }

                    this.index = endIndex+1
                    this.hasText.pop()

                    if(parentsLength === 1){
                        classNodes[this.parents[0].tagClass].push(this.parents[0])
                        getDiv = false
                    }
                    
                    this.parents.pop()
                }else{
                    this.index = endIndex+1

                    if(this.desirableTags.has(tag)){
                        let tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                        this.hasText[this.hasText.length-1] = false
                        
                        if(unaryTags.has(tag)){
                            if(tag === "img") this.parents[this.parents.length-1].addChild(this._get_img(html, startIndex, endIndex))
                        }else{
                            this.hasText.push(true)
                            let node

                            if(getTags.has(tag)) node = new SimpleDivNode(tagClass)
                            else{
                                node = new SimpleTagNode(tag, tagClass)
                                if(tag === "a")
                                    node.link = get_until_if_exists(html, '"', index_after(html, 'href="', startIndex, endIndex), endIndex)
                            }
                            
                            this.parents[this.parents.length-1].addChild(node)
                            this.parents.push(node)

                            if(tag == "picture"){
                                this._add_img_from_picture(html)
                                this.index = html.find("</picture>", this.index)
                            }
                        }
                    }else this._parseNonUsefulTag(html, tag)
                }
            }
        }

        return classNodes
    }

    _parseArticleElements = (html, newsInfo, byClass=true) => {
        this.parents = []
        this.hasText = []
        let classNodes = {}
        let currentArticleElements = {}
        let invertedArticleElementsDict = {}
        let currentInvertedArticleElements = {}
        let getDiv = false
        let aLink = ""
        let articlesInfo = newsInfo.articlesInfo
        let articleClasses = Object.keys(articlesInfo)

        if(byClass){
            for(let i=articleClasses.length-1; i>=0; i--){
                classNodes[articleClasses[i]] = new LinkedList()
            }
        }
        
        while(this.index<this.endHtml){
            let startIndex = html.find("<", this.index)
            let endIndex = html.find(">", startIndex)
            let tag = get_until(html, " ", startIndex+1, endIndex)

            if(!getDiv){
                if(getTags.has(tag)){
                    let tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)

                    if(tagClass in articlesInfo){
                        let node = new SimpleDivNode(tagClass)
                        node.link = this.aLinks[this.aLinks.length-1]
                        this.parents.push(node)
                        this.hasText.push(true)
                        getDiv = true

                        if(!invertedArticleElementsDict[tagClass]){
                            let articleElement = articlesInfo[tagClass]

                            let keys = Object.keys(articleElement)
                            let length = keys.length
                            let obj = {}

                            for(let i=0; i<length; i++){
                                let articleElementCode = parseInt(keys[i])
                                let element = articleElement[articleElementCode]
                                if(element && element.tag) obj[element.tagClass] = [element.tag, articleElementCode]
                            }

                            invertedArticleElementsDict[tagClass] = obj
                        }

                        currentInvertedArticleElements = invertedArticleElementsDict[tagClass]
                        currentArticleElements = {}
                    }
                }else if(tag === "a") this.aLinks.push(get_until_if_exists(html, '"', index_after(html, 'href="', startIndex, endIndex), endIndex))
                else if(tag === "/a") this.aLinks.pop()

                this.index = endIndex+1
            }else{
                if(isEndTag(tag)){
                    let parentsLength = this.parents.length

                    if(startIndex !== this.index && this.hasText[this.hasText.length-1])
                        this.parents[parentsLength-1].content = decode_html_text(html.slice(this.index, startIndex))

                    this.index = endIndex+1
                    this.hasText.pop()

                    if(parentsLength === 1){
                        getDiv = false
                        currentArticleElements[ArticleItems.CODE] = calculate_article_code(currentArticleElements)
                        currentArticleElements[ArticleItems.NEWS_INFO] = newsInfo

                        if(!currentArticleElements[ArticleItems.LINK]) currentArticleElements[ArticleItems.LINK] = this.parents[0].link

                        if(byClass) classNodes[this.parents[0].tagClass].push(currentArticleElements)
                        else{
                            let newCode = article_groups[currentArticleElements[ArticleItems.CODE]]
                            let obj = classNodes[newCode]
                            if(!obj) classNodes[newCode] = new LinkedList(currentArticleElements)
                            else obj.push(currentArticleElements)
                        }
                    }else{
                        let node = this.parents[parentsLength-1]

                        let elementArray = get(currentInvertedArticleElements, node.tagClass, null)
                        if(elementArray && elementArray[0] === node.tag){
                            node.compact()
                            
                            if(!node.link){
                                node.link = aLink? aLink: null
                            }

                            if(elementArray[1] === ArticleItems.AUTHOR){
                                if(!currentArticleElements[ArticleItems.AUTHOR]) currentArticleElements[ArticleItems.AUTHOR] = []
                                currentArticleElements[ArticleItems.AUTHOR].push(new ArticleItem(node))
                            }else currentArticleElements[elementArray[1]] = new ArticleItem(node)

                        }
                    }

                    if(tag === "/a") aLink = ""
                    
                    this.parents.pop()
                }else{
                    this.index = endIndex+1

                    if(this.desirableTags.has(tag)){
                        let tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                        this.hasText[this.hasText.length-1] = false
                        
                        if(unaryTags.has(tag)){
                            if(tag === "img"){
                                let img = this._get_img(html, startIndex, endIndex)
                                if(!img.link) img.link = aLink? aLink: null

                                let elementArray = get(currentInvertedArticleElements, tagClass, null)
                                if(elementArray && elementArray[0] === "img") currentArticleElements[elementArray[1]] = new ArticleItem(img)
                                else this.parents[this.parents.length-1].addChild(img)
                            }
                        }else{
                            this.hasText.push(true)
                            if(html[endIndex-1] !== "/"){
                                let node

                                if(getTags.has(tag)) node = new SimpleDivNode(tagClass)
                                else{
                                    node = new SimpleTagNode(tag, tagClass)
                                    if(tag === "a"){ 
                                        node.link = get_until_if_exists(html, '"', index_after(html, 'href="', startIndex, endIndex), endIndex)
                                        if(node.link){
                                            if(!(ArticleItems.LINK in currentArticleElements)) currentArticleElements[ArticleItems.LINK] = node.link
                                            aLink = node.link
                                        }
                                    }
                                }
                                
                                this.parents[this.parents.length-1].addChild(node)
                                this.parents.push(node)
                            }
                        }
                    }else this._parseNonUsefulTag(html, tag)
                }
            }
        }

        return classNodes
    }

    _get_img = (html, startIndex, endIndex) => { 
        let tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
        let src = get_until_if_exists(html, '"', index_after(html, 'src="', startIndex, endIndex), endIndex)
        this.index = endIndex+1

        if(!isLinkValid(src)){
            let noscriptStart = html.find("<noscript", endIndex, endIndex+this.noscriptOffset)
            if(noscriptStart !== -1){
                let noscriptEnd = html.find("</noscript", noscriptStart)
                let imgStart = html.find("<img", noscriptStart, noscriptEnd)
                if(imgStart !== -1){
                    let imgEnd = html.find(">", imgStart, noscriptEnd)
                    src = get_until_if_exists(html, '"', index_after(html, 'src="', imgStart, imgEnd), imgEnd)
                }

                this.index = index_after(html, ">", noscriptEnd, noscriptEnd+20)
            }
        }

        return new SimpleUnaryTagNode("img", tagClass, src)
    }

    _add_img_from_picture = (html) => {
        let imgStart = index_after(html, "<img", this.index, this.endHtml)
        if(imgStart !== -1){
            let imgEnd = html.find(">", imgStart)
            this.parents[this.parents.length-1].addChild(this._get_img(html, imgStart, imgEnd))
        }
    }
    
    _parseNonUsefulTag = (html, tag) => {
        let endTag = index_after(html, `</${tag}>`, this.index, this.endHtml)

        if(endTag !== -1){
            if(tag !== "script"){
                let numPossibleTags = this._numAllPossibleTags(html, tag, this.index, endTag)

                while(numPossibleTags !== 0){
                    let index = endTag
                    for(let i=0; i<numPossibleTags; i++){
                        endTag = index_after(html, `</${tag}>`, endTag, this.endHtml)
                        if(endTag === -1) break
                    }
                    
                    numPossibleTags = this._numAllPossibleTags(html, tag, index, endTag)
                }
            }

            this.index = endTag
        }
    }

    _numAllPossibleTags = (html, tag, start, end) => {
        let numPossibleTags = 0
        let indexPossibleTag = html.find(`<${tag}`, start, end)

        while(indexPossibleTag !== -1 && indexPossibleTag<end){
            numPossibleTags += 1
            indexPossibleTag = html.find(`<${tag}`, index_after(html, ">", indexPossibleTag, end), end)
        }
        
        return numPossibleTags
    }
}

export default SpecificClassHTMLParser