import { createElement, createSimpleCustomA, createImg } from "../modules/utils/htmlUtils.js"
import { ArticleItems } from "../modules/utils/dataTypes.js"
import ArticleByLine from "./ArticleByLine.js"
import { NEWS_FAVICONS } from "../modules/consts/paths.js"

export default function ArticleXX1X(node, id=undefined, onClickFunction=() => {}){
    let base = createElement("div", "article-xx1x", id)
    let func = (event) => {onClickFunction(node[ArticleItems.LINK], event); base.classList.add("read")}

    let meta = createElement("div", "article-xx1x-meta")

    if(node[ArticleItems.IMG]){
        let imgLink = createSimpleCustomA(func)
        imgLink.append(createImg("article-xx1x-img", node[ArticleItems.IMG].content))
        meta.append(imgLink)
    }else base.classList.add("no-img")

    let newsInfo = node[ArticleItems.NEWS_INFO]
    let faviconA = createSimpleCustomA((event) => {onClickFunction(newsInfo.url, event)})
    faviconA.className = "article-xx1x-favicon-a"
    let favicon = createElement("img", "article-xx1x-favicon")
    favicon.src = path_join(NEWS_FAVICONS, `${newsInfo.id}.ico`)
    faviconA.append(favicon)

    meta.append(faviconA)

    base.append(meta)

    let info = createElement("div", "article-xx1x-info")

    if(node[ArticleItems.HEADER]){
        let headerNode = node[ArticleItems.HEADER]
        let header

        if(headerNode.link){
            header = createSimpleCustomA((event) => {onClickFunction(headerNode.link, event)})
            header.className = "article-xx1x-header"
        }else header = createElement("h3", "article-xx1x-header")

        header.innerText = headerNode.content
        info.append(header)

    }else base.classList.add("no-header")

    let titleLink = createSimpleCustomA(func)
    let title = createElement("h1", "article-xx1x-title")
    title.innerText = node[ArticleItems.TITLE].content
    titleLink.append(title)
    info.append(titleLink) 

    if(node[ArticleItems.DESCRIPTION]){
        let desc = createElement("p", "article-xx1x-desc")
        desc.innerText = node[ArticleItems.DESCRIPTION].content
        info.append(desc)
    }

    if(node[ArticleItems.AUTHOR]){
        info.append(ArticleByLine(node[ArticleItems.AUTHOR], "article-xx1x-byline", null, onClickFunction))
    }

    base.append(info)

    return base
}