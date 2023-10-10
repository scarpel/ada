from functools import reduce
from Utils.dataTypes import ArticleTagCounter, Counter, InterpreterEnvironment

class Node:
    def __init__(self, tag, tagClass=None):
        self.tag = tag
        self.tagClass = None if tagClass == "" else tagClass

    def evaluate(self, interpreterEnvironment, articleTagCounter):
        pass

    def getTagClass(self):
        return self.tagClass
    
    def countContentTags(self):
        pass
    
    def compare(self, node):
        if(self.getTagClass == node.getTagClass and self.countContentTags == node.countContentTags):
            return True
        else: return False

    def to_s(self, start=0):
        return "%s%s%s\n" % (start*" ", self.tag, f" ({self.tagClass})" if self.tagClass is not None else "")

class NonUnaryTagNode(Node):
    def __init__(self, tag, tagClass=None):
        super().__init__(tag, tagClass)
        self.children = []
        self._containsText = None

    def addChild(self, child):
        self.children.append(child)
        self._containsText = None
    
    def numChildren(self):
        return len(self.children)
    
    def popChildren(self):
        self.children.pop()
        self._containsText = None

    def countContentTags(self):
        if(self._containsText is None):
            if(self.numChildren() == 0): return 1
            else: self._containsText = reduce((lambda x, y: x+y), [child.countContentTags() for child in self.children])

        return self._containsText
    
    def to_s(self, start=0):
        tabs = start * " "
        tagClass = f"({self.getTagClass()})" if self.getTagClass() is not None else ""
        string = f"{tabs}{self.tag} {tagClass}\n"
        if(self.numChildren()>0):
            children = "".join([child.to_s(start+1) for child in self.children])
        else:
            children = ""

        return f"{string}{children}"

class DivNode(NonUnaryTagNode):
    def __init__(self, tagClass=None):
        super().__init__("div", tagClass)
        self.children = []
        self._containsText = None
    
    def to_s(self, start=0):
        tabs = start * " "
        tagClass = f"({self.getTagClass()})" if self.getTagClass() is not None else ""
        string = f"{tabs}div {tagClass}\n"
        if(self.numChildren()>0):
            children = "".join([child.to_s(start+1) for child in self.children])
        else:
            children = ""

        return f"{string}{children}"
    
    def simple_evaluation(self, interpreterEnvironment):
        for child in self.children:
            child.simple_evaluation(interpreterEnvironment)

    def evaluate(self, interpreterEnvironment, articleTagCounter):
        if(self.tagClass in interpreterEnvironment.articleClasses):
            interpreterEnvironment.articleClasses.add(self.tagClass)
            articleTagCounter.clear()
        else:
            if(len(self.children) == 1):
                self.children[0].evaluate(interpreterEnvironment, articleTagCounter)
            else:
                newArticleCounter = ArticleTagCounter()

                for child in self.children:
                    childArticleCounter = ArticleTagCounter()
                    child.evaluate(interpreterEnvironment, childArticleCounter)
                    newArticleCounter.merge(childArticleCounter)

                if(len(newArticleCounter.keys()) == 0): newArticleCounter.add("div")

                if(newArticleCounter.verify(interpreterEnvironment.minTagsForAcceptance, interpreterEnvironment.maxTagsForAcceptance)):
                    #print(self.tagClass, newArticleCounter)
                    interpreterEnvironment.articleClasses.add(self.tagClass)
                    articleTagCounter.clear()
                else: articleTagCounter.merge(newArticleCounter)
        
class TagNode(NonUnaryTagNode):
    def __init__(self, tag):
        self.tag = tag
        self.children = []
        self._containsText = None
    
    def getTagClass(self):
        return None
    
    def evaluate(self, interpreterEnvironment, articleTagCounter):
        if (self.numChildren() == 0):
            articleTagCounter.add(self.tag)
        else:
            for child in self.children:
                child.evaluate(interpreterEnvironment, articleTagCounter)
            
            if(self.tag[0] == "h"): articleTagCounter.add(self.tag)

class UnaryTagNode(Node):
    def __init__(self, tag):
        self.tag = tag
    
    def evaluate(self, interpreterEnvironment, articleTagCounter):
        articleTagCounter.add(self.tag)

    def to_s(self, start=0):
        return "%s%s\n" % (start*" ", self.tag)

    def countContentTags(self):
        return 1

    def numChildren(self):
        return 0
    
    def addChild(self, child):
        return
    
    def popChildren(self):
        return
    
    def getTagClass(self):
        return None

class SimpleNode:
    def __init__(self, tag, tagClass=None, content=None):
        self.tag = tag
        self.tagClass = tagClass
        self.content = content
        self.link = None
    
    def count_nodes(self):
        return 1
    
    def to_s(self, start=0):
        return "%s%s%s -> %s\n" % (start*" ", self.tag, f" ({self.tagClass})" if self.tagClass is not None else "", self.content)
    
    def __repr__(self):
        return "%s (%s)" % (self.tag, self.tagClass)
    
    def getChildren(self):
        return []
    
    def isLeaf(self):
        return True
    
    def compact(self):
        return

class SimpleNonUnaryNode(SimpleNode):
    def __init__(self, tag, tagClass=None, content=None):
        super().__init__(tag, tagClass, content)
        self.children = []
    
    def addChild(self, node):
        self.children.append(node)
    
    def getChildren(self):
        return self.children
    
    def isLeaf(self):
        return (len(self.children) == 0)

    def count_nodes(self):
        sum = 1 

        for child in self.children:
            sum += child.count_nodes()
        
        return sum
    
    def compact(self):
        for child in self.children:
            child.compact()
            self.content = child.content
            self.link = child.link
        
        self.children = []
    
    def to_s(self, start=0):
        tabs = start * " "
        tagClass = f"({self.tagClass})" if self.tagClass is not None else ""
        string = f"{tabs}{self.tag} {tagClass} -> {self.content}\n"
        if(self.count_nodes()-1>0):
            children = "".join([child.to_s(start+1) for child in self.children])
        else:
            children = ""

        return f"{string}{children}"

class SimpleDivNode(SimpleNonUnaryNode):
    def __init__(self, tagClass=None, content=None):
        super().__init__("div", tagClass, content)
    
    def to_s(self, start=0):
        tabs = start * " "
        tagClass = f"({self.tagClass})" if self.tagClass is not None else ""
        string = f"{tabs}div {tagClass} -> {self.content}\n"
        if(self.count_nodes()-1>0):
            children = "".join([child.to_s(start+1) for child in self.children])
        else:
            children = ""

        return f"{string}{children}"
    

class SimpleUnaryTagNode(SimpleNode):
    pass

class SimpleTagNode(SimpleNonUnaryNode):
    pass