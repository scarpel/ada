import CustomCheckbox from "./CustomCheckbox.js"
import { NEWS_FAVICONS } from "../modules/consts/paths.js"
import { get_favicon_src } from "../modules/utils/utils.js"

export default function NewNewsWebsite(gatheredInfo, websiteID=null, checkedCallback=() => {}){
    let [categories, _, newsInfo] = gatheredInfo

    categories = Object.values(categories)
    let categoriesLength = categories.length

    let base = document.createElement("div")
    base.className = "website-info"

    let top = document.createElement("div")
    top.className = "website-info-top"

    let name = document.createElement("h2")
    name.className = "website-name"
    name.innerText = newsInfo.name

    let icon = document.createElement("img")
    icon.className = "website-favicon"
    icon.src = newsInfo.id? get_favicon_src(newsInfo.id, NEWS_FAVICONS) : newsInfo.faviconUrl

    top.append(icon)
    top.append(name)

    let bottom = document.createElement("div")
    bottom.className = "website-info-bottom"

    let categoriesDiv = document.createElement("div")
    categoriesDiv.className = "website-categories"

    if(categoriesLength>0){
        if(websiteID !== null) categoriesDiv.id = `${websiteID}-categories`

        for(let i=0; i<categoriesLength; i++){
            let category = categories[i]
            console.log(category)
            categoriesDiv.append(new CustomCheckbox(category.name, null, null, checkedCallback))
        }
    }else{
        let text = document.createElement("p")
        text.className = "no-categories"
        text.innerText = "No categorires found"

        categoriesDiv.append(text)
    }

    bottom.append(categoriesDiv)
    base.append(top)
    base.append(bottom)

    return base
}