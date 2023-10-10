import { get_browser_info } from "./modules/utils/browserUtils.js"
import { gather_info_from_browser, filter_knownWebsites, get_newsWebsiteInfos_by_score, get_prepared_articles_from_websites, get_newsWebsiteInfo_from_url, get_all_categories_from_website} from "./modules/news/newsFacade.js"
import { store_news_websites, 
    store_categories_after_gathering_of_known, store_invalid_categories_after_gathering, 
    store_keyword, retrieve_keywords, delete_keyword, delete_news_website, delete_news_category, retrieve_newsWebsiteInfo, store_news_website, store_user_news_website, delete_user_news_website } from "./modules/news/storageNews.js"
import NewNewsWebsite from "./components/NewNewsWebsite.js"
import UnknownNewsWebsite from "./components/UnknownNewsWebsite.js"
import { clearChildren, cleanAppend, createElement } from "./modules/utils/htmlUtils.js"
import { getDisplayElement, displayKeywordTags, displayKeywordArticles } from "./modules/news/newsDisplay.js"
import PagesSelector from "./components/PagesSelector.js"
import { get_word_set_from_article_codes, verify_articles_code_obj_for_keys } from "./modules/news/articleKeyFinder.js"
import KeywordTag from "./components/KeywordTag.js"
import KeywordArticles from "./components/KeywordArticles.js"
import StatusMessage from "./components/StatusMessage.js"
import NewsWebsiteElement from "./components/NewsWebsiteElement.js"
import { treat_all_url } from "./modules/utils/websiteUtils.js"

let unknownGatheredInfo, knownGatheredInfo, keywords, articles, wordSetObj, pages, newsInfos, scanningHistory, addingWebsite
let articleHasChanged, keywordsLength = 0, numKeywordArticles = 0, alreadyShowedKeywords = false

window.newsSetup = async () => {
    changeTitleBarBackground("rgb(38, 120, 226)")
    changeContentBackground("rgb(38, 120, 226)")

    articleHasChanged = addingWebsite = scanningHistory = alreadyShowedKeywords = false

    if(!newsInfos) newsInfos = get_newsWebsiteInfos_by_score(database, userInfo.id)
    if(!articles) articles = {}

    update_news()
}

