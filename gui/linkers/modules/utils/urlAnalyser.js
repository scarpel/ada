import { sequentialURLCheck } from "./urlChecker.js"
import { fetch_all } from "./htmlFetcher.js"
import { sequential_html_search } from "./htmlSearcher.js"
import { get_formatted_date } from "./dateUtils.js"

function analyse(urlInfo, commonUrlsArray, minNumOccurences=2){
    if(commonUrlsArray.length === 0) return []

    let possibleCategories = sequentialURLCheck(commonUrlsArray, urlInfo)
    let length = possibleCategories.length
    let categories = []

    if(length>0){
        // let today = get_formatted_date()
        let urlsToFetch = []
        let newPossibleCategories = []
        let url = urlInfo.url

        // if(urlInfo.lastTagsUpdate<today){
        //     let keys = Object.keys(urlInfo.tags)
        //     for(let i=keys.length-1; i>=0; i--){
        //         let key = keys[i]
        //         if(possibleTagsSet.has(key)){
        //             urlInfo.tags.add(key)
        //             possibleTags.remove(key)
        //         }else urlInfo.tags.decrease(key)
        //     }

        //     urlInfo.lastTagsUpdate = today
        //     possibleTags = [...possibleTagsSet]
        //     let length = possibleTags.length
        //     for(let i=0; i<length; i++){
        //         urlsToFetch.push(`${url}/${tag}/`)
        //     }
        // }else{
        for(let i=0; i<length; i++){
            let category = possibleCategories[i]
            if(!urlInfo.categories.has(category)){
                newPossibleCategories.push(category)
                urlsToFetch.push(`${url}${category}/`)
            }
        }

        return [newPossibleCategories, urlsToFetch]
        // let htmls = await fetch_all(urlsToFetch)
        // let verifiedHtmls = sequential_html_search(htmls, urlInfo, minNumOccurences)

        // for(let i=verifiedHtmls.length-1; i>=0; i--){
        //     if(verifiedHtmls[i]) categories.push(newPossibleTags[i])
        // }
    }else return [[],[]]
}

function get_possible_categories_and_urls(urlInfo, commonUrlsArray = []){
    if(commonUrlsArray.length === 0) return [[],[]]

    let possibleCategories = sequentialURLCheck(commonUrlsArray, urlInfo)
    let length = possibleCategories.length
    
    if(length>0){
        let categories = []
        let urlsToFetch = []
        let url = urlInfo.url

        for(let i=0; i<length; i++){
            let category = possibleCategories[i]
            if(!(category in urlInfo.categories)){
                categories.push(category)
                urlsToFetch.push(`${url}${category}/`)
            }
        }

        return [categories, urlsToFetch]
    }else return [[],[]]
}

export { analyse, get_possible_categories_and_urls }