from Utils.utils import gimmeRandom
from Utils.dataTypes import Counter, ArticleItems, LabeledObject, createArticleElementsTable
from Utils.utils import sumArticleElementsTableCode, isLinkValid
from math import ceil
from htmlTreeStructure import SimpleNode

class ArticlePredictor:
    def __init__(self):
        self.titleTagScore = {'h':10, 's':2, 'd':3, 'a':3, 'p':-1}
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

    def separate(self, node, parents):
        self._separate(node, set(), parents)

        return self.img, self.texts

    def _separate(self, node, tagClassSet, parents):
        if(node.isLeaf()):
            if(node.content is not None):
                parent = self.last[-1]

                if((node.tagClass in tagClassSet or node.tagClass in {"", None}) and len(parent.getChildren()) == 1 and node.tag != "img"):
                    parent.compact()
                    self.texts.append(parent)
                    parents[parent.tagClass] = self.hashNode(parent)
                else:
                    if(self.link is not None):
                            node.link = self.link
                            self.link = None

                    if(node.tag == "img"):
                        if(node.tagClass is None or node.tagClass == ""): self.img = self.last[-1]
                        else: self.img = node
                        
                        self.imgLink = node.link
                    else:
                        parents[node.tagClass] = self.hashNode(parent)
                        self.texts.append(node)

                tagClassSet.add(node.tagClass)
        else:
            tagClassSet.add(node.tagClass)

            if(node.tag == "a"):
                self.link = node.link
            
            self.last.append(node)

            for child in node.getChildren():
                self._separate(child, tagClassSet, parents)

            self.last.pop()


    def predict(self, node, parents=dict()):
        self._reset()
        self.separate(node, parents)

        if(self.img is not None and (self.imgLink is None or not isLinkValid(self.img.content))):
            return None, None, None, None

        titleIndex, title = self._predict(self.texts, self.titleTagScore, self._titleExtraFunc)
        if(titleIndex != -1):

            _, header = self._predict(self.texts[0:titleIndex], self.headerTagScore, self._headerExtraFunc)
            _, description = self._predict(self.texts[titleIndex+1:], self.descriptionTagScore, self._descriptionExtraFunc)

            return self.img, header, title, description
        else: return None, None, None, None
    

    def predictFromNodes(self, nodes, randomFactor=1):
        length = len(nodes)
        indexes = gimmeRandom(ceil(length*(randomFactor if length>10 else 1)), 0, length)
        imgs = Counter()
        headers = Counter()
        titles = Counter()
        descriptions = Counter()
        parents = dict()
        
        for index in indexes:
            img, header, title, description = self.predict(nodes[index], parents)
            imgs.add(self.hashNode(img))
            headers.add(self.hashNode(header))
            titles.add(self.hashNode(title))
            descriptions.add(self.hashNode(description))

        if(self.verify_imgs_table(imgs)):
            headers = self.verify_table(headers, parents)
            titles = self.verify_table(titles, parents)
            descriptions = self.verify_table(descriptions, parents)
        
            return createArticleElementsTable(self.createNode(imgs.getKeyWithHigherValue()), 
                self.createNode(headers.getKeyWithHigherValue()), self.createNode(titles.getKeyWithHigherValue()),
                self.createNode(descriptions.getKeyWithHigherValue()))
        else: return createArticleElementsTable(None, None, None, None)

    def verify_imgs_table(self, imgTable):
        keys = imgTable.keys()

        if(len(keys) == 1 and list(keys)[0] is None): return False
        else: return True

    def verify_table(self, table, parents):
        if(len(table.keys())>1):
            table.pop(None, None)
            return self.evaluate_parents_of_table(table, parents)
        else: return table
    
    def evaluate_parents_of_table(self, table, parents):
        if(len(table.keys()) == 1): return table

        newTable = Counter()

        for tagClass in table.keys():
            parent = parents[tagClass[tagClass.find(".")+1:]]
            if(parent not in newTable and len(newTable.keys())==1): return table
            else: newTable.add(parent)
        
        return newTable

    def hashNode(self, node):
        if(node is None): return None
        else: return f"{node.tag}.{node.tagClass}"
    
    def createNode(self, hashNode):
        if(hashNode is None): return None
        else:
            dot = hashNode.find(".")
            return SimpleNode(hashNode[:dot], hashNode[dot+1:])

    def predictFromClasses(self, classes, randomFactor=1):
        labeledClasses = {}

        for nodeClass, nodes in classes.items():
            labeledClasses[nodeClass] = self.predictFromNodes(nodes, randomFactor)

        return {divClass: table for divClass, table in labeledClasses.items() if sumArticleElementsTableCode(table)>1}


    def _assessTag(self, tag, scores):
        return scores.get(tag[0], 0) + self._assessHTag(tag)

    def _assessHTag(self, tag):
        return (10 - int(tag[1])) if tag[0] == "h" else 0

    def _titleExtraFunc(self, node):
        if(self.img is not None):
            sum = 2 if (node.link is not None and node.link == self.imgLink) else -10
        else: sum = 2 if (node.link is not None and isLinkValid(node.link)) else -10

        return sum + (-10 if node.tagClass is None or node.tagClass == "" else 0)
    
    def _headerExtraFunc(self, node):
        return (0 if node.link is None or node.link != self.imgLink else -2) + (-2 if node.tagClass == "" or node.tagClass is None else 0)

    def _descriptionExtraFunc(self, node):
        return (2 if node.link is None else -3) + (1 if len(node.content.strip())>self.minLenDesc else -10)

    def _predict(self, texts, scoresTable, extraFunc):
        node = None
        nodeScore = 0  
        nodeIndex = -1

        for index, text in enumerate(texts, start=0):
            if(len(text.content)>5):
                score = self._assessTag(text.tag, scoresTable) + extraFunc(text)

                if(score>nodeScore):
                    node = text
                    nodeScore = score
                    nodeIndex = index
                
        return nodeIndex, node

        

        



