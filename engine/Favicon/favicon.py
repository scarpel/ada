import requests
from Utils.strFuncs import find_index_backward, index_after
from Utils.consts import HEADERS
from Utils.utils import index
from os.path import join

def add_protocol(url, protocol="http"):
    protocolIndex = url.find(protocol)
    if(protocolIndex == 0): return url
    else:
        if(url.find("//") == 0): return f"{protocol}:{url}"
        else: return f"{protocol}://{url}"

def handle_favicon_url(mainUrl, faviconUrl):
    if(faviconUrl[0] == "/" and faviconUrl[1] != "/"): 
        return f"{add_protocol(mainUrl if mainUrl[-1] != '/' else mainUrl[:-1])}{faviconUrl}"
    else: return add_protocol(faviconUrl)

def get_favicon(mainUrl, html):
    favIndex = html.find("favicon.")
    url = None
    if(favIndex != -1):
        startFav = find_index_backward(html, '"', favIndex)
        endFav = html.find('"', favIndex)
        url = handle_favicon_url(mainUrl, html[startFav+1:endFav])
    else: url = f"{add_protocol(mainUrl)}/favicon.ico"

    return download_favicon(url)

def get_favicon_without_html(mainUrl, timeout=10, headers=HEADERS):
    return get_favicon(mainUrl, requests.get(mainUrl, timeout=timeout, headers=HEADERS).text)

def download_favicon(url, timeout=10, headers=HEADERS):
    if(url):
        resp = requests.get(url, timeout=timeout, headers=headers)
        return resp.content if resp.status_code == 200 else None
    else: return None

def save_favicon(filePath, favicon, fileName, fileExtention="ico"):
    if(favicon):
        with open(join(filePath, f"{fileName}.{fileExtention}"), "w+b") as file:
            file.write(favicon)