window.update_news = async () => {
    let now = new Date()
    document.getElementById("last-update-hour").innerText = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`
    let element = document.getElementById("articles-bottom")
    clearChildren(element)

    if(Object.keys(newsInfos).length>0){
        articleHasChanged = true
        clearChildren(element)
        element.append(StatusMessage(null, createElement("div", "article-spinner"), "Getting articles...", null))
        articles = await get_prepared_articles_from_websites(newsInfos)
        clearChildren(element)
        
        displayArticles()
    }else{
        element.append(
            StatusMessage(undefined, undefined, "No News Websites", 
                "I couldn't find any news websites.<br>Try <em>add a news website</em> or <em>scan your history</em>!"
            )
        )
    }
}

function showPopUpElement(elementId, display="block"){
    document.getElementById(elementId).style.display = display
    document.getElementById("main").style.filter = "blur(2px)"
}

function hidePopUpElement(elementId){
    document.getElementById(elementId).style.display = "none"
    document.getElementById("main").style.filter = "none"
}

function showElement(elementId, display="block"){
    document.getElementById(elementId).style.display = display
}

function hideElement(elementId){
    document.getElementById(elementId).style.display = "none"
}

function displayUnknownWebsites(unknownWebsites, counter=undefined){
    displayGatheredWebsites(Object.values(unknownWebsites), UnknownNewsWebsite, "unknown-websites", counter)
}

function displayKnownWebsites(knownWebsites, counter=undefined){
    displayGatheredWebsites(Object.values(knownWebsites), NewNewsWebsite, "known-websites", counter)
}

function displayGatheredWebsites(infos, component, elementID, counter=undefined){
    let infosLength = infos.length

    let fragment = document.createDocumentFragment()

    for(let i=0; i<infosLength; i++){
        fragment.append(component(infos[i], i, counter))
    }

    document.getElementById(elementID).append(fragment)
}

function get_valids_known_websitesInfo(knownGatheredInfo={}){
    let values = Object.values(knownGatheredInfo)
    let length = values.length
    let valid = []

    for(let i=0; i<length; i++){
        let categoriesNodes = document.getElementById(`${i}-categories`)
        if(categoriesNodes){
            let [categories, _, newsInfo] = values[i]

            categories = Object.entries(categories)

            categoriesNodes = categoriesNodes.children
            let categoriesLength = categoriesNodes.length
            let selectedCategories = {}
            let count = 0

            for(let j=0; j<categoriesLength; j++){
                if(categoriesNodes[j].classList.contains("checked")){
                    let [categoryUrl, categoryObj] = categories[j]
                    selectedCategories[categoryUrl] = categoryObj

                    count++
                }
            }

            if(count>0) valid.push([newsInfo, selectedCategories])
        }
    }

    return valid
}

function get_valids_unknown_websitesInfo(unknownGatheredInfo={}){
    let nodes = document.getElementById("unknown-websites").children
    let length = nodes.length
    let values = Object.values(unknownGatheredInfo)
    let valid = []

    for(let i=0; i<length; i++){
        if(document.getElementById(`${i}-unknown-checkbox`).checked){
            let [categories, invalidCategories, newsInfo] = values[i]

            let categoriesNodes = document.getElementById(`${i}-unknown-categories`)
            if(categoriesNodes){
                categories = Object.entries(categories)

                categoriesNodes = categoriesNodes.children
                let categoriesLength = categoriesNodes.length

                for(let j=0; j<categoriesLength; j++){
                    let category = categoriesNodes[j]
                    if(category.classList.contains("checked")){
                        newsInfo.addCategory(...categories[j])
                    }
                }
            }

            newsInfo.invalidCategories = invalidCategories
            valid.push(newsInfo)
        }
    }

    return valid
}

function selectCounter(){
    let checked = 0
    document.getElementById("addToNewsBtn").disabled = true

    return (isChecked = false) => {
        isChecked? checked++: checked--
        document.getElementById("addToNewsBtn").disabled = !checked
    }
}

function resetNewInfoVariables(){
    knownGatheredInfo = null
    unknownGatheredInfo = null
    clearChildren(document.getElementById("unknown-websites"))
    clearChildren(document.getElementById("known-websites"))
    changeSlider(true)
}

window.handle_addToNews = () => {
    // let newsInfos = get_valids_unknown_websitesInfo(unknownGatheredInfo)
    store_news_websites(database, get_valids_unknown_websitesInfo(unknownGatheredInfo), newsInfos, userInfo.id)
    // let selected = get_valids_known_websitesInfo(knownGatheredInfo)
    // console.log(selected)
    store_categories_after_gathering_of_known(database, get_valids_known_websitesInfo(knownGatheredInfo))
    hidePopUpElement("new-info")
    resetNewInfoVariables()
}

window.handle_CancelNewInfo = () => {
    hidePopUpElement("new-info")
    resetNewInfoVariables()
}

window.changeSlider = (toRight=true) => {
    let slider = document.getElementById("slider")
    slider.style.webkitAnimationName = ""

    if(toRight){
        document.getElementById("right-btn").style.webkitAnimationName = "out-slider"
        document.getElementById("left-btn").style.webkitAnimationName = "on-slider"
        slider.style.webkitAnimationName = "slide-left"

        document.getElementById("known-websites").style.display = "none"
        document.getElementById("unknown-websites").style.display = "block"
    }else{
        document.getElementById("right-btn").style.webkitAnimationName = "on-slider"
        document.getElementById("left-btn").style.webkitAnimationName = "out-slider"
        slider.style.webkitAnimationName = "slide-right"

        document.getElementById("known-websites").style.display = "block"
        document.getElementById("unknown-websites").style.display = "none"
    }
}

function handleDeleteKeyword(id, keyword, element){
    delete_keyword(database, id)
    delete keywords[keyword]
    element.remove()
    keywordsLength--

    let kwArticles = document.getElementById(`kw-${keyword}`)
    if(kwArticles){
        kwArticles.remove()
        numKeywordArticles--
    }

    verifyKeywordsVariables()
}

window.handleAddKeyword = () => {
    let text = document.getElementById("keyword").value.toLowerCase()

    if(text){
        hideElement("keyword-message")

        if(isKeywordValid(text)){
            if(!(text in keywords)){
                let id = store_keyword(database, text, userInfo.id)
                let element = KeywordTag(id, text, handleDeleteKeyword)
                element.classList.add("new-keyword")

                document.getElementById("keyword-tags").append(element)
                keywords[text] = id
                keywordsLength++
                document.getElementById("keyword").value = ""

                let selected = verify_articles_code_obj_for_keys(articles, wordSetObj, [text])
                let length = Object.keys(selected).length
                numKeywordArticles += length

                if(length>0){
                    let element = document.getElementById("keyword-articles")

                    if(keywordsLength === 1) clearChildren(element)
                    element.prepend(KeywordArticles(text, selected[text], openInBrowser))
                }else verifyKeywordsVariables()
            }else displayKeywordMessage("The keyword is already stored!")
        }else displayKeywordMessage("The keyword can't have spaces!")
    }
}

function displayKeywordMessage(message){
    document.getElementById("keyword-message").innerText = message
    showElement("keyword-message", "flex")
}

async function displayKeywords(){
    if(!keywords){
        clearChildren(document.getElementById("keyword-articles"))
        
        if(!wordSetObj) wordSetObj = get_word_set_from_article_codes(articles)
        keywords = retrieve_keywords(database, userInfo.id)
        let keys = Object.keys(keywords)
        keywordsLength = keys.length
    }
    
    if(!alreadyShowedKeywords){
        if(keywordsLength>0){
            displayKeywordTags(keywords, handleDeleteKeyword)
            let keywordsObj = verify_articles_code_obj_for_keys(articles, wordSetObj, keys)
            numKeywordArticles = Object.keys(keywordsObj).length

            if(numKeywordArticles>0){
                displayKeywordArticles(keywordsObj, openInBrowser)
                return
            }
        }

        verifyKeywordsVariables()
    }
}

async function displayArticles(numElementsPerPage=30){
    if(articleHasChanged){
        clearChildren(document.getElementById("articles-bottom"))
        clearChildren(document.getElementById("articles-top"))

        if(Object.keys(articles).length>0){
            pages = getDisplayElement(articles, window.openInBrowser, numElementsPerPage)
    
            if(pages.length>1){
                document.getElementById("articles-top").prepend(new PagesSelector(pages.length, (index) => {
                    let articlesElements = document.getElementById("articles-bottom")
                    clearChildren(articlesElements)
                    articlesElements.appendChild(pages[index])
                }))
            }
            
            document.getElementById("articles-bottom").append(pages[0])
        }else document.getElementById("articles-bottom").append(
            StatusMessage(undefined, undefined, "No Articles", 
                "I couldn't find any article.<br>Try again later!"
            )
        )

        articleHasChanged = false
    }
}

window.changeSectionBar = (toArticles = false) => {
    let sectionBar = document.getElementById("section-bar")

    if(sectionBar.classList.contains("at-right") === toArticles){
        if(toArticles){
            displayArticles()
            showElement("articles")
            hideElement("keywords")
        }else{
            displayKeywords()
            showElement("keywords")
            hideElement("articles")
        }
    
        document.getElementById("section-left").classList.toggle("above-bar")
        document.getElementById("section-right").classList.toggle("above-bar")
        sectionBar.classList.toggle("at-right")
    }
}

function isKeywordValid(keyword){
    return keyword.indexOf(" ") === -1
}

window.scanHistory = async () => {
    if(!scanningHistory){
        scanningHistory = toggleLoadingButton("scan-history-btn")

        let databaseInfo = await get_browser_info()
        let infos = await gather_info_from_browser(database, databaseInfo, newsInfos, 7)

        knownGatheredInfo = infos[0]
        let start = new Date().getTime()
        await store_invalid_categories_after_gathering(database, knownGatheredInfo)
        console.log((new Date().getTime()-start)/1000)
    
        knownGatheredInfo = filter_knownWebsites(knownGatheredInfo)
        unknownGatheredInfo = infos[1]
    
        if(Object.keys(unknownGatheredInfo).length>0 || Object.keys(knownGatheredInfo).length>0){
            let counter = selectCounter()
            
            displayUnknownWebsites(unknownGatheredInfo, counter)
            displayKnownWebsites(knownGatheredInfo, counter)
        
            showPopUpElement("new-info", "grid")
    
        }else showMessage(MESSAGE_TYPES.ERROR, "No News Website",
        "I couldn't find any news websites.<br>Try <em>accessing new ones</em> or <em>adding some above</em>!")

        scanningHistory = toggleLoadingButton("scan-history-btn")
    }
}

function showStatusMessage(id, statusMessage){
    let element = document.getElementById(id)
    clearChildren(element)
    element.append(statusMessage)
}

function verifyKeywordsVariables() {
    if(keywordsLength === 0)
        showStatusMessage("keyword-articles", StatusMessage(undefined, undefined, "No Keywords", 
        "I couldn't find any keywords.<br>Try <em>adding some above</em>!"))
    else if(numKeywordArticles === 0)
        showStatusMessage("keyword-articles", StatusMessage(undefined, undefined, "No Articles", 
        `I couldn't find any articles with ${keywordsLength>1?"these keywords":"this keyword"}.<br>Try <em>adding some more above</em>!`))
}

