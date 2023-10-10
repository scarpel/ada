from htmlTreeStructure import SimpleDivNode, SimpleTagNode, SimpleUnaryTagNode
from exceptions.htmlExceptions import InvalidHTML
from Utils.strFuncs import index_after, get_until, get_until_if_exists, find_and_go_after, get_body_or_main
from Utils.utils import isEndTag, calculate_article_code, isLinkValid
from Utils.dataTypes import ArticleItems, createArticleElementsTable

defaultDesirableTags = {"div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "br"}
unaryTags = {"img", "br"}
getTags = {"div", "li"}

class SpecificClassHTMLParser:
    def __init__(self, desirableTags):
        self.desirableTags = desirableTags if desirableTags else defaultDesirableTags

    def parse(self, html, classes, index=0):
        html = get_body_or_main(html)
        self._setParser(len(html), index)

        return self._parseTags(html, classes)

    def parseArticleElements(self, html, urlInfo, index=0):
        html = get_body_or_main(html)
        self._setParser(len(html), index)

        return self._parseArticleElements(html, urlInfo.articleClasses, urlInfo.articleElements)

    def _setParser(self,lengthHtml, index):
        self.endHtml = lengthHtml
        self.index = index
        self.noscriptOffset = 500

    def _parseTags(self, html, classes):
        self.parents = []
        self.hasText = []
        classNodes = {_class:[] for _class in classes}
        getDiv = False

        while(self.index<self.endHtml):
            startIndex = html.find("<", self.index)
            endIndex = html.find(">", startIndex)
            tag = get_until(html, " ", startIndex+1, endIndex)

            if(not getDiv):
                if(tag in getTags):
                    tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                    if(tagClass in classes):
                        self.parents.append(SimpleDivNode(tagClass))
                        self.hasText.append(True)
                        getDiv = True
                
                self.index = endIndex+1
            else:
                if(isEndTag(tag)):
                    if(startIndex != self.index and self.hasText[-1]):
                        self.parents[-1].content = html[self.index:startIndex]

                    self.index = endIndex+1
                    self.hasText.pop()

                    if(len(self.parents) == 1):
                        classNodes[self.parents[0].tagClass].append(self.parents[0])
                        getDiv = False
                    
                    self.parents.pop()
                else:
                    self.index = endIndex+1

                    if(tag in self.desirableTags):
                        tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                        self.hasText[-1] = False
                        
                        if(tag in unaryTags):
                            if(tag == "img"):
                                self.parents[-1].addChild(self._get_img(html, startIndex, endIndex))
                        else:
                            self.hasText.append(True)

                            if(tag in getTags):
                                node = SimpleDivNode(tagClass)
                            else:
                                node = SimpleTagNode(tag, tagClass)
                                if(tag == "a"): node.link = get_until_if_exists(html, '"', index_after(html, 'href="', startIndex, endIndex), endIndex)
                            
                            self.parents[-1].addChild(node)
                            self.parents.append(node)

                            if(tag == "picture"):
                                self._add_img_from_picture(html)
                                self.index = html.find("</picture>", self.index)
                    else: self._parseNonUsefulTag(html, tag)
            
        return classNodes
            

    def _parseArticleElements(self, html, classes, articleElementsDict):
        self.parents = []
        self.hasText = []
        classNodes = {_class:[] for _class in classes}
        currentArticleElements = {}
        invertedArticleElementsDict = {}
        currentInvertedArticleElements = {}
        getDiv = False
        aLink = ""
        
        while(self.index<self.endHtml):
            startIndex = html.find("<", self.index)
            endIndex = html.find(">", startIndex)
            tag = get_until(html, " ", startIndex+1, endIndex)

            if(not getDiv):
                if(tag in getTags):
                    tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                    if(tagClass in classes):
                        self.parents.append(SimpleDivNode(tagClass))
                        self.hasText.append(True)
                        getDiv = True

                        if(tagClass not in invertedArticleElementsDict): 
                            invertedArticleElementsDict[tagClass] = {element.tagClass: [element, classElement] for classElement, element in articleElementsDict[tagClass].items() if element is not None}

                        currentInvertedArticleElements = invertedArticleElementsDict[tagClass]
                        currentArticleElements = {}
    
                self.index = endIndex+1
            else:
                if(isEndTag(tag)):
                    if(startIndex != self.index and self.hasText[-1]):
                        self.parents[-1].content = html[self.index:startIndex]

                    self.index = endIndex+1
                    self.hasText.pop()
                        
                    if(len(self.parents) == 1):
                        getDiv = False
                        currentArticleElements[ArticleItems.CODE] = calculate_article_code(currentArticleElements)
                        classNodes[self.parents[0].tagClass].append(currentArticleElements)
                    else:
                        node = self.parents[-1]
                        elementArray = currentInvertedArticleElements.get(node.tagClass, None)
                        if(elementArray is not None and elementArray[0].tag == node.tag):
                            node.compact()
                            currentArticleElements[elementArray[1]] = node
                            if(node.link is None): node.link = aLink if aLink != "" else None

                    if(tag == "/a"): aLink = ""
                    
                    self.parents.pop()
                else:
                    self.index = endIndex+1

                    if(tag in self.desirableTags):
                        tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
                        self.hasText[-1] = False
                        
                        if(tag in unaryTags):
                            if(tag == "img"):
                                img = self._get_img(html, startIndex, endIndex)
                                if(img.link is None): img.link = aLink if aLink != "" else None

                                elementArray = currentInvertedArticleElements.get(tagClass, None)
                                if(elementArray is not None and elementArray[0].tag == "img"): currentArticleElements[elementArray[1]] = img
                                else: self.parents[-1].addChild(img)
                        else:
                            self.hasText.append(True)

                            if(tag in getTags):
                                node = SimpleDivNode(tagClass)
                            else:
                                node = SimpleTagNode(tag, tagClass)
                                if(tag == "a"): 
                                    node.link = get_until_if_exists(html, '"', index_after(html, 'href="', startIndex, endIndex), endIndex)
                                    if(node.link is not None): aLink = node.link[:]
                            
                            self.parents[-1].addChild(node)
                            self.parents.append(node)

                            # if(tag == "picture"):
                            #     self._add_img_from_picture(html)
                            #     self.index = html.find("</picture>", self.index)
                    else: self._parseNonUsefulTag(html, tag)

        return classNodes


    def _get_img(self, html, startIndex, endIndex):
        tagClass = get_until_if_exists(html, '"', index_after(html, 'class="', startIndex, endIndex), endIndex)
        src = get_until_if_exists(html, '"', index_after(html, 'src="', startIndex, endIndex), endIndex)
        self.index = endIndex+1

        if(not isLinkValid(src)):
            noscriptStart = html.find("<noscript", endIndex, endIndex+self.noscriptOffset)
            if(noscriptStart != -1):
                noscriptEnd = html.find("</noscript", noscriptStart)
                imgStart = html.find("<img", noscriptStart, noscriptEnd)
                if(imgStart != -1):
                    imgEnd = html.find(">", imgStart, noscriptEnd)
                    src = get_until_if_exists(html, '"', index_after(html, 'src="', imgStart, imgEnd), imgEnd)

                self.index = index_after(html, ">", noscriptEnd, noscriptEnd+20)

        return SimpleUnaryTagNode("img", tagClass, src)


    def _add_img_from_picture(self, html):
        imgStart = index_after(html, "<img", self.index, self.endHtml)
        if(imgStart != -1):
            imgEnd = html.find(">", imgStart)
            self.parents[-1].addChild(self._get_img(html, imgStart, imgEnd))
    
    def _parseNonUsefulTag(self, html, tag):
        endTag = index_after(html, "</"+tag+">", self.index, self.endHtml)

        if(endTag != -1):
            numPossibleTags = self._numAllPossibleTags(html, tag, self.index, endTag)

            while(numPossibleTags != 0):
                index = endTag
                for _ in range(numPossibleTags):
                    endTag = index_after(html, "</"+tag+">", endTag, self.endHtml)
                    if(endTag == -1): break

                numPossibleTags = self._numAllPossibleTags(html, tag, index, endTag)

            self.index = endTag

    def _numAllPossibleTags(self, html, tag, start, end):
        numPossibleTags = 0
        indexPossibleTag = html.find("<"+tag, start, end)

        while(indexPossibleTag != -1 and indexPossibleTag<end):
            numPossibleTags += 1
            indexPossibleTag = html.find("<"+tag, index_after(html, ">", indexPossibleTag, end), end)
        
        return numPossibleTags






