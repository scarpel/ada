import { Counter } from "../utils/dataTypes.js"
import { ImgProperties, PriceProperties, ParsedProductProperties, TitleProperties, get_product_obj } from "../utils/shopDataTypes.js"
import { get } from "../utils/utils.js"
import { add_dot } from "../utils/priceFuncs.js"

const idFields = ["itemprop", "id", "class"]
const idFieldsLength = idFields.length
const priceTagScores = {"span":10, "strong":5, "div":5, "p":5}
const titleTagScores = {"h1": 30, "h2": 25, "span": 10, "div": 8, "p": 5}
const idScores = {"itemprop": 10, "id": 5, "class": 2}

const hasNumberAtEnd = /-\d+$/

const PriceInfo = {
    PRICE_FREQUENCY: 1,
    CURRENCY_FREQUENCY: 2,
    ID_FREQUENCY: 3,
    NUM_CLASSES: 4,
    CLASS_ARRAY: 5
}

function getBiggestID(tag){
    let id = tag[idFields[0]], idTag

    if(!id){
        id = tag[idFields[1]]
        if(!id){
            id = tag[idFields[2]]
            idTag = "class"
        }else idTag = "id"
    }else idTag = "itemprop"

    return [id, idTag]
}

function predictTitle(titleList, titleIdentifiers=new Set()){
    let length = titleList.length
    if(length<=1) return length === 1? titleList[0]: null
    let currentScore = 0
    let currenTitle = null
    let wantedKeywords = ["title", "product"]

    for(var i=0; i<length; i++){
        let tag = titleList[i][TitleProperties.TAG]
        let score = getScoreWithIdentifier(tag, titleTagScores, titleIdentifiers)
        let titleClass = get(tag, "class", "").toLowerCase()
        if(titleClass.indexOf("nav") !== -1) continue
        let [id, idTag] = getBiggestID(tag)

        if(id){
            id = id.toLowerCase()
            let idScore = idScores[idTag]
            for(let i=wantedKeywords.length; i>=0; i--){
                if(id.indexOf(wantedKeywords[i]) !== -1) score += 10 *  idScore
            }
        }
        
        if(score>currentScore){
            currentScore = score
            currenTitle = titleList[i]
        }
    }
    
    return currenTitle
}

function filterPriceList(priceList, titleID, getInfo=false, getOnlyFirstEquals=1, maxInterval=250){
    let filtered = []
    let infoSet = new Counter()
    let currencyFrequency = new Counter()
    let length = priceList.length
    let frequency = null
    let classSet = null
    let pricesClass = null

    if(getInfo){
        frequency = new Counter()
        classSet = new Set()
        pricesClass = []
    }

    for(var i=0; i<length; i++){
        let price = priceList[i]
        let tagProperties = price[PriceProperties.TAG]
        let getTag = false
        currencyFrequency.add(price[PriceProperties.PRICE][0])

        for(var j=0; j<idFieldsLength; j++){
            let field = idFields[j]
            let text = get(tagProperties, field, null)
            if(text){
                if(get(infoSet.values, text, 0)<getOnlyFirstEquals)
                    getTag = true
                
                infoSet.add(text)
            }
        }

        if(getTag && Math.abs(titleID-price[PriceProperties.ID])<maxInterval){
            filtered.push(price)

            if(getInfo)
                if(get(infoSet.values, get(tagProperties, "class", null),0)<2) frequency.add(price[PriceProperties.PRICE][1])
                if(tagProperties.class) classSet.add(tagProperties.class)
                pricesClass.push(tagProperties.class)

        }
    }
        
    if(getInfo)
        return [filtered, {[PriceInfo.PRICE_FREQUENCY]: frequency, [PriceInfo.CURRENCY_FREQUENCY]: currencyFrequency, [PriceInfo.ID_FREQUENCY]: infoSet, [PriceInfo.NUM_CLASSES]: classSet.size, [PriceInfo.CLASS_ARRAY]: pricesClass}]
    else return filtered
}       

