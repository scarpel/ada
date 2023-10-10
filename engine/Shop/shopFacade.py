from Utils.websiteUtils import get_main_url
from .shopParser import ShopHTMLParser
from .shopPredictor import predict
from Utils.htmlFetcher import get_html_from_url, get_js_html_from_url
from Utils.shopUtils import doRunJavascript, isSameProduct, isProductValid
from Utils.shopDataTypes import ShopWebsiteInfo, ShopWebsitesInfo, ProductProperties, TitleProperties, PriceProperties, ImgProperties
from Utils.websiteUtils import get_basic_website_info
from Favicon.favicon import save_favicon
from Utils.paths import MAIN, FAVICONS
from os import getcwd
from os.path import join
import time
from json import dumps

parser = ShopHTMLParser()

def get_known_product(url, shopInfo, timeout):
    product = predict(parser.parse(get_js_html_from_url(url) if shopInfo.hasJavascript else get_html_from_url(url)), shopInfo)
    product["url"] = url
    return product

def get_unknown_product(url, timeout):
    hasJavascript = False
    html = get_html_from_url(url, timeout)
    parsedObj = parser.parse(html)
    page_title = parser.title
    product = predict(parsedObj)

    if(doRunJavascript(parsedObj)):
        html = get_js_html_from_url(url, timeout)
        parsedJsObj = parser.parse(html)
        productJs = predict(parsedJsObj)
        if(not isSameProduct(product, productJs)):
            hasJavascript = True
            product = productJs
    
    product["url"] = url
    return product, hasJavascript, page_title, html

def get_json_product(product, url_id, siteName):
    currency, price = product[ProductProperties.PRICE][PriceProperties.PRICE]
    s = {
        "title": product[ProductProperties.TITLE][TitleProperties.TITLE],
        "img": product[ProductProperties.IMG][ImgProperties.TAG]["src"],
        "price": {"currency": currency, "value":price},
        "site": siteName,
        "url_id": url_id
    }

    return dumps(s)

def get_product(url, main_url=None, shopInfo=None, timeout=30):
    main_url = main_url if main_url else get_main_url(url)

    if(shopInfo):
        product = get_known_product(url, shopInfo, timeout)
        if(isProductValid(product)):
            return product, shopInfo
    else:
        product, hasJavascript, page_title, html = get_unknown_product(url, timeout)

        if(isProductValid(product)):
            siteName, favicon, favName, _ = get_basic_website_info(main_url, page_title, html)
            save_favicon(join(getcwd(), "temp"), favicon, favName)
            return product, ShopWebsiteInfo(main_url, siteName, favName, hasJavascript)
    
    return None
