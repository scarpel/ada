import { createElement } from "../modules/utils/htmlUtils.js";
import KeywordTag from "./KeywordTag.js";
import { get_favicon_src } from "../modules/utils/utils.js";
import { NEWS_FAVICONS } from "../modules/consts/paths.js";

export default function NewsWebsiteElement(newsInfo, onDeleteWebsite, onDeleteCategory){
    let base = createElement("div", "news-website-info")

    let deleteBtn = createElement("button", "news-website-delete")
    deleteBtn.innerHTML = "&times;"
    deleteBtn.onclick = () => { onDeleteWebsite(base, newsInfo) }
    base.append(deleteBtn)

    let top = createElement("div", "news-website-top")
    let favicon = createElement("img", "news-website-favicon")
    favicon.src = get_favicon_src(newsInfo.id, NEWS_FAVICONS)
    let name = createElement("h1", "news-website-name")
    name.innerText = newsInfo.name
    top.append(favicon)
    top.append(name)
    base.append(top)

    let bottom = createElement("div", "news-website-categories")
    let categories = Object.keys(newsInfo.categories)
    let length = categories.length

    for(let i=0; i<length; i++){
        let category = newsInfo.categories[categories[i]]
        bottom.append(KeywordTag(category.id, category.name, (id, _, base) => {onDeleteCategory(newsInfo, category, base)}))
    }

    base.append(bottom)
    
    return base
}