from multiprocessing.pool import Pool
from Utils.utils import lazySplit, isOnlyDigits, firstURLLazySplit
from Utils.dataTypes import URLInfo
from itertools import chain
import time

def init(urlInfo):
    global urlInfoArg
    urlInfoArg = urlInfo

def checkUrlParallely(url):
    return checkUrl(url, urlInfoArg)

def checkUrl(url, urlInfo=None):
    if(urlInfo is None): return None

    index, tag = firstURLLazySplit(url, 0)
    possibleTags = []
    failedAttemps = 0
    tagsConcatenation = ""

    while(index != -1 and failedAttemps<urlInfo.maxFailedAttemps):
        index, tag = lazySplit(url, index)
        if(tag == "" or isOnlyDigits(tag) or tag in urlInfo.invalidTags):
            failedAttemps += 1
        else:
            tagsConcatenation = "".join([tagsConcatenation, "/", tag]) if tagsConcatenation != "" else tag

            if(tagsConcatenation not in urlInfo.invalidTags):
                possibleTags.append(tagsConcatenation)

    return possibleTags

def parallelURLCheck(urls, urlInfo, numPools):
    with Pool(numPools, init, (urlInfo,)) as pool:
        return set(chain.from_iterable(pool.map(checkUrlParallely, urls)))

def sequentialURLCheck(urls, urlInfo):
    s = set()

    for url in urls:
        s.update(checkUrl(url, urlInfo))
    
    return s
