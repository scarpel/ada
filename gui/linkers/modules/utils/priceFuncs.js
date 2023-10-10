import { get_all_before_until, get_all_after_until, replaceAll } from "./strFuncs.js"
import { CURRENCY_SYMBOLS } from "../consts/consts.js"
import { getDecimalPlaces } from "../consts/decimalPlaces.js"

const pricesInterval = /^\s*-\s*\D*\d+[,.]?\d*$/
const _isDigit = /^\d+$/
const dots = new Set([".", ","])
let pow_10 = {}

const isDigit = (letter) => _isDigit.test(letter)

function get_first_price_index(text){
    let textLength = text.length
    let endIndex = 0

    for(var i=0; i<textLength; i++){
        let letter = text[i]

        if(isDigit(letter)){
            endIndex = i+1

            while(endIndex<textLength){
                letter = text[endIndex]
                if(isDigit(letter) || dots.has(letter)) endIndex += 1
                else break
            }

            while(dots.has(text[endIndex-1])) endIndex -= 1

            return [i, endIndex]
        }
    }
    
    return null
}

function get_currency(text, priceStart, priceEnd, currencySet=null){
    if(!currencySet) currencySet = CURRENCY_SYMBOLS

    let left = get_all_before_until(text, " ", priceStart-1)
    let right = get_all_after_until(text, " ", priceEnd)

    if(left)
        return (currencySet.has(left) && !right)? [left, [priceStart-left.length, priceStart]]:null
    else if(right)
        return currencySet.has(right)? [right, [priceEnd, priceEnd+right.length]]: null

    left = get_all_before_until(text, " ", priceStart-2)
    if(left && currencySet.has(left)) return [left,[priceStart-left.length-1, priceStart]]
    else{
        right = get_all_after_until(text, " ", priceEnd+1)
        if(right && currencySet.has(right)) return [right, [priceEnd, priceEnd+right.length+1]]
    }

    return null
}

function get_price_and_currency(text){
    let priceIndexes = get_first_price_index(text)
    if(priceIndexes){
        let [priceStart, priceEnd] = priceIndexes
        let currency = get_currency(text, priceStart, priceEnd)

        if(currency){
            let price = text.slice(priceStart, priceEnd)
            let [currencyStart, currencyEnd] = currency[1]

            if(currencyStart<priceStart) priceStart = currencyStart
            else priceEnd = currencyEnd

            return [[currency[0], price], [priceStart, priceEnd]]
        }
    }
    
    return [null, null]
}

function check_after_price(text){
    text = text.trim()
    let indexes = get_first_price_index(text)

    if(indexes){
        let lenText = text.length
        let [_, numEnd] = indexes

        if(numEnd<lenText && text[numEnd] === "%"){
            let parentesisIndex = text.find("(")
            if(parentesisIndex !== -1 && parentesisIndex<3) return false
            indexes = get_first_price_index(text.slice(numEnd))
            return indexes? false: true
        }
        
        return false
    }else return true
}

function check_for_price_interval(afterPriceText){
    if(pricesInterval.test(afterPriceText)) return true
    else return false
}

function convertPriceToFloat(currency, price, decimalPlaces=null){
    decimalPlaces = decimalPlaces? decimalPlaces: getDecimalPlaces(currency)

    if(decimalPlaces){
        let dot = price[price.length-decimalPlaces-1]
        if(dot === ",") return parseFloat(replaceAll(replaceAll(price, "\\.", ""), ",", "."))
        else replaceAll(price, ",", ".")
    }

    return parseFloat(replaceAll(price, ",", ""))
}

function get_difference_percentage(newestPrice, oldestPrice){
    return newestPrice-oldestPrice
    // let diff = newestPrice/oldestPrice

    // if(diff === 1) return 0
    // else return parseInt((diff>1? (diff-1): -(1-diff))*100)
}

function get_pow_10(exp){
    if(!pow_10[exp]){
        pow_10[exp] = Math.pow(10, exp)
    }

    return pow_10[exp]
}

function convert_price_from_db(currency, price, decimalPlaces=undefined){
    decimalPlaces = decimalPlaces? decimalPlaces: getDecimalPlaces(currency)

    if(decimalPlaces) return price/get_pow_10(decimalPlaces)

    return price
}

function convert_prices_from_db(pricesArray){
    let decimalPlaces = getDecimalPlaces(pricesArray[0].currency)

    if(decimalPlaces){
        for(let i=pricesArray.length-1; i>=0; i--) pricesArray[i].value /= get_pow_10(decimalPlaces)
    }

    return pricesArray
}

function add_dot(currency, price){
    let decimalPlaces = getDecimalPlaces(currency)

    if(decimalPlaces){
        let len = price.length
        if(!dots.has(price[len-decimalPlaces-1])){
            let dotInBetween = len-decimalPlaces
            return `${price.slice(0, dotInBetween)}.${price.slice(dotInBetween)}`
        } 
    }

    return price
}

function convert_price_to_db(currency, price){
    let decimalPlaces = getDecimalPlaces(currency)

    if(typeof price === "string") price = convertPriceToFloat(currency, price, decimalPlaces)

    return Math.trunc(price*get_pow_10(decimalPlaces))
}

export { isDigit, get_first_price_index, get_currency, get_price_and_currency, check_after_price, 
    check_for_price_interval, convertPriceToFloat, get_difference_percentage, convert_price_from_db, add_dot,
    convert_price_to_db, convert_prices_from_db }
