from Utils.dataTypes import createElementsTable

titleTagScore = {'h':10, 's':2, 'd':3, 'p':-1}
headerTagScore = {'h':10, 's':3, 'd':3, 'p':-1}
descriptionTagScore = {'h':0, 's':0, 'd':3, 'p':3}
minLenDesc = 25
link = None
last = []
img = None
imgLink = None
texts = []

class ArticlePredictor:
    def __init__(self):
        self.titleTagScore = {'h':10, 's':2, 'd':3, 'p':-1}
        self.headerTagScore = {'h':10, 's':3, 'd':3, 'p':-1}
        self.descriptionTagScore = {'h':0, 's':0, 'd':3, 'p':3}
        self.minLenDesc = 25
        self._reset()

    def _reset(self):
        self.link = None
        self.last = []
        self.img = None
        self.imgLink = None
        self.texts = []

    def separate(self, node):
        self._separate(node)

        return self.img, self.texts

    def _separate(self, node):
        if(node.isLeaf()):
            if(node.content is not None):
                if(node.tag == "a"):
                    lastNode = self.last[-1]
                    if(node.tagClass != ""): lastNode.tagClass = node.tagClass
                    lastNode.content = node.content
                    lastNode.link = node.link
                    self.texts.append(lastNode)
                else:
                    if(self.link is not None):
                        node.link = self.link
                        self.link = None

                    if(node.tag == "img"):
                        if(node.tagClass == "" or node.tagClass is None):
                            node.tagClass = self.last[-1].tagClass
                        
                        self.img = node
                        self.imgLink = node.link
                    else: 
                        self.texts.append(node)
        else:
            if(node.tag == "a"):
                self.link = node.link
            
            self.last.append(node)

            for child in node.getChildren():
                self._separate(child)

            self.last.pop()

    def predict(self, node):
        self._reset()
        self.separate(node)

        titleIndex, title = self._predict(self.texts, self.titleTagScore, self._titleExtraFunc)
        _, header = self._predict(self.texts[0:titleIndex], self.headerTagScore, self._headerExtraFunc)
        _, description = self._predict(self.texts[titleIndex+1:], self.descriptionTagScore, self._descriptionExtraFunc)

        return createElementsTable(self.img, header, title, description)
    
    def _assessTag(self, tag, scores):
        return scores.get(tag[0], 0) + self._assessHTag(tag)

    def _assessHTag(self, tag):
        return (10 - int(tag[1])) if tag[0] == "h" else 0

    def _titleExtraFunc(self, node):
        return 2 if (node.link is not None and node.link == self.imgLink) else -2
    
    def _headerExtraFunc(self, node):
        return 2 if node.link is None or node.link != self.imgLink else -2

    def _descriptionExtraFunc(self, node):
        return (2 if node.link is None else -3) + (1 if len(node.content.strip())>self.minLenDesc else -2)

    def _predict(self, texts, scoresTable, extraFunc):
        node = None
        nodeScore = 0  
        nodeIndex = -1

        for index, text in enumerate(texts, start=0):
            score = self._assessTag(text.tag, scoresTable) + extraFunc(text)
            if(score>nodeScore):
                node = text
                nodeScore = score
                nodeIndex = index
        
        return nodeIndex, node
