import { find_index_backward, index_after } from "./strFuncs.js"
import { get_property_meta_tag, get_tag_property } from "./htmlUtils.js"
import { index } from "./utils.js"
import { get_favicon_url } from "./favicon.js"
import { capitalize } from "./strFuncs.js"
import { descriptionNames, separators } from "../consts/HTMLInfo.js"
import { types_association, WEBSITE_TYPES } from "../consts/websiteTypes.js"
import { Counter } from "./dataTypes.js"

const protocolsRE = /^(http|https):\/\/./

function get_website_name(reference, title, html){
    let site_name = html.find('property="og:site')
    let start = null
    let end = null

    if(site_name !== -1){
        start = find_index_backward(html, "<", site_name)
        end = html.find(">", site_name)
        let prop = get_tag_property(html.slice(start,end), "content", 1)
        if(prop) return prop
    }
    
    let titleArray = title.split(" ")
    let lenArr = titleArray.length
    let lower = reference.toLowerCase()

    for(var i = lenArr-1; i>=0; i--){
        if(lower.indexOf(titleArray[i].toLowerCase()) != -1){
            if(!end) end = i+1
        }else if(end){
            start = i+1
            break 
        }
    }

    if(end){
        if(!start) start = 0
        return titleArray.slice(start?start:0, end).map((value) => capitalize(value)).join(" ")
    }else return `${capitalize(reference[0])}${reference.slice(1)}`
}

function get_news_website_type(html){
    let description = get_website_description(html)
    
    if(description){
        let types = new Counter()
        let arr = description.toLowerCase().split(" ")

        for(let i=arr.length-1; i>=0; i--){
            let word = arr[i], length = word.length

            if(separators.has(word[length-1])) length -= 1
            if(word[length-1] === "s") length -= 1

            if(length>1) types.add(types_association[word.slice(0, length)])
        }

        types.pop(undefined)
        let keysLength = types.keys().length
        console.log(types.values)

        if(keysLength>1 && keysLength<4){
            if(types.values[WEBSITE_TYPES.TECH] && types.values[WEBSITE_TYPES.SCIENCE] && (types.values[WEBSITE_TYPES.ENTERTAINMENT] || types.values[WEBSITE_TYPES.CULTURE])) types.add(WEBSITE_TYPES.TECH, types.size*2)
            if(keysLength === 2 && types.values[WEBSITE_TYPES.ENTERTAINMENT] === 1 && !types.values[WEBSITE_TYPES.LIFESTYLE]) types.pop(WEBSITE_TYPES.ENTERTAINMENT)
        }

        if(types.size>1){
            let sorted = types.getSortedArray()
            if(sorted[0][1]/types.size > 0.5) return sorted[0][0]
        }else if(types.size === 1) return types.keys()[0]
        else return WEBSITE_TYPES.GENERAL
    }
    
    return WEBSITE_TYPES.GENERAL
}

function get_website_description(html){
    for(let i=0, length=descriptionNames.length; i<length; i++){
        let description = get_property_meta_tag(html, descriptionNames[i], "content")
        if(description) return description
    }
    
    return undefined
}

function trim_url_protocols(mainUrl){
    let end = mainUrl.length
    if(mainUrl[mainUrl.length-1] === "/") end -= 1

    let start = index_after(mainUrl, "//", 0, end)
    if(start === -1) start = 0

    return mainUrl.slice(start, end)
}

function splitUrl(url){
    let index = url.find("//")
    if(index != -1){
        index = url.find("/", index+2)
        if(index != -1){
            let rest = url.slice(index+1).split("/")
            if(rest[0] != "") return [url.slice(0,index), ...rest]
            else return [url.slice(0, index)]
        }else return url
    }else return url.split("/")
}

function firstURLLazySplit(word, currentIndex, delimiter="/"){
    let index = word.find(`${delimiter}${delimiter}`)
    if(index !== -1) index += 2
    else index = 0

    index = word.find("/", index)
    if(index !== -1){
        index++
        return [index, word.slice(0, index)]
    }
    else return [-1, word]
}

function get_main_url(url){
    let [_, mainUrl] = firstURLLazySplit(url, 0)
    return mainUrl
}

function sort_by_url(urls){
    let sorted = {}

    for(var i = urls.length-1; i>=0; i--){
        let url = urls[i]
        let [_, splittedUrl] = firstURLLazySplit(url, 0)
        if(splittedUrl in sorted) sorted[splittedUrl].add(url)
        else sorted[splittedUrl] = new Set([url])
    }
    
    return sorted
}

function isLinkValid(src){
    if(!src) return false
    else return src.indexOf("http") === 0
}

function get_sub_name(mainUrl, urlArray=null){
    if(!urlArray){
        let url = trim_url_protocols(mainUrl)
        let urlArray = url.split(".")
         
        let first = urlArray[0] === "www"? 1: 0
        let last = urlArray.indexOf("com")
        if(last == -1){
            last = urlArray.indexOf("co")
            if(last == -1) last = urlArray.length
        }

        return `${urlArray[first]}${urlArray.slice(first+1, last).map((value) => capitalize(value)).join("")}`
    }else{ 
        let first = urlArray[0] === "www"?1:0
        return `${urlArray[first]}${urlArray.slice(first+1).filter((value) => value !== "com").map((value) => capitalize(value)).join("")}`
    }
}

function get_domain(mainUrl){
    mainUrl = trim_url_protocols(mainUrl)
    let arr = mainUrl.split(".")
    let index = arr.indexOf("com")
    index = index?index:arr.indexOf("co")

    if(index !== -1) return arr.slice(index+1).join(".")
    else return arr[arr.length-1]
}

function get_basic_website_info(mainUrl, title, html, getType=false){
    let url = trim_url_protocols(mainUrl)
    let urlArray = url.split(".")

    let comIndex = index(urlArray, "com")
    if(comIndex === -1) comIndex = index(urlArray, "co")

    let domain = comIndex === -1? urlArray.last(-1): urlArray.slice(comIndex+1).map((value) => capitalize(value)).join("")

    html = html.slice(0, html.indexOf("</head>"))
    let sub_name = get_sub_name(mainUrl, urlArray.slice(0, comIndex))
    let websiteName = get_website_name(sub_name, title, html)
    let faviconUrl = get_favicon_url(mainUrl, html)

    let obj = {websiteName, domain, faviconUrl, mainUrl}

    if(getType) obj["type"] = get_news_website_type(html)

    return obj
}

function add_protocol(url, protocol="https"){
    return protocolsRE.test(url)? url: `${protocol}://${url}`
}

function treat_url(url){
    return url[url.length-1] !== "/"? `${url}/`: url
}

function treat_all_url(url, protocol="https"){
    return treat_url(add_protocol(url, protocol))
}

export { get_website_name, trim_url_protocols, splitUrl, firstURLLazySplit, get_main_url, sort_by_url, isLinkValid,
    get_sub_name, get_basic_website_info, add_protocol, get_domain, treat_url, protocolsRE, treat_all_url, 
    get_news_website_type, get_website_description}