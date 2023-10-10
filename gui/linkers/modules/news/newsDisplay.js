import Article1X10 from "../../components/Article1X10.js"
import ArticleXX1X from "../../components/ArticleXX1X.js"
import KeywordTag from "../../components/KeywordTag.js"
import { createElement } from "../utils/htmlUtils.js"
import KeywordArticles from "../../components/KeywordArticles.js"

let displayFunctions = {
    "0010": [],
    "xx1x": displayXX1X,
    "1x10": display1X10
}

function getDisplayElement(preparedArticles, onClickFunction= ()=>{}, maxElementsPerFragment=50){
    delete preparedArticles["0010"]
    let infos = {
        "0010": {},
        "xx1x": {},
        "1x10": {numElements: 6}
    }

    let entries = []
    let length1x10

    if("1x10" in preparedArticles){
        let articles = preparedArticles["1x10"]
        entries.push(["1x10", articles])
        length1x10 = articles.length
    }

    if("xx1x" in preparedArticles){
        let articles = preparedArticles["xx1x"]
        entries.push(["xx1x", articles])
        if(length1x10){
            infos["xx1x"]["numElements"] = Math.ceil(articles.length/(length1x10/infos["1x10"]["numElements"]))
        }
    }

    let length = entries.length
    let currentFragment = document.createElement("div")
    let fragments = [currentFragment]
    let currentNumElements = 0

    while(length>1){
        let a = []

        for(let i=0; i<length; i++){
            let [articleCode, array] = entries[i]
            let info = infos[articleCode]
            let articles = displayFunctions[articleCode](array, info, onClickFunction, info["numElements"])
            currentFragment.append(articles)
            currentNumElements += articles.children.length

            if(currentNumElements>=maxElementsPerFragment){
                currentFragment = document.createElement("div")
                fragments.push(currentFragment)
                currentNumElements = 0
            }

            if(!info.isFull) a.push(i)
        }

        for(let i=0; i<a.length; i++){
            entries.splice(a[i]-i, 1)
            length--
        }
    }

    if(length === 1){
        let [articleCode, array] = entries[0]
        let info = infos[articleCode]
        currentFragment.append(displayFunctions[articleCode](array, info, onClickFunction, array.length))
    }

    return fragments
}

function displayXX1X(array, info={}, onclickFunction, numElements=5){
    let index = info.index
    if(index === undefined) index = 0

    let base = createElement("div", "articles-xx1x")
    numElements += index

    let isFull = true

    for(; index<numElements; index++){
        let node = array[index]

        if(node){
            base.append(ArticleXX1X(node, undefined, onclickFunction))
        }else{
            isFull = false
            break
        }
    }

    info.index = index
    info.isFull = isFull

    return base
}

function display1X10(array, info={}, onclickFunction, numElements=6){
    let index = info.index
    let isFull = true
    let base = createElement("div", "articles-1x10")
    
    if(index === undefined) index = 0

    numElements += index

    for(; index<numElements; index++){
        let node = array[index]

        if(node){
            base.append(Article1X10(node, undefined, onclickFunction))
        }else{
            isFull = false
            break
        }
    }

    if(isFull) base.classList.add("full")

    info.index = index
    info.isFull = isFull

    return base
}

function displayKeywordTags(keywords, handleDeleteKeyword){
    let entries = Object.entries(keywords)
    let length = entries.length

    for(let i=0; i<length; i++){
        let [keyword, id] = entries[i]
        document.getElementById("keyword-tags").append(KeywordTag(id, keyword, handleDeleteKeyword))
    }
}

function getDisplayKeywordArticles(keywordsObj, onclickFunction){
    let entries = Object.entries(keywordsObj)
    let length = entries.length
    let fragment = document.createDocumentFragment()

    for(let i=0; i<length; i++){
        let [keyword, articles] = entries[i]
        fragment.append(KeywordArticles(keyword, articles, onclickFunction))
    }

    return fragment
}

function displayKeywordArticles(keywordsObj, onclickFunction){
    document.getElementById("keyword-articles").append(getDisplayKeywordArticles(keywordsObj, onclickFunction))
}

export { getDisplayElement, displayKeywordTags, getDisplayKeywordArticles, displayKeywordArticles }