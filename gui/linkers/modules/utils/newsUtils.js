import { get_basic_website_info } from "./websiteUtils.js";
import { get_tag_content } from "./htmlUtils.js"
import { capitalize } from "./strFuncs.js"
import { remove_accents } from "../consts/accents.js"
import { get } from "./utils.js"

function get_news_website_basic_info(html, url){
    return get_basic_website_info(url, get_tag_content(html, "title", 0, html.length), html, true)
}

const titleCorrespondingTags = ["header", "text", "container", "image", "link", "other"]

const correspondingTags = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
    h7: 0,
    h8: 0,
    h9: 0,
    span: 1,
    p: 1,
    div: 2,
    article: 2,
    ul: 2,
    img: 3,
    a: 4,
    li: 4,
    time: 4
}

function getArticleCounterArray(counter, isTrue=true){
    return [get(counter.values, 0, 0), get(counter.values, 1, 0), get(counter.values, 2, 0), get(counter.values, 3, 0), 
        get(counter.values, 4, 0), get(counter.values, 5, 0), isTrue]
}

function shuffle(articlesArray){
    let length = articlesArray.length
    
    if(length === 0) return []

    let array = []
    let node

    if(length>1){
        let i = 0

        while(i<length){
            node = articlesArray[i].next()

            if(node) array.push(node)
            else{
                articlesArray.splice(i, 1)
                length--
                if(length === 1) break
            }

            i++
            if(i>=length) i=0
        }
    }

    node = articlesArray[0].next()
    while(node){
        array.push(node)
        node = articlesArray[0].next()
    }
    
    return array
}

function shuffle_all(sortedArticles){
    let entries = Object.entries(sortedArticles)
    let length = entries.length
    let obj = {}

    for(let i=0; i<length; i++){
        let [key, articles] = entries[i]
        if(articles.length) obj[key] = shuffle(articles)
    }

    return obj
}

function format_authors_name(authorsName, start="By", connector="and"){
    let length = authorsName.length

    if(length === 1) return `${start} ${authorsName[0]}`
    else if(length>1){
        if(length === 2) return `${start} ${authorsName[0]} ${connector} ${authorsName[1]}`
        else{
            let last = length-1
            return `${start} ${authorsName.slice(0, last).join(", ")} ${connector} ${authorsName[last]}`
        }
    }

    return ""
}

function get_category_name(category, title){
    let titleArray = title.split(" ")
    let length = titleArray.length
    let start, end

    for(let i=0; i<length; i++){
        if(category.indexOf(remove_accents(titleArray[i].toLowerCase())) !== -1){
            if(start === undefined) start = i
        }else if(start !== undefined){
            end = i
            break
        }
    }

    if(start !== undefined){
        if(!end) end = length

        return verifyCategoryEnd(titleArray.slice(start, end).map(value => capitalize(value)).join(" "))
    }else{
        length = category.length
        return `/${category[length-1]==="/"? category.slice(0, length-1): category}`
    }
}

function verifyCategoryEnd(category){
    let lastPosition = category.length-1
    return category[lastPosition] === ":"? category.slice(0, lastPosition): category
}

function merge_sets(originalSet, toBeAddedSet){
    for(let value of toBeAddedSet){
        originalSet.add(value)
    }

    return originalSet
}

function merge_objects(originalObj, toBeAddedObj){
    let keys = Object.keys(toBeAddedObj)

    for(let i=keys.length-1; i>=0; i--){
        let key = keys[i]
        let obj = toBeAddedObj[key]
        originalObj[key] = obj
    }

    return originalObj
}

// function sort_gathered_info(gatheredInfos){
//     let unknown = [], known = []
//     let length = gatheredInfos.length
//     console.log(gatheredInfos)

//     for(let i=0; i<length; i++){
//         let gatheredInfo = gatheredInfos[i]
//         console.log(gatheredInfo)
//         if(gatheredInfo[2].id) known.push(gatheredInfo)
//         else unknown.push(gatheredInfo)
//     }

//     return [known, unknown]
// }

export { get_news_website_basic_info, shuffle, shuffle_all, format_authors_name, get_category_name, merge_sets,
    merge_objects, correspondingTags, titleCorrespondingTags, getArticleCounterArray }