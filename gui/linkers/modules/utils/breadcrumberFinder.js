import { isEndTag } from "./htmlUtils.js"
import { index_after, get_until, find_index_backward } from "./strFuncs.js"
import {defaultDesirableTags, allowedTagFollowUps, quotes, unaryTags} from "../consts/HTMLInfo.js"

const breadcrumberClasses = ["breadcrumber", "bread", "Breadcrumber"]
const breadcrumberElements = new Set(["div", "ul"])

function getBreadcrumbers(html, delimiters=undefined, breadcrumberClass=undefined){
    let startHTML, endHTML, startBreadcrumber = -1

    if(delimiters) startHTML, endHTML = delimiters
    else{
        startHTML = 0
        endHTML = html.length
    }

    if(breadcrumberClass) startBreadcrumber = findBreadcrumberStart(html, startHTML, endHTML, breadcrumberClass)
    else{
        let info = findUnknownBreadcrumberStart(html, startHTML, endHTML)
        if(info) ([breadcrumberClass, startBreadcrumber] = info)
    }

    if(startBreadcrumber != -1) return _getBreadcrumbers(html, startBreadcrumber, endHTML)
    else return undefined
}

function _getBreadcrumbers(html, start, endHtml){
    let tags = ["start"], index = start, inA = false
    let breadcrumbers = [], currentTexts = []

    while(tags.length>0 && index !== -1 && index<endHtml){
        let startTag = index_after(html, "<", index, endHtml)
        let endTag = html.find(">", startTag, endHtml)
        let tag = get_until(html, " ", startTag, endTag)

        if(isEndTag(tag)){
            tag = tag.slice(1)

            if(defaultDesirableTags.has(tag)){
                if(inA){
                    let text = html.slice(index, startTag-1).trim()
                    if(text) currentTexts.push(text)
                }

                if(tag === "a"){
                    inA = false
                    if(currentTexts.length>0) breadcrumbers.push(currentTexts.join(" "))
                    currentTexts = []
                }

                tags.pop()
            }

            index = endTag+1
        }else{
            if(defaultDesirableTags.has(tag)){
                if(tag === "a") inA = true
                if(!unaryTags.has(tag)) tags.push(tag)
                index = endTag+1
            }else{
                tag = tag.trim()

                if(tag && html[endTag-1] !== "/"){
                    if(tag[0] === "!"){
                        let newEndTag = index_after(html, "-->", startTag, endHtml)
                        index = newEndTag !== -1? newEndTag: endTag
                    }else index = parseNonUsefulTag(tag, html, endTag+1, endHtml)
                }else index = endTag+1
            }
        }
    }

    return breadcrumbers
}

function parseNonUsefulTag(tag, html, index, endHtml){
    let endTag = index_after(html, `</${tag}>`, index, endHtml)

    if(endTag !== -1){
        if(tag !== "script"){
            let numPossibleTags = numAllPossibleTags(tag, html, index, endTag)

            while(numPossibleTags !== 0){
                let endIndex = endTag
                for(let i=0; i<numPossibleTags; i++){
                    endTag = index_after(html, `</${tag}>`, endTag, endHtml)
                    if(endTag === -1) break
                }

                numPossibleTags = numAllPossibleTags(tag, html, endIndex, endTag)
            }
        }

        return endTag
    }

    return index
}

function findBreadcrumberStart(html, start, end , breadcrumberClass){
    let index = html.indexOf(breadcrumberClass, start, end)

    if(index != -1) index = html.indexOf(">", index, end)+1

    return index
}

function numAllPossibleTags(tag, html, start, end){
    let numPossibleTags = 0
    tag = `<${tag}`
    let tagLength = tag.length
    let indexPossibleTag = html.find(tag, start, end)

    while(indexPossibleTag !== -1 && indexPossibleTag<end){
        if(elegiblePossibleTag(indexPossibleTag, html)){
            if(allowedTagFollowUps.has(html[indexPossibleTag+tagLength])) numPossibleTags += 1
            else break
        }

        indexPossibleTag = html.find(tag, index_after(html, ">", indexPossibleTag, end), end)
    }
    
    return numPossibleTags
}

function elegiblePossibleTag(index, html){
    if(index>1){
        let lastChar = html.slice(index-2, index)
        if(lastChar !== '\\n' && !quotes.has(lastChar[1])) return true
    }else if(index>0){
        let lastChar = html.slice(index-1, index)
        if(!quotes.has(lastChar[1])) return true
    }
        
    return false
}

function findUnknownBreadcrumberStart(html, start, end, possibleClasses=breadcrumberClasses){
    for(let i=0, length=possibleClasses.length; i<length; i++){
        let index = html.indexOf(possibleClasses[i], start, end)
        while(index != -1){
            let divStart = find_index_backward(html, "<", index)
            let spaceIndex = html.indexOf(" ", divStart, index)
            if(spaceIndex != -1){
                let element = html.slice(divStart+1, spaceIndex)
                if(breadcrumberElements.has(element)){
                    let divEnd = html.indexOf(">", spaceIndex, end)
                    if(divEnd>index){
                        let breadClass = html.slice(find_index_backward(html, '"', index)+1, html.indexOf('"', index))
                        return [breadClass, divEnd+1]
                    }
                }
            }

            index = html.indexOf(possibleClasses[i], index+1, end)
        }
    }

    return undefined
}

export {getBreadcrumbers, findUnknownBreadcrumberStart, findBreadcrumberStart}