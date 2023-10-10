import { find_index_backward } from "./strFuncs.js"
import { add_protocol } from "./websiteUtils.js"

function handle_favicon_url(mainUrl, faviconUrl){
    if(faviconUrl[0] === "/" && faviconUrl[1] !== "/")
        return `${add_protocol(mainUrl[mainUrl.length-1] !== '/'? mainUrl: mainUrl.slice(0,-1))}${faviconUrl}`
    else return add_protocol(faviconUrl)
}

function get_favicon_url(mainUrl, html){
    let favIndex = html.find("favicon")
    let url = null

    if(favIndex !== -1){
        let startFav = find_index_backward(html, '"', favIndex)
        let endFav = html.find('"', favIndex)
        url = handle_favicon_url(mainUrl, html.slice(startFav+1, endFav))
    }else url = `${add_protocol(mainUrl)}/favicon.ico`

    return url
}

export { handle_favicon_url, get_favicon_url }