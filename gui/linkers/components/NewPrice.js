import { convert_price_from_db } from "../modules/utils/priceFuncs.js"
import { getDecimalPlaces } from "../modules/consts/decimalPlaces.js"

export default function NewPrice(productId, difference, currency, value){
    let p = document.createElement("span")
    p.className = "new-price"
    p.id = `${productId}-new-price`

    p.classList.add(difference>0? "higher": "lower")
    let decimalPlaces = getDecimalPlaces(currency)
    p.innerHTML = `${currency}${convert_price_from_db(currency, value).toFixed(decimalPlaces)}`
    
    return p
} 