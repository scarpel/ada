import SpecificClassHTMLParser from "./specificClassHtmlParser.js"
import { fetch_all, fetch_html } from "../utils/htmlFetcher.js" 
import { date_before_x_days } from "../utils/dateUtils.js"
import { sort_by_url, get_main_url } from "../utils/websiteUtils.js"
import { get_urls_from_interval } from "../utils/databaseUtils.js"
import ArticleHTMLInterpreter from "./articleInterpreter.js"
import ArticleHTMLParser from "./articleParser.js"
import ArticlePredictor from "./articlePredictor.js"
import { get_possible_categories_and_urls } from "../utils/urlAnalyser.js"
import { NewsWebsiteInfo } from "../utils/dataTypes.js"
import { get_news_website_basic_info, get_category_name, shuffle_all } from "../utils/newsUtils.js"
import { search_html } from "../utils/htmlSearcher.js"
import { get_tag_content } from "../utils/htmlUtils.js"
import { get_all_before_until } from "../utils/strFuncs.js"
import { getCategoryObj } from "../utils/newsDataType.js"
import { NEWS_WEBSITES, USERS_NEWS_WEBSITES } from "../consts/databaseConsts.js"
import { retrieve_newsWebsiteInfo, fill_up_newsWebsiteInfo, retrieve_newsWebsiteInfo_from_url } from "./storageNews.js"
import NewNewsWebsite from "../../components/NewNewsWebsite.js"
import { simplify_classes } from "./articleClassesSimplifier.js"

const article_groups = {
    "0010": "0010",
    "0011": "xx1x",
    "0110": "xx1x",
    "0111": "xx1x",
    "1010": "1x10",
    "1110": "1x10",
    "1011": "xx1x",
    "1111": "xx1x",
    "xx1x": "xx1x",
    "1x10": "1x10"
}

// async function get_articles_from_websites(websitesInfo, numberTags){
//     let specificParser = new SpecificClassHTMLParser()
//     let articleNodes = {}
//     let urls = []
//     let websitesCategories = []

//     let websites = Object.entries(websitesInfo.newsWebSitesInfo)
//     let websitesLength = websites.length
//     for(let i=0; i<websitesLength; i++){
//         let [website, urlInfo] = websites[i]

//         let frequentCategories = get_x_most_frequent_categories(urlInfo.categories, numberTags)
//         frequentCategories.push("")
//         websitesCategories.push(frequentCategories)

//         for(let j=frequentCategories.length-1; j>=0; j--){
//             urls.push(`${website}/${frequentCategories[j]}/`)
//         }
//     }

//     // for website, urlInfo in websitesInfo.newsWebSitesInfo.items():
//     //     print(website)
//     //     let frequentTags = get_x_most_frequent_tags(urlInfo.tags, numberTags)
//     //     frequentTags.push("")
//     //     websitesTags.push(frequentTags)
//     //     urls.extend([f"{website}/tag" for tag in frequentTags])
    
//     let htmls = await fetch_all(urls)
//     let htmlIndex = 0

//     for(let i=0; i<websitesLength; i++){
//         let categories = websitesCategories[i]
//         let [website, urlInfo] = websites[i]
//         let table = {}

//         for(let j=categories.length-1; j>=0; j--){
//             let category = categories[i]
//             html = htmls[htmlIndex]
//             if(html) table[category] = specificParser.parseArticleElements(html, urlInfo)

//             htmlIndex += 1
//         }

//         articleNodes[website] = table
//     }

//     return articleNodes
// }

async function get_prepared_articles_from_websites(newsNewsiteInfos, specificParser = new SpecificClassHTMLParser()){
    let articles = await get_articles_from_websites(newsNewsiteInfos, specificParser)
    if(articles && articles.length>0){
        return shuffle_all(sort_all_articles_by_group(articles))
    }else return {}
}

