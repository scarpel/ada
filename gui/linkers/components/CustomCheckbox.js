export default function CustomCheckbox(text, checked=false, id=null, onChangeCallback = () => {}, checkedClass="checked"){
    let btn = document.createElement("button")
    btn.innerText = text

    if(id) btn.id = id
    btn.classList.add("custom-checkbox")
    if(checked){
        btn.classList.toggle(checkedClass, true)
        onChangeCallback(checked)
    }

    btn.onclick = () => {
        checked = !checked
        btn.classList.toggle(checkedClass, checked)
        onChangeCallback(checked)
    }

    return btn
}