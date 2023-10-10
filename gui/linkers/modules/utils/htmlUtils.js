import { ESCAPE_HTML_CHARACTERS } from "../consts/consts.js"
import { index_after, find_and_go_after, find_index_backward } from "./strFuncs.js"
import { get } from "./utils.js"

function isEndTag(tag){
    if(tag.length>0) return tag[0] === '/'
    else return false
}

function get_link_from_data_dynamic(text){
    if(text && text.indexOf("http") !== -1){
        text = decode_html_text(text)
        let index = text.find("http")
        let end = text.find('"', index)
        if(end !== -1)
            return text.slice(index, end)
    }
    
    return null
}

function objectifyTag(fullTag, requiredFieldsSet){
    let spaceIndex = fullTag.find(" ")
    let length = fullTag.length
    let obj = {"tag": fullTag.slice(fullTag[0]==="<"?1:0, spaceIndex)}

    while(spaceIndex !== -1 && spaceIndex<length){
        spaceIndex += 1
        let eqIndex = fullTag.find("=", spaceIndex)

        if(eqIndex !== -1){
            let propName = fullTag.slice(spaceIndex, eqIndex).trim().toLowerCase()
            let quote = fullTag[eqIndex+1]

            if(quote === "'" || quote === '"') eqIndex += 2
            else{
                quote = " "
                eqIndex += 1
            }

            let propEnd = fullTag.find(quote, eqIndex)

            if(requiredFieldsSet.has(propName)){
                let text = fullTag.slice(eqIndex, propEnd)
                if(text) obj[propName] = text
            }

            spaceIndex = propEnd
        }else spaceIndex = fullTag.find(" ", spaceIndex)
    }
    
    return obj
}

function get_text_from_tag(text){
    let start = text.find(">")
    let texts = []
    
    while(start !== -1){
        start = start + 1
        let end = text.find("<", start)

        if(end !== -1 && end>start){ 
            let t = text.slice(start, end).trim()
            if(t) texts.append(t)
            start = text.find(">", end+1)
        }else start = text.find(">", start)
    }

    return texts.join("")
}

function decode_html_text(text){
    let startIndex = text.find("&")

    if(startIndex !== -1){
        let endIndex = text.find(";", startIndex)
        if(endIndex !== -1){
            endIndex += 1
            let character = text.slice(startIndex, endIndex) 
            character = get(ESCAPE_HTML_CHARACTERS, character, character)
            return [text.slice(0,startIndex), character, decode_html_text(text.slice(endIndex))].join("")
        }
    }
    
    return text
}

function get_body_or_main(rawHtml){
    if(rawHtml.indexOf("<main") !== -1)
        var [start, end] = get_start_end_tag(rawHtml, "main")
    else
        var [start, end] = get_start_end_tag(rawHtml, "body", 0, true)

    return rawHtml.slice(start, end).trim().replaceAll("scr+ipt", "script")
}

function get_start_end_tag(html, tag, start=0, getLastEnd=false){
    let start1 = find_and_go_after(html, `<${tag}`, ">", start)
    let end = html.find(`</${tag}>`, start1)

    if(getLastEnd){
        let last
        do{
            last = end
            end = html.find(`</${tag}>`, end+2)
        }while(end !== -1)
        end = last
    }

    return [start1, end]
}

function get_tag_content(text, tag, start, end){
    let index = index_after(text, `<${tag}`, start, end)

    if(index !== -1 && [">", " "].indexOf(text[index]) != -1){
        index = index_after(text, ">", index, end)
        let tagEnd = text.find(`</${tag}>`, index, end)
        if(tagEnd !== -1)
            return text.slice(index, tagEnd)
    }

    return null
}

function get_tag_property(text, propertyName, start, end=null){
    end = end? end: text.length
    let index = index_after(text, `${propertyName}="`, start, end)

    if(index !== -1) return text.slice(index, text.find('"', index))
    else return ""
}

function get_tag_until(text, delimiter, start=0, end=null){
    end = end? end: text.length
    let delimiterIndex = text.find(delimiter, start, end)
    let word = text.slice(start, delimiterIndex===-1? end: delimiterIndex)

    let nlIndex = word.find("\n")

    if(nlIndex>0) 
        return word.slice(0, nlIndex)
    else 
        return word
}

function createElement(element, elementClass="", elementId=undefined){
    let e = document.createElement(element)
    e.className = elementClass
    if(elementId !== undefined) e.id = elementId

    return e
}

function createCustomA(elementClass="", elementId=undefined, text, func=() => {}, link="#"){
    let a = createElement("a", elementClass, elementId)
    a.innerText = text
    a.onclick = func
    a.href = link

    return a
}

function createSimpleCustomA(aFunction=() => {}, href="#"){
    let a = document.createElement("a")
    a.onclick = aFunction
    a.href = href

    return a
}

function createImg(elementClass, src, alt=""){
    let img = document.createElement("img")
    img.className = elementClass
    img.src = src
    img.alt = alt

    return img
}

function clearChildren(element){
    if(element){
        while(element.lastChild){
            element.removeChild(element.lastChild)
        }
    }
}

function cleanAppend(element, elementToAppend){
    if(element){
        clearChildren(element)
        element.append(elementToAppend)
    }
}

function get_property_meta_tag(html, name, property){
    let index = html.indexOf(`name="${name}"`)

    if(index !== -1){
        let startAt = find_index_backward(html, "<", index)
        let endAt = html.indexOf(">", index)
        html = html.slice(startAt, endAt)
        let propertyStart = index_after(html, `${property}="`, 0, html.length)

        if(propertyStart !== -1){
            return html.slice(propertyStart, html.indexOf('"', propertyStart+1))
        }
    }

    return undefined
}

export { isEndTag, get_link_from_data_dynamic, objectifyTag, get_text_from_tag, decode_html_text, get_body_or_main,
    get_start_end_tag, get_tag_content, get_tag_property, get_tag_until, createElement, clearChildren,
    createCustomA, createSimpleCustomA, createImg, cleanAppend, get_property_meta_tag }