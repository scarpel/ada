import { createElement } from "../modules/utils/htmlUtils.js"
import CalendarDay from "./CalendarDay.js"

export default function CalendarMonth(firstDayOfWeek, numDays, selectDay=undefined){
    let base = createElement("div", "calendar-month")

    if(firstDayOfWeek>0) padCalendar(base, firstDayOfWeek)

    numDays++

    for(let i=1; i<numDays; i++) base.append(CalendarDay(i, i, selectDay))

    return base
}

function padCalendar(base, numElements){
    for(let i=0; i<numElements; i++) base.append(CalendarDay())
}
