from Utils.dataTypes import InterpreterEnvironment
from htmlTreeStructure import Node

class HTMLInterpreter:
    def __init__(self, minNumOccurences=4, minTagsForAcceptance=4, maxTagsForAcceptance=11):
        self.minNumOccurences = minNumOccurences
        self.minTagsForAcceptance = minTagsForAcceptance
        self.maxTagsForAcceptance = maxTagsForAcceptance

    def interpret(self, HTMLNode):
        if(HTMLNode is None): return InterpreterEnvironment()
        else:
            interpreterEnvironment = InterpreterEnvironment(self.minTagsForAcceptance, self.minNumOccurences, self.maxTagsForAcceptance)
            HTMLNode.evaluate(interpreterEnvironment, interpreterEnvironment.tagCounter)
            interpreterEnvironment.checkArticleClasses()
            return interpreterEnvironment
        
    def isNewsPage(self, HTMLNode):
        return True if len(self.interpret(HTMLNode).articleClasses)>0 else False
    
    def isArticlePage(self, HTMLNode):
        return True if len(self.interpret(HTMLNode).articleClasses)==0 else False