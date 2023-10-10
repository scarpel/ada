import { USERS, LAST_USER } from "./modules/consts/databaseConsts.js"
import CustomRoundCheckbox from "./components/CustomRoundCheckbox.js"

const colors = ["rgb(38, 120, 226)", "rgb(255, 210, 15)", "rgb(231, 39, 101)"]
let color

window.loginSetup = () => {
    color = getColor()
    document.documentElement.style.setProperty("--main-color", color)

    changeTitleBarBackground(color)
    changeContentBackground(color)

    document.getElementById("stay-connected").append(CustomRoundCheckbox("stay-connected"))
}

function getColor(){
    let index = Math.floor(Math.random()*colors.length)
    return colors[index]
}

function shakeCard(){
    let card = document.getElementById("card")
    card.classList.remove("shake")
    card.offsetHeight
    card.classList.add("shake")
}

window.verifyLogin = () => {
    let email = document.getElementById("email").value
    let password = document.getElementById("password").value

    validateUser(email, password).then(_userInfo => {
        password = ""

        if(_userInfo){
            userInfo = _userInfo
            let checkbox = document.getElementById("stay-connected-checkbox")
            if(checkbox.checked) setLastUser(userInfo.id)
            goTo("../pages/main.html")
        }else shakeCard()
    })
}

function setLastUser(id){
    return database.prepare(`INSERT INTO ${LAST_USER} VALUES(?)`).run(id)
}

window.signUp = () => {
    goTo("../pages/signUp.html")
}

async function validateUser(email, password){
    try{
        let preInfo = getUserPreInfo(email)
        if(preInfo){
            if(await argon2.verify(preInfo.password, password)){
                return getUserInfo(preInfo.id)
            }
        }
    }catch (err){
        showMessage(MESSAGE_TYPES.ERROR, "Hmm... hello?ad asd ssrfes aeidk sisier", err)
    }

    return null
}

function getUserPreInfo(email){
    return database.prepare(`SELECT id, password FROM ${USERS} WHERE email=?`).get(email)
}

function getUserInfo(id){
    return database.prepare(`SELECT id, email, name, gender, birthday FROM ${USERS} WHERE id=?`).get(id)
}

$(document).ready(() => {
    setRenderFunction(loginSetup)
    loginSetup()
})