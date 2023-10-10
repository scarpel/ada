import { parseQuick } from "../linkers/modules/agenda/agendaParser.js"
import Counter from "./components/Counter.js"
import { PRIORITY_TEXTS, AgendaEvent } from "../linkers/modules/utils/agendaDataTypes.js"
import { store_event, retrieve_month_events, update_value, select_events_that_match, store_todo, remove_todo, update_todo, retrieve_todos } from "../linkers/modules/agenda/storageAgenda.js"
import { day_of_week, isLeapYear, days_of_month, get_timestamp } from "../linkers/modules/utils/dateUtils.js"
import CalendarMonth from "./components/CalendarMonth.js"
import { createElement } from "./modules/utils/htmlUtils.js"
import Calendar from "../linkers/components/Calendar.js"
import MonthEvents from "./components/MonthEvents.js"
import AgendaController from "./modules/agenda/agendaController.js"
import ToDo from "./components/Todo.js"
import { displayTodos, getTodoItems } from "./modules/agenda/agendaDisplay.js"
import CustomRoundCheckbox from "./components/CustomRoundCheckbox.js"
import EventMatches from "./components/EventMatches.js"
import {binary_search} from "./modules/utils/utils.js"

let priorityCouter = new Counter(1, 1, 3, changePriorityStatus)
const formatString = "YYYY-MM-DDTHH:mm"
const initialOperatorRE = /^[+|-]./
const todoRE = /^todo ./
let controller, lastSliderPosition

window.agendaSetup = () => {
    lastSliderPosition = false
    
    changeTitleBarBackground("rgb(231, 39, 101)")
    changeContentBackground("rgb(231, 39, 101)")

    document.getElementById("priority-field").prepend(priorityCouter.createCounter())
    document.getElementById("quick-agenda-input").onkeydown = (event) => {
        if(event.keyCode === 13){
            event.preventDefault()
            checkQuickAgendaSyntax()
        }
    }

    delayHoles()
    delayStaples()  

    let calendar = new Calendar()
    controller = new AgendaController(calendar, "events", database)
    document.getElementById("calendar").append(calendar.createCalendarElement())

    displayTodos(document.getElementById("all-todos"), ...sort_todos(retrieve_todos(database, userInfo.id)), handleTodoBlur, handleCheckboxChange, addNewToDo, removeTodo)
}

function handleTodoBlur(event){
    let element = event.target
    let parent = element.parentNode
    let id = parent.id

    if(!element.innerText) removeTodo(parent)
    else{
        if(id === ""){
            parent.id = store_todo(database, userInfo.id, element.innerText)
            element.style.webkitAnimationDelay = `${(element.parentNode.children.length-1)*0.1}s`
        }else update_todo(database, id, "title", element.innerText)
    }
}

function updateDelayOfSiblings(firstSibling, step=0.1){
    while(firstSibling){
        firstSibling.style.webkitAnimationDelay -= step
        firstSibling = firstSibling.nextSibling
    }
}

function handleCheckboxChange(id, isChecked){
    if(id !== undefined){
        console.log(id, isChecked)
        update_todo(database, id, "done", isChecked?1:0)
    }
}

function sort_todos(allTodos){
    let todayDate = moment({ hour:0, minute:0 }).unix()
    let length = allTodos.length
    let undoneTodos = {}, todayTodos = {}

    if(LAST_UPDATE_DATES[LAST_UPDATE_IDS.AGENDA]<todayDate){
        for(let i=0; i<length; i++){
            let todo = allTodos[i]
    
            if(todo.date<todayDate){
                if(todo.done) remove_todo(database, todo.id)
                else undoneTodos[todo.id] = todo
            }else todayTodos[todo.id] = todo
        }

        updateLastUpdateDate(LAST_UPDATE_IDS.AGENDA, todayDate)
    }else{
        for(let i=0; i<length; i++){
            let todo = allTodos[i]
    
            if(todo.date<todayDate) undoneTodos[todo.id] = todo
            else todayTodos[todo.id] = todo
        }
    }

    return [undoneTodos, todayTodos]
}

