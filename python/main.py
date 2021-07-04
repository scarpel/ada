import re

name = "treatedHTML"

desirable_tags = {"div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
                  "img", "ol", "section", "br", "source", "article"}

with open("HTML.txt", encoding="utf-8") as file:
    texts = file.read().split(";cut;")


def get_sub(text, sub, start, end=None):
    try:
        return text.index(sub, start) if end is None else text.index(sub, start, end)
    except:
        return -1


def treat_html(html):
    index = html.index("<")
    end = len(html)
    tags = []

    while(-1 < index < end):
        closing_tag = get_sub(html, ">", index+1)
        if(closing_tag > -1):
            space = get_sub(html, " ", index, closing_tag)

            tag = html[index+1:space] if space != - \
                1 else html[index+1:closing_tag]

            if(tag in desirable_tags or tag[0] == "/"):
                try:
                    tagText = html[index:closing_tag]
                    cstart = tagText.index('class="')
                    cend = tagText.index('"', cstart+8)
                    c = tagText[cstart:cend+1]

                    tags.append(f"<{tag} {c}>")
                except:
                    tags.append(f"<{tag}>")

            index = get_sub(html, "<", closing_tag+1)
        else:
            break

    return "".join(tags).replace(",", "")


htmls = [treat_html(text) for text in texts]

with open(f"{name}.txt", "w+") as file:
    file.write("\n,\n".join(htmls))
