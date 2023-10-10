export default function WebsiteProducts(shopInfo, productsSet){
    let base = document.createElement("div")
    base.id = `website-${shopInfo.id}`
    base.className = "website"

    let h1 = document.createElement("h1")
    h1.innerText = shopInfo.name
    h1.className = "name"
    
    if(shopInfo.domain){
        let span = document.createElement("span")
        span.className = "domain"
        span.innerText = `${shopInfo.domain}`
        h1.appendChild(span)
    }

    productsSet.id = `${shopInfo.id}-products`
    productsSet.className = "products-set"

    base.appendChild(h1)
    base.appendChild(productsSet)

    return base
}