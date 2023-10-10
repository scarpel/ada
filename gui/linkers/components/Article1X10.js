import { createElement, createSimpleCustomA, createImg } from "../modules/utils/htmlUtils.js"
import { ArticleItems } from "../modules/utils/dataTypes.js"
import ArticleByLine from "./ArticleByLine.js"
import { NEWS_FAVICONS } from "../modules/consts/paths.js"

export default function Article1X10(node, id=undefined, onClickFunction=() => {}){
    let base = createElement("div", "article-1x10", id)
    let func = (event) => {onClickFunction(node[ArticleItems.LINK], event); base.classList.add("read")}

    let imgLink = createSimpleCustomA(func)
    imgLink.append(createImg("article-1x10-img", node[ArticleItems.IMG].content))
    base.append(imgLink)

    let newsInfo = node[ArticleItems.NEWS_INFO]
    let faviconA = createSimpleCustomA((event) => {onClickFunction(newsInfo.url, event)})
    faviconA.className = "article-1x10-favicon"
    let favicon = createElement("img")
    favicon.src = path_join(NEWS_FAVICONS, `${newsInfo.id}.ico`)
    faviconA.append(favicon)

    base.append(faviconA)
    
    let info = createElement("div", "article-1x10-info")

    if(node[ArticleItems.HEADER]){
        let headerNode = node[ArticleItems.HEADER]
        let header

        if(headerNode.link){
            header = createSimpleCustomA((event) => {onClickFunction(headerNode.link, event)})
            header.className = "article-1x10-header"
        }else header = createElement("span", "article-1x10-header")

        header.innerText = headerNode.content
        info.append(header)
    }

    let titleLink = createSimpleCustomA(func)
    titleLink.className = "article-1x10-title-a"
    let title = createElement("h1", "article-1x10-title")
    title.innerText = node[ArticleItems.TITLE].content
    titleLink.append(title)
    info.append(titleLink)

    if(node[ArticleItems.AUTHOR]){
        info.append(ArticleByLine(node[ArticleItems.AUTHOR], "article-1x10-byline", null, onClickFunction))
    }

    base.append(info)

    return base
}