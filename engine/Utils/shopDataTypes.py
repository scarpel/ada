from enum import Enum
from .dataTypes import FrequencyCounter, WebsiteInfo


ITEMPROP = "itemprop"
ID = "id"
CLASS = "class"

TAG_ID_PRIORITY = [ITEMPROP, ID, CLASS]
REQUIRED_FIELDS = {"src", "width", "height", "id", "class", "itemprop", "data-a-dynamic-image"}
IDENTIFIERS_WITHOUT_CLASS = [ITEMPROP, ID]

SEPARATORS_SET = {"|", ":", "-"}

class PriceProperties(Enum):
    ID = 1
    TAG = 2
    PRICE = 3
    PRICE_ID = 4

class ImgProperties(Enum):
    ID = 1
    TAG = 2

class TitleProperties(Enum):
    ID = 1
    TAG = 2
    TITLE = 3
    FULL_TAG = 4

class ParsedProductProperties(Enum):
    TITLE = 1
    IMGS = 2
    PRICES = 3

class ProductProperties(Enum):
    TITLE = 1
    IMG = 2
    PRICE = 3

class ShopWebsiteInfo(WebsiteInfo):
    def __init__(self, url, name, url_id, hasJavascript, website_id=None, titleIds=None, imgIds=None):
        super().__init__(url, name, url_id, website_id)
        self.titleIdentifiers = titleIds if titleIds else set()
        self.imgIdentifiers = imgIds if imgIds else set()
        self.hasJavascript = hasJavascript

    def __str__(self):
        return "\n".join([
            f"{self.name}: {self.url}",
            f"  - Website ID: {self.website_id}",
            f"  - Favicon Name: {self.url_id}.ico",
            f"  - Has Javascript? {self.hasJavascript}",
            f"  - Titles IDs: {self.titleIdentifiers}",
            f"  - Images IDs: {self.imgIdentifiers}"
        ])

    def _addToIdentifiers(self, tagObjectfied, identifiersSet):
        addedAtLeastOne = False
        added = []

        for id in IDENTIFIERS_WITHOUT_CLASS:
            tagClass = tagObjectfied.get(id, None)
            if(tagClass and tagClass not in identifiersSet):
                identifiersSet.add(id)

                added.append(tagClass)
                addedAtLeastOne = True
        
        if(not addedAtLeastOne and CLASS in tagObjectfied):
            tagClass = tagObjectfied[CLASS]
            if(tagClass not in identifiersSet):
                identifiersSet.add(tagClass)
                added.append(tagClass)
        
        return added

    def addToTitleIdentifiers(self, tagObjectfied):
        return self._addToIdentifiers(tagObjectfied, self.titleIdentifiers)
    
    def addToImgIdentifiers(self, tagObjectfied):
        return self._addToIdentifiers(tagObjectfied["parent"] if "parent" in tagObjectfied else tagObjectfied, self.imgIdentifiers)
    
    def updateWithProduct(self, product):
        if(product):
            return self.addToTitleIdentifiers(product[ProductProperties.TITLE][TitleProperties.TAG]), self.addToImgIdentifiers(product[ProductProperties.IMG][ImgProperties.TAG])
    
    @classmethod
    def from_db(cls, website_id, url, name, url_id, hasJavascript, titleIds, imgIds):
        return cls(url, name, url_id, True if hasJavascript else False, website_id, titleIds, imgIds)
        
class ShopWebsitesInfo:
    def __init__(self):
        self._websiteInfo = {}
    
    def addWebsiteInfo(self, websiteInfo):
        self._websiteInfo[websiteInfo.url] = websiteInfo
    
    def removeWebsiteInfo(self, url):
        del self._websiteInfo[url]
    
    def get(self, url, notFound):
        return self._websiteInfo.get(url, notFound)

def getTagDictId(objectfied):
    if("tag" in objectfied):
        arr = [objectfied["tag"]]

        for id in TAG_ID_PRIORITY:
            if(id in objectfied): arr.append(f'{id}="{objectfied[id]}"')
        
        return " ".join(arr)
    else: return None

def get_product_obj(title, img, price):
    return {
        ProductProperties.TITLE: title,
        ProductProperties.IMG: img,
        ProductProperties.PRICE: price
    }