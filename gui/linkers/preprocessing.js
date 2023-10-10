import {index_after, get_until} from "./modules/utils/strFuncs.js"
import { Counter } from "./modules/utils/dataTypes.js"
import { get } from "./modules/utils/utils.js"
import { correspondingTags, getArticleCounterArray } from "./modules/utils/newsUtils.js"

const defaultDesirableTags = new Set(["div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "article"])
const ambiguosTags = new Set(["source"])
const unaryTags = new Set(["img", "text", "br", "hr", "source"])
const badBeggining = new Set(["!", "?"])
const quotes = new Set(["'", '"'])
const containerTags = new Set(["div", "li", "tr", "section"])
const allowedTagFollowUps = new Set([" ", ">"])

function getHTMLCounter(html, counter = new Counter()){
    let index = 0
    let endHTML = html.length
    let tags = []

    while(index !== -1 && index<endHTML){
        let startTag = index_after(html, "<", index, endHTML)
        if(startTag !== -1){
            let endTag = html.indexOf(">", startTag)
            let tag = get_until(html, " ", startTag, endTag)
    
            if(tag[0] === "/"){
                tag = tag.slice(1)
                let lastTag = tags.pop()
            
                if(tag === lastTag) counter.add(correspondingTags[tag])
    
                index = endTag+1
            }else{
                if(defaultDesirableTags.has(tag)){
                    if(!unaryTags.has(tag)){
                        tags.push(tag)
                    }else counter.add(correspondingTags[tag])
    
                    index = endTag+1
                }else{
                    if(html[endTag-1] !== "/"){
                        let goTo = html.indexOf(`/${tag}`, endTag)
                        index = goTo !== -1? goTo: endTag+1
                    }else index = endTag+1
                }
            }
        }else break
    }

    return counter
}

export { getHTMLCounter }