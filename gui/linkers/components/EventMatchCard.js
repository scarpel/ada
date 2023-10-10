import { createElement } from "../modules/utils/htmlUtils.js"
import { get_formatted_time, monthShortName } from "../modules/utils/dateUtils.js"

export default function EventMatchCard(agendaEvent, startAtDate){
    let base = createElement("div", "event-match-card")

    let priorityStrip = createElement("div", "event-priority")
    priorityStrip.classList.add(`priority-${agendaEvent.priority}`)
    base.append(priorityStrip)

    let title = createElement("div", "event-title")
    title.innerText = agendaEvent.title
    base.append(title)

    let time = createElement("div", "event-time")

    if(agendaEvent.end_at){
        let endAt = new Date(agendaEvent.end_at*1000)
        let startAtElement = createElement("span", "event-start-at")
        startAtElement.innerText = get_formatted_time(startAtDate)
        let endAtElement = createElement("span", "event-end-at")

        if(endAt.getDate() === startAtDate.getDate() && endAt.getMonth() === startAtDate.getMonth() && endAt.getFullYear() === startAtDate.getFullYear()){
            endAtElement.innerText = get_formatted_time(endAt)
        }else{
            endAtElement.innerText = `${endAt.getDate()} ${monthShortName[endAt.getMonth()]} ${endAt.getFullYear()} ${get_formatted_time(endAt)}`
        }

        time.append(startAtElement)
        time.append(document.createTextNode(" | "))
        time.append(endAtElement)

    }else{
        time.innerText = get_formatted_time(startAtDate)
    }
    
    base.append(time)

    return base
}