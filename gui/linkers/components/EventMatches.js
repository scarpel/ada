import { createElement } from "../modules/utils/htmlUtils.js";
import EventMatchCard from "./EventMatchCard.js";
import CustomRoundCheckbox from "./CustomRoundCheckbox.js";
import { monthShortName } from "../modules/utils/dateUtils.js";

function getFullCard(eventCard, id, onChangeFunction = () => {}){
    let base = createElement("div", "event-match-full-card")
    base.id = id

    base.append(CustomRoundCheckbox(undefined, onChangeFunction))
    base.append(eventCard)

    return base
}

function getSelectedEvents(events, eventFullCards){
    let length = events.length
    let array = []

    for(let i=0; i<length; i++){
        if(eventFullCards[i].children[0].checked){
            array.push(events[i])
        }
    }

    return array
}

function getEventMatchCards(date){
    let matchDiv = createElement("div", "event-match-cards")
    let day = createElement("h1", "event-match-day")
    day.innerText = `${date.getDate()} ${monthShortName[date.getMonth()]}, ${date.getFullYear()}`
    matchDiv.append(day)

    return matchDiv
}

export default function EventMatches(eventMatches, removeFunction=()=>{}, removeAllFunction=()=>{}, cancelFunction=()=>{}){
    let base = createElement("div", "event-matches")
    base.id = "matches"
    
    let selected = 0
    let removeBtn = createElement("button", "remove-btn")

    let text = createElement("h1", "event-matches-text")
    text.innerHTML = "More than one match found!<br>Select one or more that you'd like to remove"
    base.append(text)

    let matchesDiv = createElement("div", "event-match-days")

    let length = eventMatches.length
    let lastDate = new Date(eventMatches[0].start_at*1000)
    let matchDiv = getEventMatchCards(lastDate)

    for(let i=0; i<length; i++){
        let eventMatch = eventMatches[i]
        let date = new Date(eventMatch.start_at*1000)

        if(date.getDate() !== lastDate.getDate() || date.getMonth() !== lastDate.getMonth() || date.getFullYear() !== lastDate.getFullYear()){
            lastDate = date
            matchesDiv.append(matchDiv)
            matchDiv = getEventMatchCards(lastDate)
        }

        matchDiv.append(getFullCard(EventMatchCard(eventMatch, date), i, (event) => {
            selected += event.target.checked? 1: -1;
            removeBtn.disabled = selected === 0? true: false
        }))
    }

    matchesDiv.append(matchDiv)
    base.append(matchesDiv)

    let btnsBase = createElement("div", "event-matches-btns")
    removeBtn.innerText = "Remove"
    removeBtn.disabled = true
    removeBtn.onclick = () => {removeFunction(base, getSelectedEvents(eventMatches, events.children))}

    let removeAllBtn = createElement("button", "remove-all-btn")
    removeAllBtn.innerText = "Remove All"
    removeAllBtn.onclick = () => {removeAllFunction(base, eventMatches)}

    let cancelBtn = createElement("button", "cancel-btn")
    cancelBtn.innerText = "Cancel"
    cancelBtn.onclick = () => {cancelFunction(base)}

    btnsBase.append(removeBtn)
    btnsBase.append(removeAllBtn)
    btnsBase.append(cancelBtn)

    base.append(btnsBase)

    return base
}