async function get_articles_from_websites(newsNewsiteInfos, specificParser = new SpecificClassHTMLParser()){
    let websites = Object.values(newsNewsiteInfos)
    let validWebsites = []
    let length = websites.length
    let urls = []
    let articles = []

    for(let i=0; i<length; i++){
        let websiteInfo = websites[i]
        if(websiteInfo){
            urls.push(websiteInfo.url)
            validWebsites.push(websiteInfo)
        }
    }

    let htmls = await fetch_all(urls)
    length = validWebsites.length

    for(let i=0; i<length; i++){
        articles.push(specificParser.parseArticleElements(htmls[i], validWebsites[i]))
    }

    return articles
}

function get_x_most_frequent_categories(tagsCounter, numberTags){
    return tagsCounter.keys().sort((a, b) => tagsCounter.values[a]>tagsCounter.values[b]?-1:1).slice(0, numberTags)
}

function filter_sorted_urls(sortedUrls, newsWebSites, minLengthSet=2){
    let keys = Object.keys(sortedUrls)
    let knownWebsites = {}, unknownWebsites = {}

    for(let i=keys.length-1; i>=0; i--){
        let key = keys[i]
        if(key.slice(0, 5) === "https"){
            if(key in newsWebSites) knownWebsites[key] = sortedUrls[key]
            else if(sortedUrls[key].size>=minLengthSet) unknownWebsites[key] = sortedUrls[key]
        }
    }

    return [knownWebsites, unknownWebsites]
}

function get_websites_from_browser_in_interval(newsWebsitesInfos, browserInfo, currentDate = new Date(), daysBefore=7){
    let startDate = date_before_x_days(daysBefore, currentDate)
    return filter_sorted_urls(sort_by_url(get_urls_from_interval(startDate, currentDate, browserInfo)), newsWebsitesInfos)
}

async function get_unknown_newsWebsitesInfo(unknownWebsites, parser = new ArticleHTMLParser(), interpreter = new ArticleHTMLInterpreter(), 
specificParser = new SpecificClassHTMLParser, predictor = new ArticlePredictor()){
    let unknownUrls = Object.keys(unknownWebsites)
    let length = unknownUrls.length
    let reallyUnknownUrls = []
    let websiteInfos = {}

    for(let i=0; i<length; i++){
        let url = unknownUrls[i]
        let newsInfo = retrieve_newsWebsiteInfo_from_url(database, url)

        if(newsInfo){
            newsInfo.alreadyStored = true
            websiteInfos[url] = newsInfo
        }else reallyUnknownUrls.push(url)
    }

    let htmls = await fetch_all(reallyUnknownUrls)
    length = reallyUnknownUrls.length

    for(let i=0; i<length; i++){
        let html = htmls[i]
        let url = reallyUnknownUrls[i]

        if(html){
            let articleClasses = interpreter.interpret(parser.parse(html)).getArticleClasses()
            if(articleClasses.size>0){
                let articleClassNodes = specificParser.parse(html, articleClasses)
                let articleElements = predictor.predictFromClasses(articleClassNodes)
                let articleElementsLength = Object.keys(articleElements).length

                if(articleElementsLength>0){
                    let basicInfo = get_news_website_basic_info(html, url)
                    let newsInfo = new NewsWebsiteInfo(null, basicInfo.mainUrl, basicInfo.websiteName, basicInfo.type, length, articleElements)
                    newsInfo.faviconUrl = basicInfo.faviconUrl
                    websiteInfos[url] = newsInfo

                    continue
                }
            }
        }

        delete unknownWebsites[url]
    }

    return websiteInfos
}

