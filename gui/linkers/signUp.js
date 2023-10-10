import { USERS } from "./modules/consts/databaseConsts.js"
import { get_last_id } from "./modules/utils/databaseUtils.js"

const emailRE = /^[A-Za-z0-9._]+@[a-z]+\.[a-z]+$/

let email = "", password = ""

window.newUserSetUp = () => {
    changeTitleBarBackground("rgb(241, 241, 241)")
    changeContentBackground("rgb(241, 241, 241)")

    document.getElementById("birthday").valueAsDate = new Date()
}

window.handleNewAccount = async () => {
    email = document.getElementById("email").value

    if(emailRE.test(email)){
        if(!hasEmail(email)){
            password = document.getElementById("password").value
            if(password && password === document.getElementById("same-password").value){
                try{
                    password = await window.argon2.hash(password, {type: window.argon2.argon2id})
                    changeToUserInfo()
                    setTimeout(() => {
                        document.getElementById("password").value = ""
                        document.getElementById("same-password").value = ""
                    }, 500)
                }catch (err){
                    showMessage(MESSAGE_TYPES.ERROR, "Something Happened!", err)
                }
            }else showErrorMessage("Wrong password!")
        }else showErrorMessage("E-mail already in use!")
    }else showErrorMessage("Invalid e-mail!")
}

window.saveNewUser = () => {
    let name = document.getElementById("name").value
    if(name){
        let birthday = moment(document.getElementById("birthday").value, "YYYY-MM-DD")
        if(birthday.isSameOrBefore(moment(), "day")){
            birthday = birthday.unix()
            let gender = Number(document.querySelectorAll("input[name=gender]:checked")[0].value)
            let id = addNewUser(email, password, name, gender, birthday)
            if(id) goBack()
            else showErrorMessage("Error while saving user!")
        }else showErrorMessage("Invalid birthday!")
    }else showErrorMessage("Invalid name!")
}

window.changeToUserInfo = () => {
    let userCredentials = document.getElementById("user-credentials")
    let userInfo = document.getElementById("user-info")

    userCredentials.style.webkitAnimation = "slide-left 0.5s ease-out"
    userInfo.style.display = "block"

    setTimeout(() => { userCredentials.style.display = "none" }, 500)
}

function hasEmail(email){
    return database.prepare(`SELECT email FROM ${USERS} WHERE email=?`).get(email)
}

function addNewUser(email, password, name, gender, birthday){
    database.prepare(`INSERT INTO ${USERS} VALUES(?,?,?,?,?,?)`).run(null, email, password, name, gender, birthday)
    return get_last_id(database, USERS)
}

function showErrorMessage(message){
    let popup = document.getElementById("error-popup")
    popup.style.display = "none"
    document.getElementById("error-msg").innerText = message
    void popup.offsetWidth;
    popup.style.display = "block"
}

window.hideErrorMessage = () => {
    document.getElementById("error-popup").style.display = "none"
}

$(document).ready(() => {
    setRenderFunction(newUserSetUp)
    newUserSetUp()
})