function deleteNewsWebsite(element, newsInfo){
    delete newsInfos[newsInfo.url]
    delete_user_news_website(database, userInfo.id, newsInfo.id)
    element.remove()
}

function deleteNewsCategory(newsInfo, category, element){
    delete newsInfo.categories[category.url]
    delete_news_category(database, category.id)
    element.remove()
}

function getManageWebsites(){
    let urls = Object.keys(newsInfos)
    let length = urls.length

    let fragment = document.createDocumentFragment()

    for(let i=0; i<length; i++){
        let url = urls[i]
        let newsInfo = newsInfos[url]
        if(!newsInfo){
            newsInfo = retrieve_newsWebsiteInfo(database, undefined, url)
            newsInfos[url] = newsInfo
        }

        fragment.append(NewsWebsiteElement(newsInfo, deleteNewsWebsite, deleteNewsCategory))
    }

    return fragment
}

window.handleManageWebsites = () => {
    cleanAppend(document.getElementById("all-websites"), getManageWebsites())
    showPopUpElement("manage-websites")
}

window.hideManageWebsites = () => {
    hidePopUpElement("manage-websites")
}

window.handleAddNewsWebsite = () => {
    if(!addingWebsite){
        toggleLoadingButton("add-website-btn")
        setTimeout(() => {addingWebsite = toggleLoadingButton("add-website-btn")}, 2000)
    }
}

