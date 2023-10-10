import htmlFetcher, time 
from htmlInterpreter import HTMLInterpreter
from htmlParser import HTMLParser
import urlAnalyser
from dataTypes import URLInfo, ArticleItems, WebSitesInfo, DatabaseInfo
import psutil
from specificClassHtmlParser import SpecificClassHTMLParser
from htmlTreeStructure import SimpleNode
from utils import isEndTag, sortArticleNodesByClass, calculate_article_code, getArticlesLink
import timeit
from itertools import chain
import os
import articlePredictor
import random
from dataTypes import Counter
import datetime
from dateUtils import date_before_x_days
from newsFacade import update_websitesInfo_with_urls
from browserUtils import createDatabaseInfo

arr = ["https://www.theverge.com/", 
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/", 
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/", 
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/", 
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/world/2019/11/1/20944552/robot-blocks-hive-mit-m-blocks",
"https://www.theverge.com/good-deals/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent",
"https://www.theverge.com/good-deals/yeah/2019/11/1/20944437/google-fi-pixel-3a-xl-best-buy-25-percent"]

a = ["https://www.python.org/"] * 500

def cronometre(func, *args):
    start = time.time()
    func(*args)
    print("%f s" % (time.time()-start))

def t(node):
    if(node.content is not None):
        print(f"{node.tag} ({node.tagClass}) -> {node.content}")

    for n in node.getChildren():
        t(n)

def printTable(table):
    print("ARTICLE ", table.get(ArticleItems.CODE, ""), "--------------------------")
    pri(table.get(ArticleItems.IMG, None), "Image:")
    pri(table.get(ArticleItems.HEADER, None), "Header:")
    pri(table.get(ArticleItems.TITLE, None), "Title:")
    pri(table.get(ArticleItems.DESCRIPTION, None), "Description:")

def getElement(articleTable, element):
    c = articleTable.get(element, None)
    if(c is not None): return c.tagClass
    return None

def pri(node, title):
    if(node is not None):
        print(f"\n{node.tag} ({node.tagClass})\nContent: {node.content}\nLink: {node.link}\n")
    else: print("None")

def printLabeled(ob):
    print(f"img: {ob[ArticleItems.IMG]}\nheader: {ob[ArticleItems.HEADER]}\ntitle: {ob[ArticleItems.TITLE]}\ndescription: {ob[ArticleItems.DESCRIPTION]}\n")


if __name__ == "__main__":
    # #url = URLAnalyser(3,4,1).analyse(arr, psutil.cpu_count(logical=False))
    # with open("G1.html", "r", encoding="utf-8") as file:
    #     html = file.read()

    # # classes = HTMLInterpreter(3,3,10).interpret(HTMLParser().parse(html)).articleClasses
    # # print(classes)

    # # s = SpecificClassHTMLParser()
    # ana = URLAnalyser(3,4,1)
    # ana.webSitesInfo.newsWebSitesInfo["https://www.theverge.com"] = URLInfo("https://www.theverge.com")  
    # # with open("teste.html", "w", encoding="utf-8") as file:
    # #     file.write(html)s
           
    # url = "https://www.reddit.com/"
    # html = htmlFetcher.get_html_from_urls([url])[0]
    # # with open("CuzaumFolha.html", "r", encoding="utf-8") as file:
    # #     html = file.read()
    # info = HTMLInterpreter().interpret(HTMLParser().parse(html)).createURLInfo(url, 1)
    # print(info.articleClasses)
    # s = SpecificClassHTMLParser()
    # nodes = s.parse(html, info.articleClasses)
    # # for node in nodes.values():
    # #     print(node[0].to_s())
    # p = articlePredictor.ArticlePredictor()
    # info.articleElements = p.predictFromClasses(nodes, 0.5)
    # for cl, it in info.articleElements.items():
    #     print(cl, it, "\n")

    websiteInfo = WebSitesInfo()
    dbInfo = createDatabaseInfo()
    update_websitesInfo_with_urls(websiteInfo, dbInfo, randomFactor=0.5)
    print(websiteInfo.nonNewsWebSites)

    for website, urlInfo in websiteInfo.newsWebSitesInfo.items():
        print("\n",  "--------", website, "--------")
        print(urlInfo.articleClasses)
        print(urlInfo.articleElements)
        print(urlInfo.tags)

    # nodes = s.parseArticleElements(html, info.articleClasses, info.articleElements)
    # for clas, table in info.articleElements.items():
    #     print(clas, "----------------------------------------------------------------")
    #     for node in nodes[clas]:
    #         printTable(node)

        # for index, n in enumerate(node, start=0):
        #     if(index>5): pri(n)
        #     else: break
    # imgs = Counter()
    # headers = Counter()
    # titles = Counter()
    # descs = Counter()
    # for index in gimme(5,0,len(nodes)):
    #     img, header, title, desc = p.predict(nodes[index])
    #     imgs.add(img.tagClass if img is not None else None)
    #     headers.add(header.tagClass if header is not None else None)
    #     titles.add(title.tagClass if title is not None else None)
    #     descs.add(desc.tagClass if desc is not None else None)
    
    # print(imgs)
    # print(headers)
    # print(titles)
    # print(descs)
    
    # for t in texts:
    #     pri(t)

    #t(node)
    # user = os.path.expanduser('~')
    # path = "%s\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles" % user

    # for folder in os.listdir(path):
    #     p = os.path.join(path, folder, "places.sqlite")
    #     if(os.path.exists(p)):
    #         print("Achei! ", p)
    #         break
    
    # start = time.time()
    # urlAnalyser.analyse(info, 5, arr, psutil.cpu_count(logical=False))
    # print(info.tags)
    # print("%f s" % (time.time()-start))
    
    # # print(url.tags, url.articleClasses)

    # # h = {}
    # # for node in nodes:
    # #     value = h.get(node.tagClass, 0)
    # #     count = node.count_nodes()
    # #     h[node.tagClass] = count if count>value else value
    # # print(h)
