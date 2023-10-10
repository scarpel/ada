import NewNewsWebsite from "./NewNewsWebsite.js"
import CustomRoundCheckbox from "./CustomRoundCheckbox.js"

export default function UnknownNewsWebsite(gatheredInfo, websiteID=null, checkedCallback=() => {}, ){
    if(websiteID !== null) websiteID = `${websiteID}-unknown`
    
    let base = document.createElement("div")
    base.className = "unknown-website-info"
    
    let right = document.createElement("div")
    right.className = "website-info-right"
    right.append(NewNewsWebsite(gatheredInfo, websiteID))
    
    let left = document.createElement("div")
    left.className = "website-info-left"
    left.append(
        CustomRoundCheckbox(websiteID, (e) => {
            let checked = e.target.checked
            right.classList.toggle("enabled", checked); 
            base.classList.toggle("selected", checked);
            checkedCallback(checked);
        })
    )

    base.append(left)
    base.append(right)

    return base
}