async function get_all_categories_from_websites(sortedUrls, newsWebsitesInfo){
    let websiteUrls = Object.keys(sortedUrls)
    let length = websiteUrls.length
    let categoriesInfo = []
    let allCategoriesUrl = []
    let knownWebsites = {}, unknownWebsites = {}

    for(let i=0; i<length; i++){
        let websiteUrl = websiteUrls[i]
        let websiteInfo = newsWebsitesInfo[websiteUrl]

        let [categories, categoriesUrl] = get_possible_categories_and_urls(websiteInfo, [...sortedUrls[websiteUrl]])

        if(categories.length>0){
            categoriesInfo.push([websiteInfo, categories])
            allCategoriesUrl.push(...categoriesUrl)
        }else if(!websiteInfo.id || websiteInfo.alreadyStored) unknownWebsites[websiteInfo.url] = [{}, new Set(), websiteInfo]
    }

    let start = new Date().getTime()
    let htmls = await fetch_all(allCategoriesUrl)
    length = categoriesInfo.length
    let currentIndex = 0
    let middle = new Date().getTime()

    for(let i=0; i<length; i++){
        let [newsInfo, categories] = categoriesInfo[i]
        let categoriesLength = categories.length
        let categoriesObj = {}
        let invalidCategories = new Set()
        let categoriesAdded = 0
        let articleClasses = Object.keys(newsInfo.articlesInfo)
        let articleClassesLength = articleClasses.length

        for(let j=0; j<categoriesLength; j++){
            let category = categories[j]
            let html = htmls[currentIndex]

            if(search_html(html, articleClasses, articleClassesLength)){
                let name = get_category_name(category, get_tag_content(html, "title"))
                categoriesObj[category] = getCategoryObj(name)
            }else{
                let tag = get_all_before_until(category, "/", category.length-1)
                invalidCategories.add(tag)
            }
            
            categoriesAdded++
            currentIndex++
        }

        if(categoriesAdded>0){
            if(newsInfo.id && !newsInfo.alreadyStored) knownWebsites[newsInfo.url] = [categoriesObj, invalidCategories, newsInfo]
            else unknownWebsites[newsInfo.url] = [categoriesObj, invalidCategories, newsInfo]
        }else if(!newsInfo.id || newsInfo.alreadyStored) unknownWebsites[newsInfo.url] = [categoriesObj, invalidCategories, newsInfo]
    }

    console.log((new Date().getTime() - middle)/1000)
    return [knownWebsites, unknownWebsites]
}

async function get_all_categories_from_website(categoriesUrls, newsWebsiteInfo){
    let length = categoriesUrls.length
    let validCategories = {}
    let invalidCategories = new Set()

    if(length>0){
        let mainUrlLength = newsWebsiteInfo.url.length
        let categories = []
        
        for(let i=0; i<length; i++) categories.push(categoriesUrls[i].slice(mainUrlLength))
    
        let htmls = await fetch_all(categoriesUrls)
    
        let articleClasses = Object.keys(newsWebsiteInfo.articlesInfo)
        let articleClassesLength = articleClasses.length
    
        for(let j=0; j<length; j++){
            let category = categories[j]
            let html = htmls[j]

            if(search_html(html, articleClasses, articleClassesLength)){
                let name = get_category_name(category, get_tag_content(html, "title"))
                validCategories[category] = getCategoryObj(name)
            }else{
                let tag = get_all_before_until(category, "/", category.length-1)
                invalidCategories.add(tag)
            }
        }
    
    }
    
    return [validCategories, invalidCategories]
}

async function gather_info_from_browser(connection, browserInfo, newsWebsitesInfo, daysBefore=7, parser = new ArticleHTMLParser(), interpreter = new ArticleHTMLInterpreter(), 
specificParser = new SpecificClassHTMLParser, predictor = new ArticlePredictor()){
    let [knownUrls, unknownUrls] = get_websites_from_browser_in_interval(newsWebsitesInfo, browserInfo, undefined, daysBefore)
    let unknownInfos = await get_unknown_newsWebsitesInfo(unknownUrls, parser, interpreter, specificParser, predictor)
    update_newsWebsiteInfos(connection, newsWebsitesInfo, Object.keys(knownUrls))

    let categories = await get_all_categories_from_websites({...unknownUrls, ...knownUrls}, {...unknownInfos, ...newsWebsitesInfo})
    return categories
}

