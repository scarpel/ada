from Utils.dataTypes import Counter

counter = Counter() 

def _split(word):
    index = 0
    get = False

    for end, char in enumerate(word+"-", start = 0):
        if(char.isalpha()):
            if(not get): 
                index = end
                get = True
        elif(get): 
            get = False
            counter.add(word[index:end])

words = ["feed-post-link gui-color-primary gui-color-hover", "c-entry-box--compact__title", "card__headline__text", "c-headline__title"]

for word in words: _split(word)

print(counter)