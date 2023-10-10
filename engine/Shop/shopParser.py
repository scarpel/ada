from Utils.strFuncs import index_after, get_until, get_until_if_exists, find_and_go_after, count_last_spaces
from Utils.htmlUtils import get_body_or_main, get_start_end_tag, get_tag_property, get_tag_content, decode_html_text, get_tag_until, objectifyTag, get_link_from_data_dynamic, isEndTag
from Utils.dataTypes import Counter
from Utils.shopDataTypes import PriceProperties, ImgProperties, TitleProperties, ParsedProductProperties, REQUIRED_FIELDS, TAG_ID_PRIORITY
from Utils.priceFuncs import get_price_and_currency, get_first_price_index, check_after_price, check_for_price_interval
from enum import Enum
from .shopFinder import find_title, find_img
from Utils.shopUtils import hasSomePropertiesInSet, trimTitle
from math import floor

defaultDesirableTags = {"div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "br", "source", "form", "fieldset", "header", "strong", "figure", "td", "tr", "tbody", 
    "table", "button", "bdi", "em"}
unaryTags = {"img", "text", "br", "hr"}

tagIdentifiersPriority = TAG_ID_PRIORITY

containerTags = {"div", "li", "fieldset", "tr", "table", "button", "em"}

titleTagScore = {"h1":4, "div":3, "span":3}

class ParseStatus(Enum):
    HALTED = 1
    PARSING = 2
    PRICE_INTERVAL = 3
    SUCCESS = 4

