from Utils.dataTypes import Counter
from Utils.shopDataTypes import ImgProperties, PriceProperties, ParsedProductProperties, TitleProperties, get_product_obj
from enum import Enum

idFields = ["itemprop", "id", "class"]
priceTagScores = {"span":10, "div":5, "p":5}
titleTagScores = {"h1":50, "span": 10, "div": 8, "p": 5}
idScores = {"itemprop": 10, "id": 5, "class": 2}

class PriceInfo(Enum):
    PRICE_FREQUENCY = 1
    CURRENCY_FREQUENCY = 2
    ID_FREQUENCY = 3

def predictTitle(titleList, titleIdentifiers={}):
    length = len(titleList)
    if(length<=1): return titleList[0] if length == 1 else None

    currentScore = 0
    currenTitle = None

    for title in titleList:
        tag = title[TitleProperties.TAG]
        score = getScoreWithIdentifier(tag, titleTagScores, identifiers=titleIdentifiers)
        titleClass = tag.get("class", "")
        if(any(word in titleClass for word in ["itle", "roduct"])): score += 11
        if("nav" in titleClass): continue

        if(score>currentScore):
            currentScore = score
            currenTitle = title
    
    return currenTitle

def filterPriceList(priceList, titleID, getInfo=False, getOnlyFirstEquals=1, maxInterval=250):
    filtered = []
    infoSet = Counter()
    currencyFrequency = Counter()
    index = 0
    if(getInfo):
        frequency = Counter()

    for price in priceList:
        tagProperties = price[PriceProperties.TAG]
        getTag = False
        currencyFrequency.add(price[PriceProperties.PRICE][0])

        for field in idFields:
            text = tagProperties.get(field, None)
            if(text):
                if(infoSet.get(text, 0)<getOnlyFirstEquals):
                    getTag = True
                
                infoSet.add(text)

        if(getTag and abs(titleID-price[PriceProperties.ID])<maxInterval):
            filtered.append(price)

            if(getInfo):
                if(infoSet.get(tagProperties.get("class", None),0)<2): frequency.add(price[PriceProperties.PRICE])

            index += 1
        
    if(getInfo): 
        return filtered, {PriceInfo.PRICE_FREQUENCY: frequency, PriceInfo.CURRENCY_FREQUENCY: currencyFrequency, PriceInfo.ID_FREQUENCY: infoSet}
    else: return filtered
        

def filterImgList(imgList, maxDistance=150, getOnlyFirstEquals=1):
    filtered = []
    infoSet = Counter()
    
    for img in imgList:
        tagProperties = img[ImgProperties.TAG]
        tagProperties = tagProperties["parent"] if tagProperties.get("parent", None) else tagProperties
        getTag = False

        for field in idFields:
            text = tagProperties.get(field, None)
            if(text):
                if(infoSet.get(text, 0)<getOnlyFirstEquals):
                    lower = text.lower()
                    
                    if(field == "itemprop" or not any(word in lower for word in ["thumb", "event", "icon", "nav", "logo"])):
                        getTag = True
                    else: break
                else:
                    getTag = False
                    infoSet.add(text)
                    break

                infoSet.add(text)
                if(getTag): break
        if(getTag and ".svg" not in img.get("src", "")): filtered.append(img)
        if(img[ImgProperties.ID]>=maxDistance): break
    
    return filtered

def isPriceLower(firstPrice, comparisonPrice):
    return True if firstPrice[0] == comparisonPrice[0] and comparisonPrice[1]<firstPrice[1] else False