function filterImgList(imgList, maxDistance=150, getOnlyFirstEquals=1){
    let filtered = []
    let infoSet = new Counter()
    let length = imgList.length
    
    for(var i=0; i<length; i++){
        let img = imgList[i]
        let tagProperties = img[ImgProperties.TAG]
        tagProperties = get(tagProperties, "parent", null)? tagProperties["parent"]: tagProperties
        let getTag = false

        for(var j=0; j<idFieldsLength; j++){
            let field = idFields[j]
            let text = get(tagProperties, field, null)
            if(text){
                if(get(infoSet.values, text, 0)<getOnlyFirstEquals){
                    let lower = text.toLowerCase()

                    if(field === "itemprop" || !["thumb", "event", "icon", "nav", "logo", "measurement", "rating"].some((item) => lower.indexOf(item) != -1))
                        getTag = true
                    else break
                }else{
                    getTag = false
                    infoSet.add(text)
                    break
                }

                infoSet.add(text)
                if(getTag) break
            }
        }

        if(getTag && get(img, "src", "").indexOf(".svg") === -1) filtered.push(img)
        if(img[ImgProperties.ID]>=maxDistance) break
    }
    
    return filtered
}

function isPriceLower(firstPrice, comparisonPrice){
    return (firstPrice[0] === comparisonPrice[0] && isBiggerThanStr(comparisonPrice[1], firstPrice[1]))? true: false
}

function haveSameClass(firstPriceClass, secondPrice){
    if(secondPrice){
        if(firstPriceClass && firstPriceClass === secondPrice[PriceProperties.TAG].class) return true
    }

    return false
}

function predictPrice(priceList, titleID, maxPriceDistance=25, onlyFirst=5, normalizePrice=true){
    let lenList = priceList.length
    if(lenList === 1) return priceList[0]
    else if(lenList === 0) return null

    let [filteredList, info] = filterPriceList(priceList, titleID, true)
    let lenFilteredList = filteredList.length

    if(lenFilteredList>0){
        if(lenFilteredList === 1) return filteredList[0]
        
        let mostFrequentPrice = info[PriceInfo.PRICE_FREQUENCY].getKeyWithHigherValue()

        if(info[PriceInfo.PRICE_FREQUENCY].values[mostFrequentPrice] === 1)
            mostFrequentPrice = null

        let mostFrequentCurrency = info[PriceInfo.CURRENCY_FREQUENCY].getKeyWithHigherValue()
        let gotBelow = false

        let currentScore = -1
        let currentPrice = null
        let onlyOneClass = info[PriceInfo.NUM_CLASSES] === 1
        let pricesClass = info[PriceInfo.CLASS_ARRAY]

        for(var i=0; i<lenFilteredList; i++){
            let price = filteredList[i]
            let [currency, value] = price[PriceProperties.PRICE]
            let tagProperties = price[PriceProperties.TAG]
            let score = i===0?10:0

            if(currency === mostFrequentCurrency){
                if(!onlyOneClass && tagProperties.class){
                    if(tagProperties.class === pricesClass[i-1]) continue
                    else if(tagProperties.class === pricesClass[i+1]){
                        i++
                        continue
                    }
                }

                score += getScore(tagProperties, priceTagScores)
                if(get(info[PriceInfo.ID_FREQUENCY].values, get(tagProperties, "class", null), 0) === 1){
                    if(value === mostFrequentPrice) score += 5
                }

                let hasNumber = hasNumberAtEnd.test(tagProperties.id)
                if(hasNumber) score /= 3

                if(score>currentScore){
                    currentScore = score
                    currentPrice = price
                }else if(!gotBelow && !hasNumber && currentPrice && i<=onlyFirst && currentPrice[PriceProperties.PRICE_ID]+1 === price[PriceProperties.PRICE_ID] 
                    && tagProperties["tag"] in priceTagScores && price[PriceProperties.ID]-currentPrice[PriceProperties.ID]<=maxPriceDistance && isPriceLower(price[PriceProperties.PRICE], currentPrice[PriceProperties.PRICE])){
                        gotBelow = true
                        currentPrice = price
                }
            }
        }

        return currentPrice
    }else return null
}

function getScore(tagProperties, tagScoresDict, idDict = idScores, functionaultTagScore=0){
    let score = 0
    let items = Object.entries(idDict)

    for(var i=items.length; i>=0; i--){
        let key, value = items[i]
        if(key in tagProperties) score += value
    }
    
    return score + get(tagScoresDict, tagProperties["tag"], functionaultTagScore)
}

