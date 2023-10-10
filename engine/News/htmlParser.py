from htmlTreeStructure import DivNode, TagNode, UnaryTagNode
from Exceptions.htmlExceptions import InvalidHTML
from Utils.strFuncs import index_after, get_until, get_until_if_exists, find_and_go_after, get_body_or_main, get_start_end_tag, get_tag_until
from Utils.utils import  isEndTag
from Utils.dataTypes import Counter

defaultDesirableTags = {"div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "br", "source"}
unaryTags = {"img", "text", "br", "hr"}

class HTMLParser:
    def __init__(self, desirableTags=None):
        self.desirableTags = desirableTags if desirableTags else defaultDesirableTags

    def _cleanVariables(self):
        self.parents = [DivNode("main")]
        self.tags = []
        self.index = 0
        self.hasText = [True]

    def parse(self, rawHtml):
        if(rawHtml is None): return None
        
        self._cleanVariables()
        self.html = get_body_or_main(rawHtml).replace("\n", "").replace("\t"," ").replace("\r","")
        self.endHtml = len(self.html)
    
        self._obtainTagArray()
        self._parseTags()
        return self.parents[-1]

    def _isValidTag(self, tag):
        if(tag[0] not in {"!", "?"}): return True
        else: return False

    def _parseNonUsefulTag(self, tag):
        self.hasText[-1] = False
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
        indexPossibleTag = self.html.find("<"+tag, start, end)

        while(indexPossibleTag != -1 and indexPossibleTag<end):
            if(self._elegiblePossibleTag(indexPossibleTag)):
                numPossibleTags += 1
            indexPossibleTag = self.html.find("<"+tag, index_after(self.html, ">", indexPossibleTag, end), end)
        
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

    def _obtainTagArray(self):
        containerTags = {"div", "li"}
        
        while(self.index<self.endHtml):
            startTag = index_after(self.html, "<", self.index, self.endHtml)
            endTag = self.html.find(">", startTag, self.endHtml)
            tag = get_until(self.html, " ", startTag, endTag)

            if(isEndTag(tag)):
                tagWithoutSlash = tag[1:]
                
                if(tagWithoutSlash in self.desirableTags):
                    if(tagWithoutSlash in containerTags and self.hasText[-1] and self.index+1 != startTag): 
                        self.tags.append("text")
                
                    self.hasText.pop()
                    self.tags.append(tag)

                self.index = endTag+1
            else:
                self.index = endTag+1

                if(tag in self.desirableTags):
                    self.hasText[-1] = False
                    self.hasText.append(True)

                    if(tag in containerTags):
                        tagClass = get_until_if_exists(self.html, '"', index_after(self.html, 'class="', startTag, endTag), endTag)
                        self.tags.append(tagClass)
                    elif(self._isValidTag(tag)): self.tags.append(tag)
                else:
                    tag = tag.strip()
                    if(self.html[endTag-1] != "/" and self.html[startTag] != "!"): self._parseNonUsefulTag(tag)
                    else: self.index = endTag+1
        
    def _parseTags(self):
        for tag in self.tags:
            if(isEndTag(tag)):
                if(len(self.parents)>1): self.parents[-2].addChild(self.parents[-1])
                else: return  

                self.parents.pop()
            else:
                if(tag in unaryTags):
                    self.parents[-1].addChild(UnaryTagNode(tag))
                else: 
                    if(tag in self.desirableTags):
                        self.parents.append(TagNode(tag))
                    else:
                        self.parents.append(DivNode(tag))



            
            
