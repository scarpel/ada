import { createElement } from "../modules/utils/htmlUtils.js";

export default function CalendarDay(dayOfMonth=undefined, id=undefined, onClickFunction=undefined){
    let base = createElement("div", "calendar-day", id)
    if(onClickFunction) base.onclick = () => {onClickFunction(id)}

    if(dayOfMonth){
        let text = createElement("span", "day")
        text.innerText = dayOfMonth
        base.append(text)
    }else base.classList.add("empty-day")

    return base
}