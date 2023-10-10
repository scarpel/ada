import { convert_price_from_db } from "../modules/utils/priceFuncs.js"
import { getDecimalPlaces } from "../modules/consts/decimalPlaces.js"
import { createElement } from "../modules/utils/htmlUtils.js"

export default function ProductCard(product, imgSrc, faviconSrc, websiteName, goToProduct, deleteFunc=(()=>{}), openInBrowserFunc=()=>{}){
    let id = product.id

    let base = createElement("div", "product-card", id)

    let left = createElement("div", "left")

    let productImg = createElement("img", "product-img", `${id}-img`)
    productImg.src = imgSrc

    left.appendChild(productImg)

    let right = createElement("div", "right")

    let deleteBtn = createElement("button", "product-card-delete", `${id}-delete-btn`)
    deleteBtn.innerHTML = "&times;"
    deleteBtn.onclick = deleteFunc

    right.appendChild(deleteBtn)

    let rightContainer = createElement("div", "right-container")

    right.appendChild(rightContainer)

    let websiteInfo = createElement("div", "website-info")

    rightContainer.appendChild(websiteInfo)

    let favicon = createElement("img", "product-card-favicon", `${id}-favicon`)
    favicon.src = faviconSrc

    let websiteNameElement = createElement('span', "product-card-website", `${id}-website`)
    websiteNameElement.innerText = websiteName

    websiteInfo.appendChild(favicon)
    websiteInfo.appendChild(websiteNameElement)
    rightContainer.appendChild(websiteInfo)

    let aName = createElement("a")
    aName.href = "#"
    aName.onclick = (event) => { openInBrowserFunc(product.url, event) }
    
    let name = createElement("h1", "product-card-name", `${id}-name`)
    name.innerText = product.name
    aName.append(name)

    let priceContainer = createElement("div", "price-info", `${id}-price-info`)
    
    let price = createElement("span", "product-card-price", `${id}-price`)
    price.innerText = `${product.price.currency}${convert_price_from_db(product.price.currency, product.price.value).toFixed(getDecimalPlaces(product.price.currency))}`

    priceContainer.appendChild(price)

    let productBtn = createElement("button", "product-card-btn", `${id}-btn`)
    productBtn.innerText = "See Product"
    productBtn.onclick = () => {goToProduct(product.id)}

    rightContainer.appendChild(aName)
    rightContainer.appendChild(priceContainer)
    rightContainer.appendChild(productBtn)

    base.appendChild(left)
    base.appendChild(right)

    return base
}