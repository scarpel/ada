from .shopDataTypes import ParsedProductProperties, TitleProperties, TAG_ID_PRIORITY, PriceProperties, ImgProperties, SEPARATORS_SET, ProductProperties
from Shop.shopPredictor import predictPrice, predictImg
from Utils.websiteUtils import get_main_url
from Utils.shopDataTypes import TAG_ID_PRIORITY
from requests_html import HTMLSession
from .databaseUtils import get_last_id, insert
from .databaseConsts import SHOP_PRODUCTS, SHOP_TITLE_IDS, SHOP_IMG_IDS, SHOP_PRICES, SHOP_WEBSITES
from datetime import date
from os.path import join
from os import rename
from Utils.paths import FAVICONS, TEMP

imgComparisonProps = [*TAG_ID_PRIORITY, "src", "width", "height"]

def doFetchJavascriptPage(parsedProduct):
    if(len(parsedProduct[ParsedProductProperties.TITLE])==0 or len(parsedProduct[ParsedProductProperties.PRICES])<5 or len(parsedProduct[ParsedProductProperties.IMGS])<5):
        return True
    else: return False

def doRunJavascript(parsedProduct):
    if(parsedProduct is None or parsedProduct[ParsedProductProperties.TITLE] is None or len(parsedProduct[ParsedProductProperties.PRICES]) == 0 or len(parsedProduct[ParsedProductProperties.PRICES])==0):
        return True
    else: return False

def isSameTag(firstTag, secondTag, comparisonProperties=None):
    if(firstTag.get("tag", None) != secondTag.get("tag", None)): return False
    if(not comparisonProperties): comparisonProperties = TAG_ID_PRIORITY

    for prop in comparisonProperties:
        if(firstTag.get(prop, None) != secondTag.get(prop,None)): return False
    
    return True

def _isSameTag(firstTag, secondTag, comparisonProperties=None):
    if(firstTag and secondTag): return isSameTag(firstTag, secondTag, comparisonProperties)
    elif(not firstTag and not secondTag): return True
    else: return False

def isSameTitle(firstTitle, secondTitle):
    if(firstTitle and secondTitle):
        if(firstTitle[TitleProperties.TITLE] != secondTitle[TitleProperties.TITLE] or not isSameTag(firstTitle[TitleProperties.TAG], secondTitle[TitleProperties.TAG])):
            return False
        else: return True
    elif(not firstTitle and not secondTitle): return True
    else: return False

def isSamePrice(firstPrice, secondPrice):
    if(firstPrice and secondPrice):
        if(firstPrice[PriceProperties.PRICE] != secondPrice[PriceProperties.PRICE] or not isSameTag(firstPrice[PriceProperties.TAG], secondPrice[PriceProperties.TAG])):
            return False
        else: return True
    elif(not firstPrice and not secondPrice): return True
    else: return False

def isSameImg(firstImg, secondImg):
    if(firstImg and secondImg):
        firstImg = firstImg[ImgProperties.TAG]
        secondImg = secondImg[ImgProperties.TAG]
        if(isSameTag(firstImg, secondImg, imgComparisonProps) and _isSameTag(firstImg.get("parent", None), secondImg.get("parent", None)) ): return True
        else: return False
    elif(not firstImg and not secondImg): return True
    else: return False

def isSameProduct(firstProduct, secondProduct):
    if(firstProduct and secondProduct):
        return isSameTitle(firstProduct[ProductProperties.TITLE], secondProduct[ProductProperties.TITLE]) and isSamePrice(firstProduct[ProductProperties.PRICE], secondProduct[ProductProperties.PRICE]) and isSameImg(firstProduct[ProductProperties.IMG], secondProduct[ProductProperties.IMG])
    elif(not firstProduct and not secondProduct): return True
    else: return False

def getLastIndexes(text):
    indexes = {}
    index = 0

    for char in text:
        indexes[char] = index
        index += 1

    return indexes

def getFurtherIndexOfSet(indexes, separatorsSet):
    index = -1

    for separator in separatorsSet:
        if(separator in indexes and indexes[separator]>index): index = indexes[separator]
    
    return index if index>-1 else None

def trimTitle(title, separatorsSet=SEPARATORS_SET, minDistancePercentage=0.75):
    index = getFurtherIndexOfSet(getLastIndexes(title), separatorsSet)
    if(index and index/len(title)>=minDistancePercentage):
        return title[:index]
    else: return title

def get_HTML_Session():
    session = HTMLSession()
    session.headers.update({"user-agent":'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36'})
    return session

def isSameTagWithIn(orinalObjectfied, otherFullTag):
    return f'{orinalObjectfied["tag"]} ' in otherFullTag and orinalObjectfied.get("class", "") in otherFullTag and orinalObjectfied.get("id", "") in otherFullTag and orinalObjectfied.get("itemprop", "") in otherFullTag

def hasSameTagProperties(orinalObjectfied, comparisonObjectfied):
    return orinalObjectfied.get("class", None) == comparisonObjectfied.get("class", None) and orinalObjectfied.get("id", None) == comparisonObjectfied.get("id", None) and orinalObjectfied.get("itemprop", None) == comparisonObjectfied.get("itemprop", None)

def hasSomePropertiesInSet(tagObjectfied, setIdentifiers):
    for id in TAG_ID_PRIORITY:
        if(tagObjectfied.get(id, None) in setIdentifiers): return True
    
    return False

def isProductValid(product):
    return product and product.get(ProductProperties.TITLE, False) and product.get(ProductProperties.PRICE, False) and product.get(ProductProperties.IMG, False)

def store_product(cursor, product, shopInfo):
    product_id = get_last_id(cursor, SHOP_PRODUCTS)
    product_id = product_id+1 if product_id else 1

    titleAdded, imgAdded = shopInfo.updateWithProduct(product)

    for titleClass in titleAdded:
        insert(cursor, SHOP_TITLE_IDS, "?,?", [titleClass, shopInfo.website_id])

    for imgClass in imgAdded:
        insert(cursor, SHOP_IMG_IDS, "?,?", [imgClass, shopInfo.website_id])

    insert(cursor, SHOP_PRODUCTS, "?, ?, ?, ?, ?", [None, product["url"], product[ProductProperties.TITLE][TitleProperties.TITLE], "cu", shopInfo.website_id])
    
    currency, value = product[ProductProperties.PRICE][PriceProperties.PRICE]
    insert(cursor, SHOP_PRICES, "?, ?, ?, ?, ?", [None, currency, convert_price(value), str(date.today()), product_id])

def store_shop_website(cursor, shopInfo, directory):
    website_id = get_last_id(cursor, SHOP_WEBSITES)
    website_id = website_id+1 if website_id is not None else 1

    insert(cursor, SHOP_WEBSITES, "?,?,?,?,?", [None, shopInfo.url, shopInfo.name, shopInfo.url_id, shopInfo.hasJavascript])
    shopInfo.website_id = website_id

    favName = f"{shopInfo.url_id}.ico"
    try:
        rename(join(directory, TEMP, favName), join(directory, FAVICONS, favName))
    except FileExistsError: 
        pass

def convert_price(price):
    if(type(price) is str): 
        price = float(price.replace(",", "."))

    return int(price*100)

def parse_price(price):
    return price/100