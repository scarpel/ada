import {LAST_UPDATE_DATE, LAST_USER, USERS} from "../linkers/modules/consts/databaseConsts.js"
import { NEWS_DECISION_TREE } from "./modules/consts/paths.js"
import { build_decision_tree_from_str } from "./modules/utils/decisionTree.js"

const mask = document.getElementById("mask")
window.userInfo = {}

window.addEventListener("DOMContentLoaded", () => {
    let last_user = getLastUser()
    if(last_user){
        userInfo = last_user
        window.pagesHistory.push("../pages/main.html")
    }

    LAST_UPDATE_DATES = getLastUpdateDate()

    $("#content").load(pagesHistory[pagesHistory.length-1], () => {
        let func = renderFunctions[pagesHistory[pagesHistory.length-1]]
        if(func) func()
    })
})

function getLastUser(){
    let id = database.prepare(`SELECT * FROM ${LAST_USER}`).get()
    return id? database.prepare(`SELECT id, name, gender, birthday FROM ${USERS} WHERE id = ?`).get(id.id): undefined
}

function loadPage(url, maskColor="black", maskStartOrientation="right-oriented", maskEndOrientation="left-oriented"){
    setMask(maskColor, maskStartOrientation)
    mask.webkitAnimationName = "show-mask"
    mask.style.display = "block"
    
    setTimeout(() => {
        $("#content").load(url, () => {
            let func = renderFunctions[url]
            if(func) func()
            setTimeout(() => {
                mask.className = maskEndOrientation
                mask.style.webkitAnimationName = "hide-mask"
                setTimeout(() => {
                    mask.style.display = "none"
                    mask.className = ""
                    mask.style.webkitAnimationName = ""
                }, 400)
            }, 50)
        })
    }, 400)
}

function setMask(backgroundColor, orientation){
    mask.style.backgroundColor = backgroundColor
    mask.className = orientation
}

window.setRenderFunction = (func) => {
    renderFunctions[pagesHistory[pagesHistory.length-1]] = func
}

window.setUnloadFunction = (func) => {
    unloadFunctions[pagesHistory[pagesHistory.length-1]] = func
}

window.changeTitleBarBackground = (color) => {
    document.getElementById("title-bar-background").style.backgroundColor = color
}

window.changeTitleBarBtnColors = (color) => {
    document.documentElement.style.setProperty("--title-bar-btn-color", color)
}

window.changeTitleBarColors = (backgroundColor, btnColors="black") => {
    changeTitleBarBackground(backgroundColor)
    changeTitleBarBtnColors(btnColors)
}

window.changeContentBackground = (color="inherit") => {
    document.getElementById("content").style.backgroundColor = color
}

window.prop = null
window.pagesHistory = ["../pages/signIn.html"]
window.renderFunctions = {}
window.unloadFunctions = {}

window.goTo = (pageUrl, props={}, maskColor=undefined) => {
    window.props = props
    pagesHistory.push(pageUrl)
    loadPage(pageUrl, maskColor)
}

window.goBack = (maskColor="black") => {
    let len = pagesHistory.length 
    if(len>1){
        let unload = unloadFunctions[pagesHistory.pop()]
        if(unload) unload()

        loadPage(pagesHistory[len-2], maskColor, "left-oriented", "right-oriented")
    } else return null
}

window.MESSAGE_TYPES = {
    SUCCESS: 0,
    ERROR: 1,
    QUESTION: 2
}

function _showMessage(){
    document.getElementById("content").children[0].style.filter = "blur(2px)"
    document.getElementById("flash-messages").style.display = "block"
}

function _hideMessage(iconElement, callback){
    document.getElementById("content").children[0].style.filter = "none"
    document.getElementById("flash-messages").style.display = "none"
    iconElement.style.display = "none"

    callback()
}

window.showMessage = (messageType, title, text, callback=()=>{}) => {
    let okBtn = document.getElementById("ok-btn"), icon
    okBtn.onclick = () => {_hideMessage(icon, () => callback(true))}
    let noBtn = document.getElementById("no-btn")

    if(messageType === MESSAGE_TYPES.QUESTION){
        icon = document.getElementById("question-icon")
        noBtn.style.display = "auto"
        noBtn.onclick = () => {_hideMessage(icon, () => callback(false))}
        okBtn.innerText = "hmm, ok!"
    }else{
        icon = document.getElementById(messageType === MESSAGE_TYPES.SUCCESS? "success-icon":"error-icon")
        noBtn.style.display = "none"
        okBtn.innerText = "ok!"
    }

    if(title) document.getElementById("message-title").innerHTML = title
    if(text) document.getElementById("message-text").innerHTML = text
    
    icon.style.display = "block"
    _showMessage()

    okBtn.focus()
}

window.LAST_UPDATE_IDS = {
    SHOP: 1,
    NEWS: 2,
    AGENDA: 3
}

window.LAST_UPDATE_DATES = {}

function getLastUpdateDate(){
    let updates = database.prepare(`SELECT * FROM ${LAST_UPDATE_DATE}`).all()
    let obj = {}

    if(updates){
        for(let i=updates.length-1; i>=0; i--){
            let update = updates[i]
            obj[update.id] = update.date
        }

        return obj
    }else return createLastUpdateDate()
}

function createLastUpdateDate(){
    let obj = {}
    let keys = Object.keys(LAST_UPDATE_IDS)

    for(let i=keys.length-1; i>=0; i--){
        let key = keys[i]
        let id = LAST_UPDATE_IDS[key]
        database.prepare(`INSERT INTO ${LAST_UPDATE_DATE} VALUES(${id},${key.toLowerCase()},0)`).run()
        obj[id] = 0
    }

    return obj
}

window.updateLastUpdateDate = (id, timestamp) => {
    try{
        database.prepare(`UPDATE ${LAST_UPDATE_DATE} SET date=${timestamp} WHERE id=${id}`).run()
        LAST_UPDATE_DATES[id] = timestamp
    }catch (error){
        console.log(error)
    }
}

window.toggleLoadingButton = (id) => {
    return document.getElementById(id).classList.toggle("loading")
}

window.newsDecisionTree = undefined

window.getNewsDecisionTree = () => {
    if(!newsDecisionTree){
        newsDecisionTree = build_decision_tree_from_str(read(NEWS_DECISION_TREE).toString())
    }

    return newsDecisionTree
}

window.onbeforeunload = () => {
    // let url = pagesHistory.pop()

    // while(url){
    //     let unload = unloadFunctions[url]
    //     if(unload) unload()

    //     url = pagesHistory.pop()
    // }
}

