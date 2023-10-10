from urlChecker import sequentialURLCheck
from htmlFetcher import get_html_from_urls
from htmlSearcher import parallel_html_search, sequential_html_search
from datetime import date

def analyse(urlInfo, minNumOccurences, commonUrlsArray):
    if(len(commonUrlsArray) == 0): return None

    possibleTags = sequentialURLCheck(commonUrlsArray, urlInfo)
    if(len(possibleTags)>0):
        today = date.today()

        if(urlInfo.lastTagsUpdate<today):
            for key in urlInfo.tags.keys():
                if(key in possibleTags):
                    urlInfo.tags.add(key)
                    possibleTags.remove(key)
                else: urlInfo.tags.decrease(key)

            urlInfo.lastTagsUpdate = today
        else: possibleTags = set([value for value in possibleTags if value not in urlInfo.tags])

        htmls = get_html_from_urls([f"{urlInfo.url}/{tag}/" for tag in possibleTags])
        verifiedHtmls = sequential_html_search(htmls, urlInfo, minNumOccurences)
        
        for tag, is_usefulTag in zip(possibleTags, verifiedHtmls):
            if(is_usefulTag): urlInfo.tags.add(tag)
            else: urlInfo.invalidTags.add(tag)
    
    return urlInfo