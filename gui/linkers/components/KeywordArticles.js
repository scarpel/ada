import { createElement } from "../modules/utils/htmlUtils.js";
import Article1X10 from "./Article1X10.js";
import ArticleXX1X from "./ArticleXX1X.js";

export default function KeywordArticles(keyword, articles_by_code, onclickFunction){
    let base = createElement("div", "keyword-articles", `kw-${keyword}`)

    let title = createElement("h1", "keyword-articles-title")
    title.innerText = keyword
    base.append(title)

    let articles = articles_by_code["1x10"]
    if(articles){
        let baseArticles = createElement("div", "articles-1x10")
        getArticles(articles, Article1X10, baseArticles, onclickFunction)
        base.append(baseArticles)
    }

    articles = articles_by_code["xx1x"]
    if(articles){
        let baseArticles = createElement("div", "articles-xx1x")
        getArticles(articles, ArticleXX1X, baseArticles, onclickFunction)
        base.append(baseArticles)
    }

    return base
}

function getArticles(articles, articleComponent, base, onclickFunction){
    let length = articles.length

    for(let i=0; i<length; i++){
        base.append(articleComponent(articles[i], null, onclickFunction))
    }
}