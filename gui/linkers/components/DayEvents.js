import { createElement } from "../modules/utils/htmlUtils.js";
import EventCard from "./EventCard.js";

export default function DayEvents(year, month, day){
    let base = createElement("div", "day-events", `day-${day}`)

    let title = createElement("h1", "day-events-title")
    base.classList.add("no-events")
    title.innerText = `${day} ${month}, ${year}`
    base.append(title)

    let eventsDiv = createElement("div", "day-events-cards", `${day}-cards`)
    base.append(eventsDiv)

    return base
}