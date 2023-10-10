from random import randrange
from .dataTypes import ArticleItems

def isOnlyDigits(str):
    if any(c.isalpha() for c in str):
            return False
    else: return True

def lazySplit(word, currentIndex, delimiter="/"):
    index = word.find(delimiter, currentIndex)
    if(index != -1): return index+1, word[currentIndex:index]
    else: return -1, word[currentIndex:]
    
def removeNone(enum):
    if(None in enum): enum.remove(None)
    return enum

def sortArticleNodesByClass(articles):
    table = {}

    for article in articles:
        if(article.tagClass in table): table[article.tagClass].append(article)
        else: table[article.tagClass] = [article]
    
    return table

def gimmeRandom(n, min, max):
    arr = set()

    while(len(arr) != n):
        arr.add(randrange(min,max))
    
    arr = list(arr)
    arr.sort()
    return arr

def calculate_article_code(articleElements):
    return "".join([get_article_code(articleElements.get(ArticleItems.IMG)), get_article_code(articleElements.get(ArticleItems.HEADER)),
        get_article_code(articleElements.get(ArticleItems.TITLE)), get_article_code(articleElements.get(ArticleItems.DESCRIPTION))])

def get_article_code(articleItem):
    return "1" if articleItem is not None else "0"

def isArticleElementsTableEmpty(articleTable):
    return articleTable[ArticleItems.TITLE] is None and articleTable[ArticleItems.IMG] is None and articleTable[ArticleItems.HEADER] is None and articleTable[ArticleItems.DESCRIPTION] is None

def sumArticleElementsTableCode(articleTable):
    return sum([int(char) for char in articleTable.get(ArticleItems.CODE, calculate_article_code(articleTable))])

def getArticlesLink(articleTable):
    return articleTable[ArticleItems.TITLE].link

def index(list, element):
    index = 0
    for el in list:
        if(el == element): return index
        else: index += 1
    
    return -1