function displayDaysOfWeek(dayNamesArray){
    let length = dayNamesArray.length
    let element = document.getElementById("days-of-week")

    for(let i=0; i<length; i++){
        let div = createElement("div", "day-of-week")
        div.innerText = dayNamesArray[i]
        element.append(div)
    }
}

window.showPopUp = (elementID, display="block") => {
    document.getElementById("main").style.filter = "blur(2px)"
    document.getElementById(elementID).style.display = display
}

window.hidePopUp = (elementID) => {
    document.getElementById("main").style.filter = "none"
    document.getElementById(elementID).style.display = "none"
}

function delayStaples(startAt=0.7, step=0.1){
    let children = document.getElementById("staples").children
    let length = children.length

    for(let i=0; i<length; i++){
        children[i].style.webkitAnimationDelay = `${startAt}s`
        startAt += step
    }
}

function delayHoles(startAt=0.4, step=0.1){
    let children = document.getElementById("holes").children
    let length = children.length

    for(let i=0; i<length; i++){
        children[i].style.webkitAnimationDelay = `${startAt}s`
        startAt += step
    }
}

window.clearScheduleFields = () => {
    let date = new Date()
    let d = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,"0")}-${(date.getDate()).toString().padStart(2,"0")}T${date.getHours().toString().padStart(2,"0")}:${date.getMinutes().toString().padStart(2,"0")}`

    document.getElementById("fast-fill-input").value = ""
    document.getElementById("input-title").value = ""
    document.getElementById("start-at").value = d
    document.getElementById("end-at").value = ""
    priorityCouter.changeValue(1)
}

function triggerWrongSyntax(errorMessage, element, messageElement){
    element.classList.remove("wrong")
    void element.offsetHeight
    messageElement.innerText = errorMessage
    element.classList.add("wrong")
}

window.checkFastFillSyntax = () => {
    let element = document.getElementById("fast-fill-input")
    let value = element.value

    if(value){
        try{
            updateScheduleFields(parseQuick(value))
            element.value = ""
            document.getElementById("fast-fill-message").innerText = ""
        }catch (e){
            triggerWrongSyntax(e, document.getElementById("fast-fill"), document.getElementById("fast-fill-message"))
        }
    }
}

window.checkQuickAgendaSyntax = () => {
    let element = document.getElementById("quick-agenda-input")
    let value = element.value
    let initialOperator

    if(value){
        try{
            if(initialOperatorRE.test(value)){
                initialOperator = value.slice(0,1)
                value = value.slice(1).trim()

                let agendaEvent = parseQuick(value, true)
                if(initialOperator === "+") addOperation(agendaEvent)
                else removeOperation(agendaEvent)
            }else if(todoRE.test(value)){
                addToDo(value.slice(5))
            }else addOperation(parseQuick(value, true))
            
            element.value = ""
            document.getElementById("quick-agenda-message").innerText = ""
        }catch (e){
            triggerWrongSyntax(e, document.getElementById("quick-agenda"), document.getElementById("quick-agenda-message"))
        }
    }
}

function addToDo(title=undefined, onBlurFunc = handleTodoBlur, onChecked = handleCheckboxChange, removeFunc= removeTodo, delay=0.1){
    let item = store_todo(database, userInfo.id, title, undefined, undefined, true)
    addNewToDo(item, onBlurFunc, onChecked, removeFunc, delay, false)
}

function addNewToDo(item=undefined, onBlurFunc = handleTodoBlur, onChecked = handleCheckboxChange, removeFunc= removeTodo, delay=0.1, focusOnText=true){
    let parent = document.getElementById("today-todos")
    if(parent.children.length === 0) parent.classList.remove("no-todo")

    let todo = ToDo(item, onBlurFunc, onChecked, removeFunc)
    delay *= parent.children.length

    parent.append(todo)
    if(focusOnText) todo.children[1].focus()

    setTimeout(() => {todo.style.webkitAnimationDelay = `${delay}s`}, (delay)*2500)
}

function removeTodo(element){
    let id = element.id

    if(id !== ""){
        remove_todo(database, id)
        updateDelayOfSiblings(element.nextSibling) 
    }
    
    if(element.parentNode.children.length === 1) element.parentNode.classList.add("no-todo")
    element.remove()
}

function addOperation(agendaEvent){
    if(agendaEvent.title){
        if(!agendaEvent.start_at) agendaEvent.start_at = moment().second(0).unix()
        addNewEvent(agendaEvent)
    }else throw "Invalid syntax: No title!"
}

function removeOperation(agendaEvent){
    let matches = select_events_that_match(database, agendaEvent)
    let length = matches.length
    if(length === 0) throw "No matches found!"
    else if(length === 1){
        controller.removeEvent(matches[0])
        showMessage(MESSAGE_TYPES.SUCCESS, "Event successfully removed!")
    }else{
        document.getElementById("agenda").prepend(EventMatches(matches, removeMatches, removeMatches, hideMatches))
        showPopUp("matches")
    }
}

function removeMatches(element, events){
    let length = events.length
    for(let i=0; i<length; i++){
        controller.removeEvent(events[i])
    }

    hideMatches(element)
    showMessage(MESSAGE_TYPES.SUCCESS, `${length>1?"Events":"Event"} successfully removed!`)
}

function hideMatches(element){
    hidePopUp("matches")
    element.remove()
}

function hasExclusiveTitle(title, matches, length){
    let foundOne = false

    for(let i=0; i<length; i++){
        let event = matches[i]
        if(title === event.title){
            if(!foundOne) foundOne = true
            else return false
        }
    }

    return foundOne
}

function addNewEvent(agendaEvent){
    agendaEvent["id"] = store_event(database, agendaEvent, userInfo.id, true)
    if(!agendaEvent["priority"]) agendaEvent["priority"] = 1
    controller.addNewEvent(agendaEvent)
}

function updateScheduleFields(agendaEvent){
    if(agendaEvent.title) document.getElementById("input-title").value = agendaEvent.title

    if(agendaEvent.start_at) document.getElementById("start-at").value = agendaEvent.start_at.format(formatString)

    if(agendaEvent.end_at){
        document.getElementById("end-at").value = agendaEvent.end_at.format(formatString)
    }

    if(agendaEvent.priority) priorityCouter.changeValue(agendaEvent.priority)
}

window.saveEvent = () => {
    let title = document.getElementById("input-title").value
    let start_at = document.getElementById("start-at").value

    if(title && start_at){
        start_at = moment(start_at, formatString).unix()
        let end_at = document.getElementById("end-at").value
        if(end_at) end_at = moment(end_at, formatString).unix()
        let priority = priorityCouter.currentValue
        console.log(store_event(database, AgendaEvent(title, start_at, end_at, priority), userInfo.id, true))
        hideScheduleEvent()
    }else console.log("No title!")
}

function changePriorityStatus(value){
    document.getElementById("priority-status").innerText = PRIORITY_TEXTS[value]
}

window.showScheduleEvent = () => {
    clearScheduleFields()
    showPopUp("schedule-event")
}

window.hideScheduleEvent = () => {
    let element = document.getElementById("schedule-event")
    element.style.webkitAnimationName = "hide-schedule"

    setTimeout(() => {
        hidePopUp("schedule-event")
        element.style.webkitAnimationName = ""
    }, 400)
}

window.moveSlider = (toRight=true) => {
    if(lastSliderPosition !== toRight){
        if(toRight){
            _moveSlider("to-right", "calendar-page", "todo-page", "all-todos", "calendar-content")
        }else{
            _moveSlider("to-left", "todo-page", "calendar-page", "calendar-content", "all-todos")
        }

        lastSliderPosition = toRight
    }
}

function _moveSlider(animation, removeClassFrom, addClassTo, show, hide){
    let slider = document.getElementById("selector-slider")
    slider.style.webkitAnimationName = ""

    document.getElementById(removeClassFrom).classList.remove("above-selector")
    document.getElementById(addClassTo).classList.add("above-selector")
    slider.style.webkitAnimationName = animation

    document.getElementById(hide).style.display = "none"
    document.getElementById(show).style.display = "grid"
}

$(document).ready(() => {
    setRenderFunction(agendaSetup)
    agendaSetup()
})