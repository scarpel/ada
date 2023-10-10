def get_until(text, delimiter, start=0, end=None):
    end = len(text) if end is None else end
    delimiterIndex = text.find(delimiter, start, end)
    return text[start: end if delimiterIndex<0 else delimiterIndex]

def get_until_if_exists(text, delimiter, likelyStart=0, end=None):
    if(likelyStart>-1):
        delimiterIndex = text.find(delimiter, likelyStart, end)
        return text[likelyStart: end if delimiterIndex == -1 else delimiterIndex]
    else: 
        return ""

def find_and_go_after(text, word, delimiter, start=0, end=None):
    end = len(text) if end is None else end
    wordIndex = text.find(word, start, end)
    if(wordIndex>-1):
        wordIndex = text.find(delimiter, wordIndex, end) 
        return wordIndex+len(delimiter) if wordIndex>-1 else -1
    else: return -1

def find_until(text, word, delimiter, start=0, end=None):
    end = len(text) if end is None else end
    delimiterIndex = text.find(delimiter, start, end)
    wordIndex = text.find(word, start, end)
    return wordIndex if (wordIndex>-1 and wordIndex+len(word)<=delimiterIndex) else -1

def find_end(text, word, start=0, end=None):
    end = len(text) if end is None else end
    wordIndex = text.find(word, start, end)
    return wordIndex + len(word) if wordIndex>-1 else -1

def index_after(text, word, start, end):
    wordIndex = text.find(word, start, end) 
    return wordIndex+len(word) if wordIndex>-1 else -1

def index_before(text, word, start, end):
    wordIndex = text.find(word, start, end) 
    return wordIndex-1 if wordIndex>-1 else -1

def get_all_before_until(text, delimiter, start):
    if(start>0):
        index = start

        while(index>=0):
            if(text[index] == delimiter): return text[index+1:start+1]
            else: index -= 1

        return text[0:start+1]
    elif(start == 0): return None if text[start] == delimiter else text[start]
    else: return None

def find_index_backward(text, character, start):
    if(start>0):
        index = start

        while(index>=0):
            if(text[index] == character): return index
            else: index -= 1
    elif(start == 0): return 0 if text[start] == character else None
    
    return None

def get_all_after_until(text, delimiter, start):
    index = text.find(delimiter, start)

    if(index != -1): return text[start:index]
    else:
        t = text[start:]
        return t if t != "" else None

def find_space_after_last_letter(text):
    length = len(text)-1
    index = length

    while(index>0 and text[index] == " "): index -= 1

    return length if length==index else index + 1

def count_last_spaces(text, lenText):
    lenText = -lenText
    index = -1
    count = 0

    while(index>lenText and text[index] == " "): 
        count += 1
        index -= 1

    return count