class ShopHTMLParser:
    def __init__(self, desirableTags=None, minSizePerc = 0.35, maxSizePerc=1.5, minEqualityPerc=0.3):
        self.desirableTags = desirableTags if desirableTags else defaultDesirableTags
        self.minSizePerc = minSizePerc
        self.maxSizePerc = maxSizePerc
        self.minEqualityPerc = minEqualityPerc

    def _getMinEqualityPerc(self):
        value = floor(self.titleSetLength * self.minEqualityPerc)
        return value if value>0 else 1

    def _cleanVariables(self):
        self.parents = []
        self.index = 0
        self.foundText = False
        self.imgs = []
        self.prices = []
        self.texts = [[]]
        self.countText = 0
        self.countPrice = 0
        self.hasElegibleText = [False]
        self.objectfiedParent = None
        self.abortParsing = False
        self.status = ParseStatus.HALTED
        self.failedImgs = []
        self.titles = []
        self.addedToPrices = [False]

    def parse(self, rawHtml):
        if(rawHtml is None): return None
        
        self.title = get_tag_content(rawHtml, "title", 0, len(rawHtml))

        if(self.title):
            self._cleanVariables()
            self.title = decode_html_text(self.title)
            self.titleSet = set(trimTitle(self.title).lower().split(" "))
            self.titleLength = len(self.title)
            self.titleSetLength = len(self.titleSet)
            self._minEqualityPerc = self._getMinEqualityPerc()

            self.html = get_body_or_main(rawHtml).replace("\n", "").replace("\t"," ").replace("\r","").replace(chr(160), " ")
            self.endHtml = len(self.html)
            self.status = ParseStatus.PARSING

            self._obtainTagArray(self._handleUnaryTag, self._handleTitle, self._handlePrice)
            
            return self._getParsedObj()
        else: return None
    
    def get_prices(self, rawHtml):
        if(rawHtml is None): return None

        self._cleanVariables()

        self.html = get_body_or_main(rawHtml).replace("\n", "").replace("\t"," ").replace("\r","").replace(chr(160), " ")
        self.endHtml = len(self.html)
        self.status = ParseStatus.PARSING

        self._obtainTagArray(self._handleUnaryTag, self._handleTitle, self._handlePrice)
        
        return self.prices
    
    def fast_parse(self, rawHtml, shopWebsiteInfo):
        if(rawHtml is None): return None

        self.title = get_tag_content(rawHtml, "title", 0, len(rawHtml))
        if(self.title):
            self._cleanVariables()
            self.title = decode_html_text(self.title)
            self.titleSet = set(self.title.lower().split(" "))
            self.titleLength = len(self.title)
            self.titleSetLength = len(self.titleSet)
            self._minEqualityPerc = self._getMinEqualityPerc()
            
            self.html = get_body_or_main(rawHtml).replace("\n", "").replace("\t"," ").replace("\r","").replace(chr(160), " ")
            self.endHtml = len(self.html)
            self.status = ParseStatus.PARSING
            self.imgIdentifiers = shopWebsiteInfo.imgIdentifiers
            self.titleIdentifiers = shopWebsiteInfo.titleIdentifiers

            self._obtainTagArray(self._handleUnaryTagWithSet, self._handleTitleWithSet, self._handlePrice)

            self.imgIdentifiers = None
            self.titleIdentifiers = None

            return self._getParsedObj()
        else: return None

    def _getParsedObj(self):
        return {
            ParsedProductProperties.TITLE: self.titles,
            ParsedProductProperties.IMGS: self.imgs,
            ParsedProductProperties.PRICES: self.prices
        }

    def _isValidTag(self, tag):
        if(tag[0] not in {"!", "?"}): return True
        else: return False

    def _parseNonUsefulTag(self, tag):
        endTag = index_after(self.html, "</"+tag+">", self.index, self.endHtml)

        if(endTag != -1):
            numPossibleTags = self._numAllPossibleTags(tag, self.index, endTag)

            while(numPossibleTags != 0):
                index = endTag
                for _ in range(numPossibleTags):
                    endTag = index_after(self.html, "</"+tag+">", endTag, self.endHtml)
                    if(endTag == -1): break

                numPossibleTags = self._numAllPossibleTags(tag, index, endTag)

            self.index = endTag

    def _numAllPossibleTags(self, tag, start, end):
        numPossibleTags = 0
        fullTag = f"<{tag}"
        indexPossibleTag = self.html.find(fullTag, start, end)
        endIndex = indexPossibleTag+len(fullTag)

        while(indexPossibleTag != -1 and indexPossibleTag<end and self.html[endIndex:endIndex+1] in {" ", ">"}):
            if(self._elegiblePossibleTag(indexPossibleTag)):
                numPossibleTags += 1
            indexPossibleTag = self.html.find(fullTag, index_after(self.html, ">", indexPossibleTag, end), end)
        
        return numPossibleTags

    def _elegiblePossibleTag(self,index):
        if(index>1):
            lastChar = self.html[index-2:index]
            if(lastChar not in {"\\n"}):
                if(lastChar[1] not in {"'", '"'}): 
                    return True
        elif(index>0):
            lastChar = self.html[index-1:index]
            if(lastChar not in {"'", '"'}): 
                return True
            
        return False

    def _getObjectfiedParent(self):
        if(not self.objectfiedParent):
            _, fullTag = self.parents[-1]
            self.objectfiedParent = objectifyTag(fullTag, REQUIRED_FIELDS)

        return self.objectfiedParent

    def _getID(self, fullTag):
        end = len(fullTag)

        for identifier in tagIdentifiersPriority:
            id = get_tag_property(fullTag, identifier, 0, end)
            if(id is not None): return (identifier,id)
        
        return None
    
    def _treatIMG(self, imgObj):
        if("src" in imgObj):
            src = imgObj["src"]
            if(("http" not in src and src[:2] != "//")):
                newSrc = get_link_from_data_dynamic(imgObj.get("data-a-dynamic-image", None))
                if(newSrc):
                    imgObj["src"] = newSrc
                    del imgObj["data-a-dynamic-image"]
                else: return None
        else: return None

        return imgObj

    def _parseIMG(self, fullTag):
        return self._treatIMG(objectifyTag(fullTag, REQUIRED_FIELDS))

    def _isIMGValid(self, parsedImg):
        parentClass = get_tag_property(self.parents[-1][1], "class", 0)

        if(parentClass and "thumb" in parentClass.lower()): return False

        if(parsedImg.get("itemprop", None)): return True
        else:
            imgClass = parsedImg.get("class", "").lower()
            if(imgClass): return False if any(word in imgClass for word in ["thum", "hide"]) else True
            else: return True
        
        return False
    
    def _imgHasIdentifier(self, imgObj): 
        return imgObj.get("itemprop", False) or imgObj.get("id", False) or imgObj.get("class", False)

    def _getTextScore(self, textSet):
        count = 0

        for word in textSet:
            if(word in self.titleSet): count += 1
        
        return count

    def _isTitle(self, text, lenText):
        if(0 < lenText/self.titleLength <= self.maxSizePerc):
            textSet = set(text.lower().split(" "))
            score = self._getTextScore(textSet)
            if(score>=self._minEqualityPerc or len(textSet) == score): return True
    
        return False

    def _getTitleObj(self, text, tagObj=None):
        return {
            TitleProperties.ID: self.countText,
            TitleProperties.TAG: tagObj if tagObj else self._getObjectfiedParent(),
            TitleProperties.TITLE: text
        }

    def _handleTitle(self, text, lenText):
        if(self._isTitle(text, lenText)):
            if(self.parents[-1][0] != self.parents[-1][1]):
                self.titles.append(self._getTitleObj(text))
                if(self.parents[-1][0] == "h1"): self.foundText = True

                return True
            else: self.hasElegibleText[-2] = True
        
        return False

    def _handleTitleWithSet(self, text, lenText):
        tag, fullTag = self.parents[-1]

        if(self.minSizePerc <= lenText/self.titleLength <= self.maxSizePerc):
            if(tag != fullTag):
                titleObj = objectifyTag(fullTag, REQUIRED_FIELDS)
                if(hasSomePropertiesInSet(titleObj, self.titleIdentifiers)):
                    self.titleTag = self._getTitleObj(text, titleObj)
                    self.foundText = True
                    return True
                else: self._getTextScore(text)
            else: self.hasElegibleText[-2] = True

        return False

    def _handlePrice(self, text, lenText):
        tag, fullTag = self.parents[-1]

        if(lenText<150):
            priceClass = get_tag_property(self.parents[-1][1], "class", 0)
            lower = priceClass.lower()

            if(not priceClass or not any(word in lower for word in ["strike", "coupon", "checkout", "saving", "shipping"])):
                price, indexes = get_price_and_currency(text)
                if(price and text[0] != "+"):
                    _, priceEnd = indexes

                    if(priceEnd>=lenText or check_after_price(text[priceEnd:])):
                        if(len(fullTag)>len(tag)):
                            if(not self.addedToPrices[-1]):
                                self.countPrice += 1
                                self.prices.append(
                                    {
                                        PriceProperties.ID: self.countText,
                                        PriceProperties.PRICE_ID: self.countPrice,
                                        PriceProperties.TAG: self._getObjectfiedParent(),
                                        PriceProperties.PRICE: price
                                    }
                                )
                                self.addedToPrices[-1] = True
                            return True
                        else: self.hasElegibleText[-2] = True
                    elif(check_for_price_interval(text[priceEnd:])):
                        self.abortParsing = True
                        self.status = ParseStatus.PRICE_INTERVAL
                        return True
            else:
                self.texts[-1].pop()
                return True
        
        return False

    def _getIMG(self, imgObj):
        return {ImgProperties.ID: self.countText, ImgProperties.TAG: imgObj}

    def _handleText(self, text, handleTitle, handlePrice):
        text = text.strip()
        lenText = len(text)
        text = decode_html_text(text)
        if(self.foundText): return handlePrice(text, lenText)
        else: return True if handleTitle(text, lenText) else handlePrice(text, lenText)

    def _handleUnaryTag(self, tag, startTag, endTag):
        if(tag == "img"):
            imgObj = self._parseIMG(self.html[startTag:endTag])
            if(imgObj and self._isIMGValid(imgObj)):
                if(not self._imgHasIdentifier(imgObj)):
                    imgObj["parent"] = self._getObjectfiedParent()
                
                self.imgs.append(self._getIMG(imgObj))
    
    def _handleUnaryTagWithSet(self, tag, startTag, endTag):
        if(len(self.imgs) == 0 and tag == "img"):
            imgObj = self._parseIMG(self.html[startTag:endTag])
            if(imgObj and self._isIMGValid(imgObj)):
                if(not self._imgHasIdentifier(imgObj)):
                    imgObj["parent"] = self._getObjectfiedParent()

                img = self._getIMG(imgObj)
                if(hasSomePropertiesInSet(imgObj, self.imgIdentifiers)): self.imgs.append(img)
                else: self.failedImgs.append(img)

    def _obtainTagArray(self, handleUnaryTag, handleTitle, handlePrice):
        while(-1<self.index<self.endHtml):
            startTag = self.html.find("<", self.index, self.endHtml)

            if(self.index != startTag):
                text = self.html[self.index:startTag]
                if(len(text)>1): 
                    text = text.lstrip()
                    lenText = len(text)
                    count = count_last_spaces(text, lenText)
                    if(count>1): text = text[:lenText-count]

                if(text):
                    self.countText += 1
                    self.texts[-1].append(text)
                    self.hasElegibleText[-1] = True

            endTag = self.html.find(">", startTag, self.endHtml)
            numberQuotes = self.html[startTag:endTag].count('"')

            while(numberQuotes%2 != 0):
                if(numberQuotes - (self.html[startTag:endTag].count('="')*2) != 1):
                    endTag += 1
                    newEndTag = self.html.find(">", endTag)
                    numberQuotes += self.html[endTag:newEndTag].count('"')
                    endTag = newEndTag
                else: break

            tag = get_until(self.html, " ", startTag+1, endTag)
            if(isEndTag(tag)):
                tagWithoutSlash = tag[1:]
                
                if(tagWithoutSlash in self.desirableTags and self.parents[-1][0] == tagWithoutSlash):
                    lenCurrentText = len(self.texts[-1])

                    # if(self.parents[-1][1] == 'div class="price-template-price-block"'):
                    #     print("meu cu")

                    if(lenCurrentText>0):
                        if(self.hasElegibleText[-1] or lenCurrentText>1):
                            text = "".join(self.texts[-1])
                            worthIt = self._handleText(text, handleTitle, handlePrice)
                            # print(self.parents[-1])
                            if(self.addedToPrices[-1] and not worthIt):
                                self.prices.pop()
                            elif((self.addedToPrices[-1] or not worthIt) and self.parents[-1][0] not in containerTags):
                                self.texts[-2].append(text)
                                self.addedToPrices[-2] = self.addedToPrices[-1]
                            elif(self.abortParsing):
                                self.titleTag = None
                                return None

                    self.texts.pop()
                    self.parents.pop()
                    self.hasElegibleText.pop()
                    self.objectfiedParent = None
                    self.addedToPrices.pop()

                self.index = endTag+1
            else:
                self.index = endTag+1

                if(tag in self.desirableTags):
                    if(tag in unaryTags):
                        handleUnaryTag(tag, startTag, endTag)
                    else:
                        fullTag = self.html[startTag+1:endTag]
                        self.parents.append((tag, fullTag))
                        self.texts.append([])
                        self.hasElegibleText.append(False)
                        self.addedToPrices.append(False)
                else:
                    tag = tag.strip()
                    index = tag.find("<")
                    if(index != -1): tag = tag[index+1:]

                    if(self.html[endTag-1] != "/" and tag[0] != "!"): self._parseNonUsefulTag(tag)
                    elif("!--" in tag):
                        self.index = index_after(self.html, "-->", startTag, self.endHtml)
        
        self.status = ParseStatus.SUCCESS