async function addNewsWebsite(url, successMessage=true){
    try{
        let newsInfo = await get_newsWebsiteInfo_from_url(url)

        if(newsInfo){
            // newsInfos[url] = newsInfo
            // store_news_website(database, newsInfo)
            // store_user_news_website(database, userInfo.id, newsInfo.id)

            if(successMessage) showMessage(MESSAGE_TYPES.SUCCESS, "Another One in the Basket", `${newsInfos[url].name} was saved in your news websites!`)

            return newsInfo
        }else showMessage(MESSAGE_TYPES.ERROR, "Annn... what?!", `Wow, am I too dumb or this is not a news website? Check the url and try again`)
    }catch (error){
        console.log(error)
        showMessage(MESSAGE_TYPES.ERROR, "Annn... what?!", `Wow, am I too dumb or this is not a news website? Check the url and try again`)
    }

    return null
}

function createAddedcategory(){
    let base = createElement("div", "added-category")
    let input = createElement("input", "category-url")
    input.type = "text"
    input.placeholder = "Category URL"
    input.onblur = () => { if(input.value === "") base.remove() }

    let button = createElement("button", "delete-category")
    button.innerHTML = "&times;"
    button.onclick = () => {base.remove()}

    base.append(input)
    base.append(button)
    return base
}

