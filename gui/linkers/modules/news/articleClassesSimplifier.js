import { ArticleItems } from "../utils/dataTypes.js"

function simplify_classes(predictedClasses){
    let sorted = {}
    let splittedClasses = {}
    let entries = Object.entries(predictedClasses)

    if(entries.length === 1) return predictedClasses

    for(let i=0, length=entries.length; i<length; i++){
        let entry = entries[i]
        let splitted = entry[0].split(" ")

        if(splitted[0] in sorted){
            sorted[splitted[0]].push(entry)
            splittedClasses[splitted[0]].push(splitted)
        }else{
            sorted[splitted[0]] = [entry]
            splittedClasses[splitted[0]] = [splitted]
        }
    }

    return analyse_sorted_classes(sorted, splittedClasses)
}

function analyse_sorted_classes(sortedClasses, splittedClasses){
    return Object.assign({}, ...Object.keys(sortedClasses).map(key => analyse_sorted_class(sortedClasses[key], splittedClasses[key])))
}

function analyse_sorted_class(sortedArray, splittedArray){
    if(sortedArray.length === 1) return {[sortedArray[0][0]]: sortedArray[0][1]}

    let delimiter = splittedArray[0].length
    let firstObj = sortedArray[0][1]
    let equal = [sortedArray[0]]
    let diff = []
    let articleAuthor = undefined

    for(let i=1, length=sortedArray.length; i<length; i++){
        if(isSame(firstObj, sortedArray[i][1])){
            if(delimiter>1) delimiter = calculateDelimiter(delimiter, splittedArray[0], splittedArray[i])
            if(sortedArray[i][1][ArticleItems.AUTHOR] && !articleAuthor) articleAuthor = sortedArray[i][1][ArticleItems.AUTHOR]
            equal.push(sortedArray[i])
        }else diff.push(sortedArray[i])
    }

    if(diff.length === 0){
        let k = splittedArray[0].slice(0, delimiter).join(" ")
        let o = firstObj
        if(articleAuthor) o[ArticleItems.AUTHOR] = articleAuthor
        
        return { [k]: o }
    }else return Object.fromEntries(sortedArray)
}

function calculateDelimiter(currentDelimiter, splittedA, splittedB){
    for(let i=1; i<currentDelimiter; i++){
        if(splittedA[i] !== splittedB[i]) return i
    }

    return currentDelimiter
}

function isSame(a, b){
    if(a[ArticleItems.CODE] !== b[ArticleItems.CODE]) return false

    let keys = Object.keys(a)
    keys.pop()

    for(let i=0, length=keys.length; i<length; i++){
        let key = keys[i]
        if(key !== ArticleItems.AUTHOR && a[key].tag !== b[key].tag && a[key].tagClass !== b[key].tagClass) return false
    }

    return true
}

export {simplify_classes}