import { InterpreterEnvironment } from "../utils/dataTypes.js"

class ArticleHTMLInterpreter{
    constructor(minNumOccurences=4, minTagsForAcceptance=4, maxTagsForAcceptance=25, decisionTree=getNewsDecisionTree(), acceptancePercentage=0.6){
        this.minNumOccurences = minNumOccurences
        this.minTagsForAcceptance = minTagsForAcceptance
        this.maxTagsForAcceptance = maxTagsForAcceptance
        this.decisionTree = decisionTree
        this.acceptancePercentage = acceptancePercentage
    }

    interpret = (HTMLNode) => {
        if(!HTMLNode) return new InterpreterEnvironment()
        else{
            let interpreterEnvironment = new InterpreterEnvironment(this.minTagsForAcceptance, this.minNumOccurences, this.maxTagsForAcceptance, this.decisionTree, this.acceptancePercentage)
            HTMLNode.evaluate(interpreterEnvironment, interpreterEnvironment.tagCounter)
            // interpreterEnvironment.checkArticleClasses()
            console.log(interpreterEnvironment)
            return interpreterEnvironment
        }
    }
        
    isNewsPage = (HTMLNode) => this.interpret(HTMLNode).articleClasses.length>0? true: false
    
    isArticlePage = (HTMLNode) => this.interpret(HTMLNode).articleClasses.length === 0? true: false
}

export default ArticleHTMLInterpreter