async function get_newsWebsiteInfo_from_url(url, html=null, parser = new ArticleHTMLParser(), interpreter = new ArticleHTMLInterpreter(), 
specificParser = new SpecificClassHTMLParser(), predictor = new ArticlePredictor(), randomFactor = 0.5){
    let start = new Date().getTime()
    url = get_main_url(url)
    if(!html) html = await fetch_html(url)
    console.log((new Date().getTime()-start)/1000)

    let parsed = parser.parse(html)
    let articleClasses = interpreter.interpret(parsed).getArticleClasses()
    if(articleClasses.size){
        console.log(articleClasses)
        let articleInfos = predictor.predictFromClasses(specificParser.parse(html, articleClasses), randomFactor)
        articleInfos = simplify_classes(articleInfos)
        
        if(Object.keys(articleInfos).length){
            let basicInfos = get_news_website_basic_info(html, url)
            let newsInfo = new NewsWebsiteInfo(undefined, url, basicInfos.websiteName, basicInfos.type, 0, articleInfos)
            newsInfo.faviconUrl = basicInfos.faviconUrl

            console.log((new Date().getTime()-start)/1000)
            return newsInfo
        }
    }

    return null
}

function get_article_group_obj(){
    return{
        "0010": [],
        "xx1x": [],
        "1x10": []
    }
}

function sort_articles_by_group(articles, websiteArticlesGroup = get_article_group_obj()){
    let entries = Object.entries(articles)
    let length = entries.length

    for(let i=0; i<length; i++){
        let [code, articlesLinkedList] = entries[i]
        websiteArticlesGroup[article_groups[code]].push(articlesLinkedList)
    }

    return websiteArticlesGroup
}

function sort_all_articles_by_group(articlesArray){
    let length = articlesArray.length
    let websiteArticlesGroup = get_article_group_obj()

    for(let i=0; i<length; i++){
        sort_articles_by_group(articlesArray[i], websiteArticlesGroup)
    }

    return websiteArticlesGroup
}

function get_newsWebsiteInfos_by_score(connection, userId, onlyNFirsts = undefined){
    let result = connection.prepare(`SELECT n.* FROM ${NEWS_WEBSITES} n, ${USERS_NEWS_WEBSITES} u WHERE u.user_id=? AND u.website_id = n.id ORDER BY score DESC`).all(userId)
    let resultLength = result.length

    if(onlyNFirsts === undefined) onlyNFirsts = resultLength

    if(resultLength>0){
        let newsInfos = {}
    
        for(let i=0; i<onlyNFirsts; i++){
            let newsInfo = NewsWebsiteInfo.fromObject(result[i])
            fill_up_newsWebsiteInfo(connection, newsInfo)
            newsInfos[newsInfo.url] = newsInfo
        }
    
        for(let i=onlyNFirsts; i<resultLength; i++) newsInfos[result[i].url] = undefined
    
        return newsInfos
    }else return {}
}

function update_newsWebsiteInfos(connection, newsWebsitesInfo, urls){
    for(let i=urls.length-1; i>=0; i--){
        let url = urls[i]
        let newsInfo = newsWebsitesInfo[url]

        if(!newsInfo){
            newsWebsitesInfo[url] = retrieve_newsWebsiteInfo(connection, null, url)
        }
    }

    return newsWebsitesInfo
}

function filter_knownWebsites(knownWebsites){
    let entries = Object.entries(knownWebsites)
    let length = entries.length
    let newObj = {}

    for(let i=0; i<length; i++){
        let [url, items] = entries[i]
        if(Object.keys(items[0]).length>0) newObj[url] = items
    }

    return newObj
}

function setManageWebsites(urls, length){
    let fragment = document.createDocumentFragment()

    for(let i=0; i<length; i++){
        let newsInfo = newsInfos[urls[i]]
        if(!newsInfo){
            newsInfo = retrieve_newsWebsiteInfo(database, undefined, urls[i])
            newsInfos[urls[i]] = newsInfo
        }

        fragment.append(NewNewsWebsite())
    }
}

export { get_articles_from_websites, get_newsWebsiteInfo_from_url, article_groups, 
    sort_articles_by_group, sort_all_articles_by_group, get_websites_from_browser_in_interval, 
    get_unknown_newsWebsitesInfo, get_all_categories_from_websites, get_newsWebsiteInfos_by_score,
    update_newsWebsiteInfos, gather_info_from_browser, filter_knownWebsites, get_prepared_articles_from_websites,
    get_all_categories_from_website }