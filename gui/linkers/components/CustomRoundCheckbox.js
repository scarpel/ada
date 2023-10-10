export default function CustomRoundCheckbox(websiteID=null, onChange=() => {}, checked=false){
    let base = document.createElement("label")
    base.className = "round-checkbox"

    let input = document.createElement("input")
    input.type = "checkbox"
    input.className = "checkbox"
    if(websiteID !== null) input.id = `${websiteID}-checkbox`
    input.onchange = (event) => {base.checked = event.target.checked; onChange(event)}
    if(checked) input.checked = "true"

    let span = document.createElement("span")
    span.className = "checkmark"

    base.append(input)
    base.append(span)

    return base
}