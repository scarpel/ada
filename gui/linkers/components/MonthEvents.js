import { createElement } from "../modules/utils/htmlUtils.js"
import DayEvents from "./DayEvents.js"

export default function MonthEvents(year, month, numDays){
    let base = createElement("div", "month-events")

    numDays++

    for(let i=1; i<numDays; i++){
        base.append(DayEvents(year, month, i))
    }

    return base
}