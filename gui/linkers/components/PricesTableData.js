import { get_normal_date } from "../modules/utils/dateUtils.js"
import PricePercentage from "./PricePercentage.js"
import { getDecimalPlaces } from "../modules/consts/decimalPlaces.js"
import { createElement } from "../modules/utils/htmlUtils.js"

export default function PricesTableData(prices, decimalPlaces=undefined, priceBeforeFirst=undefined){
    let fragment = createElement("div", "prices-table-data")
    let lastPriceValue = priceBeforeFirst, currency = prices[0].currency
    let len = prices.length

    if(len>0 && !decimalPlaces){
        decimalPlaces = getDecimalPlaces(currency)
    }

    for(let i=len-1; i>=0; i--){
        let {id, date, value} = prices[i]

        let row = document.createElement("tr")
        row.id = id
        
        let priceDate = document.createElement("td")
        priceDate.className = "price-date"
        priceDate.innerText = get_normal_date(moment.unix(date))
        row.appendChild(priceDate)

        let price = document.createElement("td")
        price.className = "price-value"
        price.innerText = `${currency}${value.toFixed(decimalPlaces)}`
        row.appendChild(price)
        
        let percentage = document.createElement("td")
        percentage.className = "price-percentage"
        if(lastPriceValue){
            let division = value/lastPriceValue
            if(division !== 1){
                percentage.appendChild(PricePercentage(division, "percentage"))
            }
        }
        row.appendChild(percentage)
        
        fragment.prepend(row)
        lastPriceValue = value
    }

    return fragment
}