window.handleAddCategory = () => {
    let element = createAddedcategory()
    document.getElementById("categories-display").append(element)
    element.children[0].focus()
}

window.handleAddNewsWebsite = async () => {
    addingWebsite = toggleLoadingButton("add-website-btn")
    hideAddWebsite()

    let url = treat_all_url(document.getElementById("add-website-input").value)
    url = url.slice(0, url.indexOf("/", 9)+1)
    let newsInfo = newsInfos[url], isAlreadyInNews = false

    if(newsInfo) isAlreadyInNews = true
    else{
        newsInfo = retrieve_newsWebsiteInfo(database, undefined, url)
        if(newsInfo){
            newsInfos[url] = newsInfo
            store_user_news_website(database, userInfo.id, newsInfo.id)
        }else newsInfo = await addNewsWebsite(url, false)
    }

    if(newsInfo){
        let categories = document.getElementById("categories-display").children
        let length = categories.length
        if(length>0){
            let categoriesUrls = []

            for(let i=0; i<length; i++){
                let categoryUrl = treat_all_url(categories[i].children[0].value)
                if(categoryUrl.indexOf(url) !== -1) categoriesUrls.push(categoryUrl)
            }

            let [validCategories, invalidCategories] = await get_all_categories_from_website(categoriesUrls, newsInfo)
            let keys = Object.keys(validCategories)
            length = keys.length
            
            if(length>0){
                categories = []
                for(let i=0; i<length; i++) categories.push(validCategories[keys[i]].name)
                newsInfo.categories = validCategories
                newsInfo.invalidCategories = invalidCategories
                showMessage(MESSAGE_TYPES.SUCCESS, "Another One in the Basket", `${isAlreadyInNews? "":`${newsInfo.name} was saved in your news websites!<br>`}The following ${length>1?"categories were":"category was"} added: ${categories.join(", ")}`)
            }else showMessage(MESSAGE_TYPES.SUCCESS, "Another One in the Basket", `${isAlreadyInNews? "":`${newsInfo.name} was saved in your news websites!<br>`}None of the categories were valid, so none were added!`)
        }else{
            if(isAlreadyInNews) showMessage(MESSAGE_TYPES.ERROR, "Duplicate Website", `${newsInfo.name} is already in your news websites!`)
            else showMessage(MESSAGE_TYPES.SUCCESS, "Another One in the Basket", `${newsInfo.name} was saved in your news websites!`)
        }

        console.log(newsInfo)
    }

    addingWebsite = toggleLoadingButton("add-website-btn")
}

function resetAddWebsites(){
    document.getElementById("add-btn").disabled = true
    document.getElementById("add-website-input").value = ""
    clearChildren(document.getElementById("categories-display"))
}

window.showAddWebsite = () => {
    resetAddWebsites()
    showPopUpElement("add-website")
}

window.hideAddWebsite = () => {
    hidePopUpElement("add-website")
}

window.handleOnKeyPressAddInput = (event) => {
    document.getElementById("add-btn").disabled = event.target.value===""? true: false
}

$(document).ready(async () => {
    setRenderFunction(newsSetup)
    newsSetup()
})