function getScoreWithIdentifier(tagProperties, tagScoresDict, identifiers=new Set(), idDict = idScores, functionaultTagScore=0, identifierScore=100){
    let score = 0
    let tag = tagProperties["tag"]
    let items = Object.entries(idDict)

    for(var i=items.length-1; i>=0; i--){
        let [key, value] = items[i]
        if(key in tagProperties) score += identifiers.has(`${key}.${tagProperties[key]}`)? identifierScore: value 
    }
    
    return score + get(tagScoresDict, tag, functionaultTagScore)
}

function predictImg(imgList, titleID, maxProximityPoints=5, imgIdentifiers=new Set(), parentPunishment=2){
    let lenList = imgList.length

    if(lenList === 1) return imgList[0]
    else if(lenList === 0) return null

    let filteredList = filterImgList(imgList, titleID>100? titleID*2: 150)

    let currentScore = 0
    let currentImg = null
    let proximityMultiplier = maxProximityPoints/titleID
    let lenFilteredList = filteredList.length

    for(var i=0; i<lenFilteredList; i++){
        let img = filteredList[i]
        let imgProp = img[ImgProperties.TAG]
        let parent = get(imgProp, "parent", null)
        let score = null

        if(parent) score = getScoreWithIdentifier(parent, priceTagScores, imgIdentifiers)/parentPunishment
        else score = getScoreWithIdentifier(imgProp, priceTagScores, imgIdentifiers)

        if(score>100) return img

        if(![".gif"].some(value => imgProp["src"].lastIndexOf(value) !== -1)){
            score += isBiggerThanStr(get(imgProp, "width", "1010"),"100",3)? 2.5: -100
            score += isBiggerThanStr(get(imgProp, "height", "1010"),"100",3)? 2.5: -100
            score += getProximityPoints(titleID, img[ImgProperties.ID], proximityMultiplier)
            
            if(["thumb", "banner"].some(value => imgProp["src"].indexOf(value) !== -1)) score /= 2
        }else score = 0

        if(score>currentScore){
            currentScore = score
            currentImg = img
        }
    }
    
    if(currentImg && currentImg[ImgProperties.TAG]["data-src"]){
        currentImg[ImgProperties.TAG].src = currentImg[ImgProperties.TAG]["data-src"]
    }

    return currentImg
}

function getProximityPoints(titleID, currentID, multiplier){
    if(currentID<=titleID) return currentID*multiplier
    else{
        let value = 2*titleID-currentID
        return value>0? value*multiplier: 0
    }
}

function predict(parsedProduct, shopWebsiteInfo = null, maxProximityPoints=5, normalizePrice=true){
    if(parsedProduct){
        let mainTitle = predictTitle(parsedProduct[ParsedProductProperties.TITLE], shopWebsiteInfo? shopWebsiteInfo.titleIdentifiers: undefined)
        if(mainTitle){
            let titleId = mainTitle[TitleProperties.ID]

            let mainPrice = predictPrice(parsedProduct[ParsedProductProperties.PRICES], titleId, undefined, undefined, normalizePrice)
            if(mainPrice){
                mainPrice[PriceProperties.PRICE][1] = add_dot(...mainPrice[PriceProperties.PRICE])
            }

            let mainImg = predictImg(parsedProduct[ParsedProductProperties.IMGS], titleId, maxProximityPoints, shopWebsiteInfo? shopWebsiteInfo.imgIdentifiers: undefined)
            if(mainImg){
                let src = mainImg[ImgProperties.TAG]["src"]
                if(src.indexOf("//") === 0) mainImg[ImgProperties.TAG]["src"] = `http:${src}`
            }

            return get_product_obj(mainTitle, mainImg, mainPrice)
        }
    }
    return null
}

function isBiggerThanStr(string, comparingTo, lenComparingTo=null){
    let lenStr = string.length
    lenComparingTo = lenComparingTo?lenComparingTo:comparingTo.length

    if(lenStr>lenComparingTo) return true
    else if(lenStr === lenComparingTo && string>comparingTo) return true
    return false
}

export { predictTitle, filterPriceList, filterImgList, isPriceLower, predictPrice, getScore, getScoreWithIdentifier, 
    predictImg, getProximityPoints, predict, isBiggerThanStr }