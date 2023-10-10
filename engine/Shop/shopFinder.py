from Utils.strFuncs import get_all_after_until, get_all_before_until, index_after, find_index_backward
from Utils.htmlUtils import objectifyTag, get_text_from_tag
from Utils.shopDataTypes import REQUIRED_FIELDS

def get_ID(tagObjectified):
    if(tagObjectified.get("itemprop", None)): return f'itemprop="{tagObjectified["itemprop"]}"'
    elif(tagObjectified.get("id", None)): return f'id="{tagObjectified["id"]}"'
    else: return f'class="{tagObjectified["class"]}"'

def find_tag(text, tagObjectified, start, end):
    id = get_ID(tagObjectified)
    startIndex = text.find(id, start, end)

    if(startIndex != -1):
        startTag = find_index_backward(text, "<", startIndex)
        endTag = index_after(text, ">", startIndex, end)
        objectified = objectifyTag(text[startTag:endTag], REQUIRED_FIELDS)

        if(objectified["tag"] == tagObjectified["tag"] 
            and objectified.get("itemprop", None) == tagObjectified.get("itemprop", None) 
            and objectified.get("id", None) == tagObjectified.get("id", None) 
            and objectified.get("class", None) == tagObjectified.get("class", None)):

            endTagIndex = find_end_tag(text, objectified["tag"], endTag, end)

            if(endTagIndex is not None): return [startTag, endTagIndex], objectified
            else: return [startTag, endTag], objectified

        else: return find_tag(text, tagObjectified, endTag, end)
    return None

def find_end_tag(text, tag, start, end):
    endTag = f"</{tag}"
    endTagIndex = text.find(endTag, start, end)

    if(endTagIndex != -1):
        startTag = f"<{tag}"
        count = text.count(startTag, start, endTagIndex)

        while(count != 0):
            start = endTagIndex
            endTagIndex = text.find(endTag, endTagIndex+len(endTag), end)
            count = text.count(startTag, start, endTagIndex)
        
        return endTagIndex + len(endTag) +1
    else: return None

def find_title(text, tagObjectified, start, end):
    obj = find_tag(text, tagObjectified, start, end)

    if(obj): 
        indexes, tag = obj
        return tag, get_text_from_tag(text[indexes[0]:indexes[1]])
    else: return None

def _find_img(text, start, end):
    startIndex = text.find("<img", start, end)
    if(startIndex != -1):
        endIndex = text.find("/>", startIndex, end)
        if(endIndex != -1): return startIndex, endIndex+3
    
    return None

def find_img(text, tagObjectified, start, end):
    obj = find_tag(text, tagObjectified, start, end)
    if(obj): 
        if(obj[1]["tag"] == "img"): return obj[1]
        else:
            indexes = _find_img(text, *obj[0])
            if(indexes): return objectifyTag(text[indexes[0]:indexes[1]], REQUIRED_FIELDS)
    return {}