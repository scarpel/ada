import { ArticleItems } from "../utils/dataTypes.js"

function get_word_set_from_article_codes(articlesByCode){
    let entries = Object.entries(articlesByCode)
    let obj = {}

    for(let i=entries.length-1; i>=0; i--){
        let [code, articles] = entries[i]
        obj[code] = get_articles_word_sets(articles)
    }

    return obj
}

function get_articles_word_sets(articles){
    let length = articles.length
    let arr = []

    for(let i=0; i<length; i++){
        arr.push(get_article_word_set(articles[i]))
    }

    return arr
}

function get_article_word_set(article){
    let set = new Set()

    let item = article[ArticleItems.HEADER]
    if(item) add_array_to_set(get_words_array(item.content), set)

    item = article[ArticleItems.TITLE]
    if(item) add_array_to_set(get_words_array(item.content), set)

    item = article[ArticleItems.DESCRIPTION]
    if(item) add_array_to_set(get_words_array(item.content), set)

    return set
}

function add_array_to_set(array, set){
    for(let i=array.length-1; i>=0; i--){
        set.add(array[i])
    }
}

function get_words_array(text){
    if(text){
        return text.toLowerCase().split(" ")
    }else return []
}

function verify_articles_code_obj_for_keys(articlesObj, wordsSetObj, keys){
    let entries = Object.entries(articlesObj)
    let length = entries.length
    let keysObj = {}

    for(let i=0; i<length; i++){
        let [code, articles] = entries[i]
        let selected = verify_articles_for_keys(articles, wordsSetObj[code], keys)
        let selectedKeys = Object.keys(selected)

        for(let i=selectedKeys.length-1; i>=0; i--){
            let key = selectedKeys[i]
            let keyObj = keysObj[key]

            if(keyObj) keyObj[code] = selected[key]
            else keysObj[key] = {[code]: selected[key]}
        }
    }

    return keysObj
}

function verify_articles_for_keys(articles, wordsSets, keys){
    let keysLength = keys.length
    let articlesLength = articles.length
    let keysObj = {}

    for(let i=0; i<articlesLength; i++){
        verify_word_set_for_keys(articles[i], wordsSets[i], keys, keysLength, keysObj)
    }

    return keysObj
}

function verify_word_set_for_keys(article, wordsSet, keys, keysLength, keysObj){
    for(let i=0; i<keysLength; i++){
        let key = keys[i]
        if(wordsSet.has(key)){
            let obj = keysObj[key]
            if(!obj) keysObj[key] = [article]
            else obj.push(article)
        }
    }
}

export { get_word_set_from_article_codes, get_articles_word_sets, get_article_word_set, verify_articles_code_obj_for_keys }