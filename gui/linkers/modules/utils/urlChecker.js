import { lazySplit, isOnlyDigits } from "./utils.js"
import { firstURLLazySplit } from "./websiteUtils.js"

function checkUrl(url, urlInfo){
    let [index, tag] = firstURLLazySplit(url, 0)

    let possibleTags = []
    let failedAttemps = 0
    let tagsConcatenation = []

    while(index !== -1 && failedAttemps<urlInfo.maxFailedAttemps){
        [index, tag] = lazySplit(url, index)

        if(!tag || tag[0] === "?" || urlInfo.invalidCategories.has(tag) || isOnlyDigits(tag) || tag.length>20) failedAttemps += 1
        else{
            tagsConcatenation.push(tag)
            possibleTags.push(tagsConcatenation.join("/"))
        }
    }

    return possibleTags
}

function sequentialURLCheck(urls, urlInfo){
    let s = new Set()

    for(let i=urls.length-1; i>=0; i--){
        let possibleTags = checkUrl(urls[i], urlInfo)
        for(let j=possibleTags.length-1; j>=0; j--) s.add(possibleTags[j])
    }
    
    return [...s]
}

export { checkUrl, sequentialURLCheck }