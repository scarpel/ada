export default function PricePercentage(division, elementClass="price-percentage", elementId=null){
    let element = document.createElement("div")
    element.classList.add(elementClass)
    if(elementId) element.id = elementId

    if(division>1){
        element.classList.add("higher")
        element.innerText = `+${((division-1)*100).toFixed(2)}%`
    }else{
        element.classList.add("lower")
        element.innerText = `-${((1-division)*100).toFixed(2)}%`
    }

    return element
}