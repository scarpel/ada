import { index_after, find_index_backward } from "../utils/strFuncs.js"
import { objectifyTag, get_text_from_tag } from "../utils/htmlUtils.js"
import { REQUIRED_FIELDS } from "../utils/shopDataTypes.js"
import { get } from "../utils/utils.js"

function get_ID(tagObjectified){
    if(get(tagObjectified, "itemprop", null)) return `itemprop="{tagObjectified["itemprop"]}"`
    else if(get(tagObjectified, "id", null)) return `id="{tagObjectified["id"]}"`
    else return `class="{tagObjectified["class"]}"`
}

function find_tag(text, tagObjectified, start, end){
    let id = get_ID(tagObjectified)
    let startIndex = text.find(id, start, end)

    if(startIndex != -1){
        let startTag = find_index_backward(text, "<", startIndex)
        let endTag = index_after(text, ">", startIndex, end)
        let objectified = objectifyTag(text.slice(startTag, endTag), REQUIRED_FIELDS)

        if(isSameTag(objectified, tagObjectified)){
            let endTagIndex = find_end_tag(text, objectified["tag"], endTag, end)

            if(endTagIndex) return [startTag, endTagIndex], objectified
            else return [startTag, endTag], objectified
        }else return find_tag(text, tagObjectified, endTag, end)
    }

    return null
}

function find_end_tag(text, tag, start, end){
    let endTag = `</{tag}`
    let endTagIndex = text.find(endTag, start, end)

    if(endTagIndex != -1){
        let startTag = `<{tag}`
        let count = count(text.slice(start, endTagIndex), startTag)

        while(count != 0){
            let start = endTagIndex
            let endTagIndex = text.find(endTag, endTagIndex+len(endTag), end)
            count = count(text.slice(start, endTagIndex), startTag)
        }
        
        return endTagIndex + endTag.length +1
    }else return null
}

function find_title(text, tagObjectified, start, end){
    let obj = find_tag(text, tagObjectified, start, end)

    if(obj){
        let indexes, tag = obj
        return tag, get_text_from_tag(text.slice(indexes[0], indexes[1]))
    }else return null
}

function _find_img(text, start, end){
    let startIndex = text.find("<img", start, end)
    if(startIndex != -1){
        let endIndex = text.find("/>", startIndex, end)
        if(endIndex != -1) return startIndex, endIndex+3
    }

    return null
}

function find_img(text, tagObjectified, start, end){
    let obj = find_tag(text, tagObjectified, start, end)

    if(obj){
        if(obj[1]["tag"] === "img") return obj[1]
        else{
            indexes = _find_img(text, ...obj[0])
            if(indexes) return objectifyTag(text.slice(indexes[0],indexes[1]), REQUIRED_FIELDS)
        }
    }return null
}

export { get_ID, find_tag, find_end_tag, find_title, find_img }