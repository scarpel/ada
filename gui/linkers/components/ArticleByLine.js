import { createElement, createCustomA, createSimpleCustomA } from "../modules/utils/htmlUtils.js"

export default function ArticleByLine(authorNodes, elementClass="article-byline", elemenetID=undefined, onclickFunction=()=>{}){
    let length = authorNodes.length

    if(length === 0) return null
    else{
        let base = createElement("span", elementClass, elemenetID)
        base.append(document.createTextNode("By "))
        let node = authorNodes[0]

        base.append(createA(node, onclickFunction))

        if(length>1){
            for(let i=1; i<length-1; i++){
                let node = authorNodes[i]
                base.append(document.createTextNode(", "))
                base.append(createA(node, onclickFunction))
            }

            base.append(document.createTextNode(" and "))
            base.append(createA(authorNodes[length-1], onclickFunction))
        }

        return base
    }
}

function createA(node, onclickFunction){
   let a = createSimpleCustomA(() => {onclickFunction(node.link)})
   a.innerText = node.content
   return a
}