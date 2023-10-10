import { get_until } from "../linkers/modules/utils/strFuncs.js"
import { Counter } from "../linkers/modules/utils/dataTypes.js"
import { LAST_USER } from "./modules/consts/databaseConsts.js"
import { getHTMLCounter } from "./preprocessing.js"
import { build_decision_tree, build_decision_tree_from_str } from "./modules/utils/decisionTree.js"
import { getArticleCounterArray } from "./modules/utils/newsUtils.js"
import { NEWS_DECISION_TREE } from "./modules/consts/paths.js"
import { getBreadcrumbers } from "./modules/utils/breadcrumberFinder.js"
import { get_property_meta_tag } from "./modules/utils/htmlUtils.js"
import { get_news_website_type } from "./modules/utils/websiteUtils.js"

window.mainSetup = () => {
    changeTitleBarBackground("rgb(241, 241, 241)")
    changeContentBackground("rgb(241, 241, 241)")
    
    setGreetingMessage()
    
    // let text = read("C:\\Users\\Guilherme\\Desktop\\saraiva.html").toString()
    // console.log(get_news_website_type(text))
    // console.log(getBreadcrumbers(text))
    // console.log(getArticlesArray())
    // let dt = build_decision_tree(getArticlesArray())
    // console.log(dt.evaluate([0, 4, 11, 2, 2, 0, true]))
    // console.log(dt.toString())
    // updateDecisionTree()
}

function calculateDelimiter(currentDelimiter, splittedA, splittedB){
    for(let i=1; i<currentDelimiter; i++){
        if(splittedA[i] !== splittedB[i]) return i
    }

    return currentDelimiter
}

function updateDecisionTree(){
    write(NEWS_DECISION_TREE, build_decision_tree(getArticlesArray()).toString())
}
// function getHTML(url){
//     fetch(url).then(result => result.text().then(text => new ArticleHTMLParser().parse(text)))
// }

function getFormattedData(data){
    let str = ""
    for(let i=0; i<data.length; i++) str += `${data[i].join(",")}\n`
    return str
}

function getArticlesArray(){
    let data = []
    let text = read("C:\\Users\\Guilherme\\Desktop\\articles.txt").toString()
    text = text.split(",")
    for(let i=0; i<text.length; i++){
        data.push(getArticleCounterArray(getHTMLCounter(text[i].replace(/(\r\n|\n|\r)/gm, ""))))
    }
    text = read("C:\\Users\\Guilherme\\Desktop\\naoArticles.txt").toString()
    text = text.split(",")
    for(let i=0; i<text.length; i++){
        data.push(getArticleCounterArray(getHTMLCounter(text[i].replace(/(\r\n|\n|\r)/gm, "")), false))
    }

    return data
}

function setGreetingMessage(){
    let hourGreeting = getHourGreeting(new Date().getHours())
    document.getElementById("greeting").innerHTML = `${hourGreeting}, <b>${userInfo.name}</b>!`
}

function getHourGreeting(hour){
    if(hour>=5 && hour<13) return "good morning"
    else if(hour<19) return "good afternoon"
    else return "good night"
}

window.signOut = () => {
    database.prepare(`DELETE FROM ${LAST_USER}`).run()
    userInfo = {}
    goBack()
}

window.parseHTML = () => {
    console.log(splitHTML(document.getElementById("html").value))
}

function splitHTML(html){
    let counter = new Counter()
    let startIndex = html.indexOf("<")

    while(startIndex !== -1){
        let endIndex = html.indexOf(">", startIndex)
        startIndex++
        if(html[startIndex] !== "/"){
            let tag = get_until(html, " ", startIndex, endIndex)
            if(tag) counter.add(tag)
            startIndex = endIndex !== -1? html.indexOf("<", endIndex+1): endIndex
        }else startIndex = endIndex+1
    }

    return counter
}

$(document).ready(() => {
    setRenderFunction(mainSetup)
    mainSetup()
})

window.handleShop = () => {
    goTo("../pages/shop.html")
}

window.handleNews = () => {
    goTo("../pages/news.html")
}

window.handleAgenda = () => {
    goTo("../pages/agenda.html")
}