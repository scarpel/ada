import { DivNode, TagNode, UnaryTagNode } from "../utils/htmlTreeStructure.js"
import { index_after, get_until, get_until_if_exists } from "../utils/strFuncs.js"
import { isEndTag, get_body_or_main } from "../utils/htmlUtils.js"
import { Counter } from "../utils/dataTypes.js"
import { index } from "../utils/utils.js"

const defaultDesirableTags = new Set(["div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "br", "source", "article"])
const ambiguosTags = new Set(["source"])
const unaryTags = new Set(["img", "text", "br", "hr"])
const badBeggining = new Set(["!", "?"])
const quotes = new Set(["'", '"'])
const containerTags = new Set(["div", "li", "tr", "section", "article"])
const allowedTagFollowUps = new Set([" ", ">"])

class ArticleHTMLParser{
    constructor(desirableTags=null){
        this.desirableTags = desirableTags? desirableTags: defaultDesirableTags
    }

    _cleanVariables = () => {
        this.parents = [new DivNode("main")]
        this.tags = []
        this.index = 0
        this.hasText = [true]
    }

    teste = () => {
        let c = new Counter()
        let length = this.tags.length
        let end = 0
        let start = 0
        for(let i=0; i<length; i++){
            let tag = this.tags[i]
            if(tag === "text") start += 2
        }
    }

    prepare_html = (rawHtml) => {
        return get_body_or_main(rawHtml).replaceAll("\n", "").replaceAll("\t"," ").replaceAll("\r","").replaceAll(String.fromCharCode(160), " ")
    }

    parse = (rawHtml, divisorOfMax=3) => {
        if(!rawHtml) return null
        
        this._cleanVariables()
        this.html = this.prepare_html(rawHtml)
        this.endHtml = this.html.length
        this.max = this.endHtml/divisorOfMax
        
        this._obtainTagArray()
        this._parseTags()
        return this.parents[this.parents.length-1]
    }

    parse1 = (rawHtml, divisorOfMax=3) => {
        this._cleanVariables()
        this.html = rawHtml
        this.endHtml = this.html.length
        this.max = this.endHtml/divisorOfMax
        
        this._obtainTagArray()
        this._parseTags()
        return this.parents[this.parents.length-1]
    }

    _isValidTag = (tag) => !badBeggining.has(tag[0])

    _parseNonUsefulTag = (tag) => {
        this.hasText[this.hasText.length-1] = false
        let endTag = index_after(this.html, `</${tag}>`, this.index, this.endHtml)

        if(endTag !== -1){
            if(tag !== "script"){
                let numPossibleTags = this._numAllPossibleTags(tag, this.index, endTag)
    
                while(numPossibleTags !== 0){
                    let index = endTag
                    for(let i=0; i<numPossibleTags; i++){
                        endTag = index_after(this.html, `</${tag}>`, endTag, this.endHtml)
                        if(endTag === -1) break
                    }
    
                    numPossibleTags = this._numAllPossibleTags(tag, index, endTag)
                }
            }

            this.index = endTag
        }
    }

    _numAllPossibleTags = (tag, start, end) => {
        let numPossibleTags = 0
        tag = `<${tag}`
        let tagLength = tag.length
        let indexPossibleTag = this.html.find(tag, start, end)

        while(indexPossibleTag !== -1 && indexPossibleTag<end){
            if(this._elegiblePossibleTag(indexPossibleTag)){
                if(allowedTagFollowUps.has(this.html[indexPossibleTag+tagLength])) numPossibleTags += 1
                else break
            }

            indexPossibleTag = this.html.find(tag, index_after(this.html, ">", indexPossibleTag, end), end)
        }
        
        return numPossibleTags
    }

    _elegiblePossibleTag = (index) => {
        if(index>1){
            let lastChar = this.html.slice(index-2, index)
            if(lastChar !== '\\n' && !quotes.has(lastChar[1])) return true
        }else if(index>0){
            let lastChar = this.html.slice(index-1, index)
            if(!quotes.has(lastChar[1])) return true
        }
            
        return false
    }

    _obtainTagArray = () => {
        let counter = 0

        while(this.index>-1 && this.index<this.endHtml && counter<this.max){
            let startTag = index_after(this.html, "<", this.index, this.endHtml)
            let endTag = this.html.find(">", startTag, this.endHtml)
            let tag = get_until(this.html, " ", startTag, endTag)
            
            if(isEndTag(tag)){
                let tagWithoutSlash = tag.slice(1)
                
                if(this.desirableTags.has(tagWithoutSlash)){
                    if(containerTags.has(tagWithoutSlash) && this.hasText[this.hasText.length-1] && this.index+1 !== startTag){
                        this.tags.push("text")
                    }
                
                    this.hasText.pop()
                    this.tags.push(tag)
                }

                this.index = endTag+1
            }else{
                this.index = endTag+1

                if(this.desirableTags.has(tag)){
                    this.hasText[this.hasText.length-1] = false
                    this.hasText.push(true)

                    if(containerTags.has(tag)){
                        let tagClass = get_until_if_exists(this.html, '"', index_after(this.html, 'class="', startTag, endTag), endTag)
                        this.tags.push(tagClass)
                    }else if(this._isValidTag(tag)){
                        this.tags.push(tag)
                        if(this.html[endTag-1] === "/" && ambiguosTags.has(tag)) this.tags.push(`/${tag}`)
                    }
                }else{
                    tag = tag.trim()

                    if(tag && this.html[endTag-1] !== "/"){
                        if(this.html[startTag] === "!") this._handleComment(startTag+3)
                        else this._parseNonUsefulTag(tag)  
                    } else this.index = endTag+1
                }
            }

            counter++  
        }
    }

    _handleComment = (startAt) => {
        let newEndTag = index_after(this.html, "-->", startAt, this.endHtml)
        this.index = newEndTag? newEndTag: endTag
    }
        
    _parseTags = () => {
        let length = this.tags.length
        for(let i=0; i<length; i++){
            let tag = this.tags[i]
            if(isEndTag(tag)){
                let parentsLength = this.parents.length
                if(parentsLength>1) this.parents[parentsLength-2].addChild(this.parents[parentsLength-1])
                else return 
                    

                this.parents.pop()
            }else{
                if(unaryTags.has(tag)) this.parents[this.parents.length-1].addChild(new UnaryTagNode(tag))
                else{
                    if(this.desirableTags.has(tag)) this.parents.push(new TagNode(tag))
                    else this.parents.push(new DivNode(tag))
                }
            }
        }

        // for(let i=this.parents.length-1; i>0; i--){
        //     let parent = this.parents.pop()
        //     if(parent.tag !== "div") this.parents[i-1].addChild(parent)
        //     else this.parents[0].addChild(parent)
        // }
    }
}

export default ArticleHTMLParser