from .strFuncs import find_index_backward, index_after
from .htmlUtils import get_tag_property
from .utils import index
from Favicon.favicon import get_favicon, save_favicon
from sys import path
from os.path import join
from Utils.paths import FAVICONS, MAIN

def get_website_name(reference, title, html):
    site_name = html.find('property="og:site')
    if(site_name != -1):
        start = find_index_backward(html, "<", site_name)
        end = html.find(">", site_name)
        prop = get_tag_property(html[start:end], "content", 1)
        if(prop): return prop
    
    titleArray = title.split(" ")
    start = None
    end = None
    index = -1
    lenArr = len(titleArray)
    cond = -(lenArr if lenArr>1 else 2)
    lower = reference.lower()

    while(index>cond):
        if(titleArray[index].lower() in lower):
            if(not end):
                end = lenArr+index+1
        elif(end): 
            start = lenArr+index+1
            break 

        index -= 1
    
    if(end):
        return " ".join(filter(lambda x: x.capitalize(), titleArray[start if start else 0: end]))
    else: return f"{reference[0].capitalize()}{reference[1:]}"

def trim_url_protocols(mainUrl):
    end = len(mainUrl)
    if(mainUrl[-1] == "/"): end -= 1

    start = index_after(mainUrl, "//", 0, end)
    if(start == -1): start = 0

    return mainUrl[start:end]

def splitUrl(url):
    index = url.find("//")
    if(index != -1):
        index = url.find("/", index+2)
        if(index != -1):
            rest = url[index+1:].split("/")
            if(rest[0] != ""): return [url[:index], *rest]
            else: return [url[:index]]
        else: return url
    else: return url.split("/")

def firstURLLazySplit(word, currentIndex, delimiter="/"):
    index = word.find(delimiter*2)
    if(index != -1): index += 2
    else: index = 0

    index = word.find("/", index)
    if(index != -1): return index+1, word[0:index]
    else: return -1, word[0:]

def get_main_url(url):
    _, mainUrl = firstURLLazySplit(url, 0)
    return mainUrl

def sort_by_url(urls):
    sorted = {}

    for url in urls:
        _, splittedUrl = firstURLLazySplit(url, 0)
        if(splittedUrl in sorted): sorted[splittedUrl].add(url)
        else: sorted[splittedUrl] = set([url])
    
    return sorted

def isLinkValid(src):
    if(src is None): return False
    else: return src.find("http") == 0

def get_favicon_name(mainUrl, urlArray=None):
    if(not urlArray):
        url = trim_url_protocols(mainUrl)
        urlArray = url.split(".")
         
        first = 1 if urlArray[0] == "www" else 0
        last = index(urlArray, "com")
        if(last == -1): last = index(urlArray, "co")

        return f"{urlArray[first]}{''.join(map(lambda x: x.capitalize(), filter(lambda x: x!='com', urlArray[first+1:last])))}"
    else: 
        first = 1 if urlArray[0] == "www" else 0
        return f"{urlArray[first]}{''.join(map(lambda x: x.capitalize(), filter(lambda x: x!='com', urlArray[first+1:])))}"

def get_basic_website_info(mainUrl, title, html):
    url = trim_url_protocols(mainUrl)
    urlArray = url.split(".")

    comIndex = index(urlArray, "com")
    if(comIndex == -1): comIndex = index(urlArray, "co")

    domain = urlArray[comIndex] if comIndex == -1 else "".join(filter(lambda x: x.capitalize(), urlArray[comIndex+1:]))

    faviconName = get_favicon_name(mainUrl, urlArray[:comIndex])
    siteName = get_website_name(faviconName, title, html)
    favicon = get_favicon(mainUrl, html)

    if(favicon):
        faviconName = f"{faviconName}{domain.capitalize()}"
    else: faviconName = "None.ico"

    return siteName, favicon, faviconName, domain