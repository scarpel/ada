from specificClassHtmlParser import SpecificClassHTMLParser
from htmlFetcher import get_html_from_urls
from datetime import datetime
from Utils.dateUtils import date_before_x_days
from Utils.utils import sort_by_url
from Utils.databaseUtils import get_urls_from_interval
from htmlInterpreter import HTMLInterpreter
from htmlParser import HTMLParser 
from articlePredictor import ArticlePredictor
from urlAnalyser import analyse

def get_articles_from_websites(websitesInfo, numberTags):
    specificParser = SpecificClassHTMLParser()
    articleNodes = {}
    urls = []
    websitesTags = []

    for website, urlInfo in websitesInfo.newsWebSitesInfo.items():
        print(website)
        frequentTags = get_x_most_frequent_tags(urlInfo.tags, numberTags)
        frequentTags.append("")
        websitesTags.append(frequentTags)
        urls.extend([f"{website}/tag" for tag in frequentTags])
    
    htmls = get_html_from_urls(urls)
    htmlIndex = 0

    for tags, websiteInfo in zip(websitesTags, websitesInfo.newsWebSitesInfo.items()):
        table = {}

        for tag in tags:
            html = htmls[htmlIndex]
            if(html is not None):
                table[tag] = specificParser.parseArticleElements(html, websiteInfo[1])
            htmlIndex += 1

        articleNodes[websiteInfo[0]] = table

    return articleNodes

def get_x_most_frequent_tags(tagsCounter, numberTags):
    return [key for key, _ in sorted(tagsCounter.items(), key=lambda item: item[1], reverse=True)[:numberTags]]

def update_websitesInfo_with_urls(websitesInfo, databaseInfo, finalDate=datetime.now(), days_interval=7, 
minNumOccurences=4, minTagsForAcceptance=4, maxTagsForAcceptance=11, maxFailedAttemps=1, randomFactor=1):

    startDate = date_before_x_days(days_interval, finalDate)
    sortedUrls = {key: value for key, value in sort_by_url(get_urls_from_interval(startDate, finalDate, databaseInfo)).items() if len(value)>1 and key not in websitesInfo.nonNewsWebSites}

    if(len(sortedUrls.keys())>0):
        htmls = get_html_from_urls(sortedUrls.keys())
        interpreter = HTMLInterpreter(minNumOccurences, minTagsForAcceptance, maxTagsForAcceptance)
        parser = HTMLParser()
        predictor = ArticlePredictor()
        specificClassParser = SpecificClassHTMLParser()

        for website, html in zip(sortedUrls.keys(), htmls):
            if(html is not None):
                if(website not in websitesInfo.newsWebSitesInfo):
                    interpreterEnvironment = interpreter.interpret(parser.parse(html))
                    if(len(interpreterEnvironment.articleClasses.keys())>0):
                        urlInfo = interpreterEnvironment.createURLInfo(website, maxFailedAttemps)
                        articleNodes = specificClassParser.parse(html, urlInfo.articleClasses)
                        articleElements = predictor.predictFromClasses(articleNodes, randomFactor)
                        if(len(articleElements.keys())>0):
                            urlInfo.articleClasses = set(articleElements.keys())
                            urlInfo.articleElements = articleElements
                            websitesInfo.newsWebSitesInfo[website] = urlInfo
                            analyse(urlInfo, minNumOccurences, sortedUrls[website])
                            continue
                else:
                    analyse(website.newsWebSitesInfo[website], minNumOccurences, sortedUrls[website])
                    continue
            
            websitesInfo.nonNewsWebSites.add(website)