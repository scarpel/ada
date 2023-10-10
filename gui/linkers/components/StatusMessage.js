import { createElement } from "../modules/utils/htmlUtils.js";

export default function StatusMessage(id=undefined, top=undefined, title, text=""){
    let base = createElement("div", "status-message", id)

    if(top) base.append(top)

    let h1 = createElement("h1", "status-message-title")
    h1.innerText = title
    base.append(h1)

    if(text){
        let p = createElement("p", "status-message-text")
        p.innerHTML = text
        base.append(p)
    }

    return base
}