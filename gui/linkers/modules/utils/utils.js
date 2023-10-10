import { ArticleItems } from "../utils/dataTypes.js"

const ltrimRE = /^\s+/g 
const rTrimRE = /\s+$/g
const isDigits = /^\d+$/

Array.prototype.last = function(negativeIndex){
    return this[this.length+negativeIndex]
}

function count(text, substring){
    let length = text.length, count = 0, index = text.indexOf(substring), subLength = substring.length 

    while(index>-1 && index<length){
        count += 1
        index = text.indexOf(substring, index+subLength)
    }

    return count
}

function randrange(min, max){
    return Math.trunc(Math.random() * (max - min) + min);
}

function isOnlyDigits(str){
    return isDigits.test(str);
}

function lazySplit(word, currentIndex, delimiter="/"){
    let index = word.find(delimiter, currentIndex)
    if(index !== -1) return [index+1, word.slice(currentIndex, index)]
    else return [-1, word.slice(currentIndex)]
}
    
function removeNone(enumData){
    const index = enumData.indexOf(null);

    if (index !== -1) {
        enumData.splice(index, 1);
    }
}

function sortArticleNodesByClass(articles){
    let table = {}
    let len = articles.length

    for(var i=0; i<len; i++){
        let article = articles[i]
        if(article.tagClass in table) table[article.tagClass].push(article)
        else table[article.tagClass] = [article]
    }
    
    return table
}

function gimmeRandom(n, min, max){
    let arr = new Set()

    while(arr.size !== n) arr.add(randrange(min,max))
    
    return [...arr.keys()].sort((x, y) => x - y)
}

function calculate_article_code(articleElements){
    return [get_article_code(articleElements[ArticleItems.IMG]), get_article_code(articleElements[ArticleItems.HEADER]),
        get_article_code(articleElements[ArticleItems.TITLE]), get_article_code(articleElements[ArticleItems.DESCRIPTION])].join("")
}

function get_article_code(articleItem){
    return articleItem? "1": "0"
}

function isArticleElementsTableEmpty(articleTable){
    return !articleTable[ArticleItems.TITLE] && !articleTable[ArticleItems.IMG] && !articleTable[ArticleItems.HEADER] && !articleTable[ArticleItems.DESCRIPTION]
}

function sumArticleElementsTableCode(articleTable){
    let sum = 0
    let code = get(articleTable, ArticleItems.CODE, calculate_article_code(articleTable))
    articleTable[ArticleItems.CODE] = code
    
    for(let i=code.length-1; i>=0; i--) sum += parseInt(code[i])

    return code
}

function getArticlesLink(articleTable){
    return articleTable[ArticleItems.TITLE].link
}

function index(list, element){
    let length = list.length

    for(var i=0; i<length; i++){
        if(list[i] === element) return i
    }
    
    return -1
}

function get(obj, key, notFound){
    return obj[key] || notFound
}

function lTrim(text){
    return text.replace(ltrimRE, "")
}

function rTrim(text){
    return text.replace(rTrimRE, "")
}

function getValuesFromObjAsArray(obj, property){
    return obj? obj.map(partialObj => partialObj[property]): []
}

function getValuesFromObj(obj){
    return Object.values(obj)
}

function hasSomething(obj){
    for(let key in obj){
        return true
    }

    return false
}

function getArrayWithN(n){
    let arr = []
    for(let i=0; i<n; i++) arr.push(i)
    return arr
}

function get_favicon_src(websiteId, faviconsPath){
    return path_join(faviconsPath, `${websiteId}.ico`)
}

function binary_search(value, array=[], comparissonFunction=(a,b) => a<b, equalFunction=(a,b) => a===b){
    let start = 0
    let end = array.length
    let diff = end-start

    while(diff>1){
        let middle = start + (diff>>1)

        if(equalFunction(value, array[middle])) return array[middle]

        if(comparissonFunction(value, array[middle])) end = middle
        else start = middle

        diff = end-start
    }

    return equalFunction(value, array[start])? array[start]: undefined
}

function binary_search_for_insertion(value, array=[], comparissonFunction=(a,b) => a<b){
    let start = 0
    let end = array.length
    let diff = end-start

    while(diff>1){
        let middle = start + (diff>>1)

        if(comparissonFunction(value, array[middle])) end = middle
        else start = middle

        diff = end-start
    }

    return comparissonFunction(value, array[start])? start: end
}

export { randrange, isOnlyDigits, lazySplit, removeNone, sortArticleNodesByClass, gimmeRandom, 
    calculate_article_code, isArticleElementsTableEmpty, getArticlesLink, index, get, count,
    lTrim, rTrim, getValuesFromObjAsArray, getValuesFromObj, hasSomething, sumArticleElementsTableCode, getArrayWithN,
    get_favicon_src, binary_search_for_insertion, binary_search}
