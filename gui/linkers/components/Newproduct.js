import { convert_price_from_db } from "../modules/utils/priceFuncs.js"
import { getDecimalPlaces } from "../modules/consts/decimalPlaces.js"
import { createElement } from "../modules/utils/htmlUtils.js"

export default function ProductCard(product, imgSrc, faviconSrc, websiteName, goToProduct, deleteFunc=(()=>{})){
    let id = product.id

    let base = createElement("div", "product-card", `${id}`)

    let left = createElement("div", "product-card-left")

    let productImg = createElement("img", "product-img", `${id}-img`)
    productImg.src = imgSrc

    left.appendChild(productImg)

    let right = createElement("div", "product-card-right")

    let deleteBtn = createElement("button", "product-card-delete", `${id}-delete-btn`)
    deleteBtn.innerText = "x"
    deleteBtn.onclick = deleteFunc

    right.appendChild(deleteBtn)

    let rightContainer = document.createElement("div", "right-container")

    right.appendChild(rightContainer)

    let websiteInfo = document.createElement("a", "website-info")
    websiteName.href = product.url

    rightContainer.appendChild(websiteInfo)

    let favicon = document.createElement("img", "product-card-favicon", `${id}-favicon`)
    favicon.src = faviconSrc

    let websiteNameElement = document.createElement('span', "product-card-website", `${id}-website`)
    websiteNameElement.innerText = websiteName

    websiteInfo.appendChild(favicon)
    websiteInfo.appendChild(websiteNameElement)
    rightContainer.appendChild(websiteInfo)

    let name = document.createElement("h1", "product-card-name", `${id}-name`)
    name.innerText = product.name

    let priceContainer = document.createElement("div", "price-info")
    
    let price = document.createElement("span", "product-card-price", `${id}-price`)
    price.innerText = `${product.price.currency}${convert_price_from_db(product.price.currency, product.price.value).toFixed(getDecimalPlaces(product.price.currency))}`

    priceContainer.appendChild(price)

    let productBtn = document.createElement("button", "product-card-button", `${id}-button`)
    productBtn.innerText = "See Product"
    productBtn.onclick = goToProduct

    rightContainer.appendChild(name)
    rightContainer.appendChild(priceContainer)
    rightContainer.appendChild(productBtn)

    return base
}