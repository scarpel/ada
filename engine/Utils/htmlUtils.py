from .consts import ESCAPE_HTML_CHARACTERS
from .strFuncs import index_after, find_and_go_after

def isEndTag(tag):
    if(len(tag)>0):
        return True if tag[0] == '/' else False
    else: return False

def get_link_from_data_dynamic(text):
    if(text and "http" in text):
        text = decode_html_text(text)
        index = text.find("http")
        end = text.find('"', index)
        if(end != -1):
            return text[index:end]
    
    return None

def objectifyTag(fullTag, requiredFields):
    spaceIndex = fullTag.find(" ")
    obj = {"tag":fullTag[1 if fullTag[0]=="<" else 0:spaceIndex]}

    while(spaceIndex != -1):
        spaceIndex += 1
        eqIndex = fullTag.find("=", spaceIndex)

        if(eqIndex != -1):
            propName = fullTag[spaceIndex:eqIndex].strip().lower()
            quote = fullTag[eqIndex+1]
            eqIndex += 2
            propEnd = fullTag.find(quote, eqIndex)

            if(propName in requiredFields): 
                text = fullTag[eqIndex:propEnd]
                if(text): obj[propName] = text

            spaceIndex = fullTag.find(" ", propEnd)
        else: spaceIndex = fullTag.find(" ", spaceIndex)
    
    return obj

def get_text_from_tag(text):
    start = text.find(">")
    texts = []
    
    while(start != -1):
        start = start + 1
        end = text.find("<", start)

        if(end != -1 and end>start): 
            t = text[start:end].strip()
            if(t): texts.append(t)
            start = text.find(">", end+1)
        else: start = text.find(">", start)
    
    return "".join(texts)

def decode_html_text(text):
    startIndex = text.find("&")

    if(startIndex != -1):
        endIndex = text.find(";", startIndex)
        if(endIndex != -1):
            endIndex += 1
            character = text[startIndex:endIndex] 
            character = ESCAPE_HTML_CHARACTERS.get(character, character)
            return "".join([text[:startIndex], character, decode_html_text(text[endIndex:])])
    
    return text

def get_body_or_main(rawHtml):
    if("<main" in rawHtml):
        start, end = get_start_end_tag(rawHtml, "main")
    else:
        start, end = get_start_end_tag(rawHtml, "body")
    
    return rawHtml[start:end].strip().replace("scr+ipt", "script")

def get_start_end_tag(html, tag, start=0):
    start = find_and_go_after(html, f"<{tag}", ">", start)
    end = html.find(f"</{tag}>", start)
    return start, end

def get_tag_content(text, tag, start, end):
    index = index_after(text, f'<{tag}', start, end)

    if(index != -1 and text[index] in {">", " "}):
        index = index_after(text, ">", index, end)
        tagEnd = text.find(f'</{tag}>', index, end)
        if(tagEnd != -1): return text[index:tagEnd]
    
    return None

def get_tag_property(text, propertyName, start, end=None):
    end = len(text) if end == None else end
    index = index_after(text, f'{propertyName}="', start, end)

    if(index != -1): return text[index:text.find('"', index)]
    else: return ""

def get_tag_until(text, delimiter, start=0, end=None):
    end = len(text) if end is None else end
    delimiterIndex = text.find(delimiter, start, end)
    word = text[start: end if delimiterIndex<0 else delimiterIndex]

    nlIndex = word.find("\n")

    if(nlIndex>0): return word[:nlIndex]
    else: return word