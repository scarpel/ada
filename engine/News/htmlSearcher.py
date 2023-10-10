from multiprocessing.pool import Pool
import re

def init(urlInfoArg, minNumOccurencesArg):
    global urlInfo
    urlInfo = urlInfoArg
    global minNumOccurences
    minNumOccurences = minNumOccurencesArg


def pre_search_html(html):
    return search_html(html, urlInfo, minNumOccurences)


def parallel_html_search(htmls, urlInfo, numPools, minNumOccurences):
    with Pool(numPools, init, (urlInfo, minNumOccurences,)) as pool:
        return pool.map(pre_search_html, htmls)


def sequential_html_search(htmls, urlInfo, minNumOccurences):
    return [search_html(html, urlInfo, minNumOccurences) for html in htmls]


def search_html(html, urlInfo, minNumOccurences):
    for articleClass in urlInfo.articleClasses:
        if(len(re.findall(articleClass, html)) >= minNumOccurences): return True
    return False