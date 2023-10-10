from .strFuncs import get_all_after_until, get_all_before_until
from .consts import CURRENCY_SYMBOLS
import re

pricesInterval = re.compile(r"^\s*-\s*\D*\d+[,.]?\d*$")

def get_first_price_index(text):
    textLength = len(text)
    index = 0
    endIndex = 0

    for letter in text:
        if(letter.isdigit()):
            endIndex = index+1

            while(endIndex<textLength):
                letter = text[endIndex]
                if(letter.isdigit() or letter in {".", ","}): endIndex += 1
                else: break

            while(text[endIndex-1] in {".", ","}): endIndex -= 1

            return [index, endIndex]
        else: index += 1
    
    return None

def get_currency(text, priceStart, priceEnd, currencySet=None):
    if(currencySet is None): currencySet = CURRENCY_SYMBOLS

    left = get_all_before_until(text, " ", priceStart-1)
    right = get_all_after_until(text, " ", priceEnd)

    if(left):
        return [left, [priceStart-len(left), priceStart]] if (left in currencySet) and (not right) else None
    elif(right): 
        return [right, [priceEnd, priceEnd+len(right)]] if right in currencySet else None

    left = get_all_before_until(text, " ", priceStart-2)
    if(left and left in currencySet): return [left,[priceStart-len(left)-1, priceStart]]
    else:
        right = get_all_after_until(text, " ", priceEnd+1)
        if(right and right in currencySet): return [right, [priceEnd, priceEnd+len(right)+1]]

    return None

def get_price_and_currency(text):
    priceIndexes = get_first_price_index(text)
    
    if(priceIndexes is not None):
        priceStart, priceEnd = priceIndexes
        currency = get_currency(text, priceStart, priceEnd)

        if(currency is not None):
            price = text[priceStart:priceEnd]
            currencyStart, currencyEnd = currency[1]

            if(currencyStart<priceStart): priceStart = currencyStart
            else: priceEnd = currencyEnd

            return [(currency[0], price), [priceStart, priceEnd]]
    
    return [None, None]

def check_after_price(text):
    text = text.strip()
    indexes = get_first_price_index(text)

    if(indexes is not None):
        lenText = len(text)
        _, numEnd = indexes

        if(numEnd<lenText and text[numEnd] == "%"):
            parentesisIndex = text.find("(")
            if(parentesisIndex != -1 and parentesisIndex<3): return False
            indexes = get_first_price_index(text[numEnd:])
            return False if indexes else True
        
        return False
    else: return True

def check_for_price_interval(afterPriceText):
    if(pricesInterval.match(afterPriceText)): return True
    else: return False


