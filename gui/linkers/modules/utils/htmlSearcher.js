function sequential_html_search(htmls, newsUrlInfo, minNumOccurences){
    let articleClasses = Object.keys(newsUrlInfo.articlesInfo)
    let length = articleClasses.length

    return htmls.map(html => search_html(html, articleClasses, length, minNumOccurences))
}

function search_html(html, articleClasses, articleClassesLength = null, minNumOccurences=2){
    if(html){
        if(!articleClassesLength) articleClassesLength = articleClasses.length
        
        for(let i=0; i<articleClassesLength; i++){
            let matches = html.match(new RegExp(`"${articleClasses[i]}"`, "g"))

            if(matches && matches.length >= minNumOccurences) return true
        }
    }

    return false
}

export {sequential_html_search, search_html}