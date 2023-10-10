import { createElement } from "../modules/utils/htmlUtils.js";
import CustomRoundCheckbox from "./CustomRoundCheckbox.js";

function keyDown(event){
    if(event.keyCode === 13){
        event.preventDefault()
        event.target.blur()
    }
}

export default function ToDo(item=undefined, onBlurFunction=()=>{}, onCheckedFunction=()=>{}, removeFunction=()=>{}){
    let _title

    let base = createElement("div", "todo")
    base.tabIndex = -1

    let checkbox = CustomRoundCheckbox(undefined, (event) => {base.classList.toggle("done"); onCheckedFunction(base.id, event.target.checked)})
    checkbox.classList.add("todo-checkbox")
    base.append(checkbox)

    let title = createElement("div", "todo-title")
    title.contentEditable = "true"
    title.onkeydown = keyDown
    title.onblur = (event) => {
        if(title.innerText !== _title){
            _title = title.innerText
            onBlurFunction(event)
        }
    }
    base.append(title)

    let removeBtn = createElement("button", "todo-remove-btn")
    removeBtn.innerHTML = "&times;"
    removeBtn.onclick = () => {removeFunction(base)}
    base.append(removeBtn)

    if(item){
        _title = title.innerText = item.title
        base.id = item.id
        if(item.done){
            checkbox.children[0].checked = "true"
            base.classList.add("done")
        }
    }

    return base
}