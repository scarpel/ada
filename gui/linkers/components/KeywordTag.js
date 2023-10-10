import { createElement } from "../modules/utils/htmlUtils.js"

export default function KeywordTag(id, keyword, deleteFunction){
    let base = createElement("div", "keyword-tag", `${id}-keyword`)

    let span = createElement("span")
    span.innerText = keyword

    let button = createElement("button")
    button.innerHTML = "&times;"
    button.onclick = () => {deleteFunction(id, keyword, base)}

    base.append(span)
    base.append(button)

    return base
}