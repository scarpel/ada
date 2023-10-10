import { createElement } from "../modules/utils/htmlUtils.js"
import { get_formatted_time } from "../modules/utils/dateUtils.js"

function keyDown(event){
    if(event.keyCode === 13){
        event.preventDefault()
        event.target.blur()
    }
}

function endAtFunc(startDate, endDate, element){
    let startAtElement = createElement("span", "event-start-at")
    startAtElement.innerText = get_formatted_time(startDate)
    let endAtElement = createElement("span", "event-end-at")
    endAtElement.innerText = get_formatted_time(endDate)

    element.append(startAtElement)
    element.append(document.createTextNode(" | "))
    element.append(endAtElement)
}

function displayTime(agendaEvent, timeElement){
    let startAt = new Date(agendaEvent.start_at*1000)

    if(agendaEvent.end_at){
        let endAt = new Date(agendaEvent.end_at*1000)
        endAtFunc(startAt, endAt, timeElement)
    }else{
        timeElement.innerText = get_formatted_time(startAt)
    }
}

export default function EventCard(agendaEvent, id=undefined, deleteFunc=()=>{}, updateFunc=()=>{}, timeDisplayFunction=displayTime){
    let base = createElement("div", "event-card", id)

    let deleteBtn = createElement("button", "event-delete-btn")
    deleteBtn.innerHTML = "&times;"
    deleteBtn.onclick = () => { deleteFunc(agendaEvent) }
    base.append(deleteBtn)

    let priorityStrip = createElement("div", "event-priority")
    priorityStrip.classList.add(`priority-${agendaEvent.priority}`)
    base.append(priorityStrip)

    let title = createElement("div", "event-title")
    title.innerText = agendaEvent.title
    title.contentEditable = "true"
    title.onkeydown = keyDown
    title.onblur = () => {
        if(title.innerText !== agendaEvent.title){
            agendaEvent.title = title.innerText
            updateFunc(agendaEvent)
        }
    }
    base.append(title)

    let time = createElement("div", "event-time")
    timeDisplayFunction(agendaEvent, time)
    
    base.append(time)

    return base
}