def predictPrice(priceList, titleID, maxPriceDistance=15, onlyFirst=5):
    lenList = len(priceList)
    if(lenList == 1): return priceList[0]
    elif(lenList == 0): return None

    filteredList, info = filterPriceList(priceList, titleID, True)

    if(len(filteredList)>0):
        mostFrequentPrice = info[PriceInfo.PRICE_FREQUENCY].getKeyWithHigherValue()
        if(info[PriceInfo.PRICE_FREQUENCY][mostFrequentPrice] == 1):
            mostFrequentPrice = None
        mostFrequentCurrency = info[PriceInfo.CURRENCY_FREQUENCY].getKeyWithHigherValue()
        gotBelow = False

        currentScore = -1
        currentPrice = None
        index = 0

        for price in filteredList:
            currency, _ = price[PriceProperties.PRICE]
            tagProperties = price[PriceProperties.TAG]

            if(currency == mostFrequentCurrency):
                score = getScore(tagProperties, priceTagScores)
                if(info[PriceInfo.ID_FREQUENCY].get(tagProperties.get("class", None), 0) == 1):
                    if(price[PriceProperties.PRICE] == mostFrequentPrice):
                        score += 5

                if(score>currentScore):
                    currentScore = score
                    currentPrice = price
                elif(not gotBelow and currentPrice and index<=onlyFirst and currentPrice[PriceProperties.PRICE_ID]+1 == price[PriceProperties.PRICE_ID] and price[PriceProperties.ID]-currentPrice[PriceProperties.ID]<=maxPriceDistance and isPriceLower(currentPrice[PriceProperties.PRICE], price[PriceProperties.PRICE])):
                    gotBelow = True
                    currentPrice = price

            index += 1
        
        return currentPrice
    else: return None

def getScore(tagProperties, tagScoresDict, idDict = idScores, defaultTagScore=0):
    score = 0

    for key, value in idDict.items():
        if(key in tagProperties): score += value
    
    return score + tagScoresDict.get(tagProperties["tag"], defaultTagScore)

def getScoreWithIdentifier(tagProperties, tagScoresDict, idDict = idScores, defaultTagScore=0, identifiers={}, identifierScore=100):
    score = 0
    tag = tagProperties["tag"]

    for key, value in idDict.items():
        if(key in tagProperties): 
            score += identifierScore if tag in identifiers else value 
    
    return score + tagScoresDict.get(tag, defaultTagScore)

def predictImg(imgList, titleID, maxProximityPoints=5, imgIdentifiers={}, parentPunishment=2):
    lenList = len(imgList)
    if(lenList == 1): return imgList[0]
    elif(lenList == 0): return None

    filteredList = filterImgList(imgList, titleID*2 if titleID>100 else 150)

    currentScore = 0
    currentImg = None
    proximityMultiplier = maxProximityPoints/titleID
    for img in filteredList:
        imgProp = img[ImgProperties.TAG]
        parent = imgProp.get("parent", None)
        if(parent):score = getScoreWithIdentifier(parent, priceTagScores, identifiers=imgIdentifiers)/parentPunishment
        else: score = getScoreWithIdentifier(imgProp, priceTagScores, identifiers=imgIdentifiers)

        if(score>100): return img

        if(".gif" not in imgProp["src"]):
            score += 2.5 if isBiggerThanStr(imgProp.get("width", "1010"),"100",3) else -100
            score += 2.5 if isBiggerThanStr(imgProp.get("height", "1010"),"100",3) else -100
            score += getProximityPoints(titleID, img[ImgProperties.ID], proximityMultiplier)
        else: score = 1
        
        if(score>currentScore):
            currentScore = score
            currentImg = img
    
    return currentImg

def getProximityPoints(titleID, currentID, multiplier):
    if(currentID<=titleID): return currentID*multiplier
    else:
        value = 2*titleID-currentID
        return value*multiplier if value>0 else 0

def predict(parsedProduct, shopWebsiteInfo = None, maxProximityPoints=5):
    if(parsedProduct):
        mainTitle = predictTitle(parsedProduct[ParsedProductProperties.TITLE], shopWebsiteInfo.titleIdentifiers if shopWebsiteInfo else {})
        if(mainTitle):
            titleId = mainTitle[TitleProperties.ID]
            mainPrice = predictPrice(parsedProduct[ParsedProductProperties.PRICES], titleId)
            mainImg = predictImg(parsedProduct[ParsedProductProperties.IMGS], titleId, maxProximityPoints, shopWebsiteInfo.imgIdentifiers if shopWebsiteInfo else {})

            return get_product_obj(mainTitle, mainImg, mainPrice)
    
    return None

def isBiggerThanStr(string, comparingTo, lenComparingTo):
    lenStr = len(string)
    if(lenStr>lenComparingTo): return True
    elif(lenStr == lenComparingTo and string>=comparingTo): return True
    return False