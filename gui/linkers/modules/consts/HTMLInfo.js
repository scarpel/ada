const defaultDesirableTags = new Set(["div", "p", "time", "a", "ul", "li", "picture", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "ol", "section", "br", "source"])
const ambiguosTags = new Set(["source"])
const unaryTags = new Set(["img", "text", "br", "hr"])
const badBeggining = new Set(["!", "?"])
const quotes = new Set(["'", '"'])
const containerTags = new Set(["div", "li", "tr", "section"])
const allowedTagFollowUps = new Set([" ", ">"])
const descriptionNames = ["description", "og:description", "twitter:description"]
const separators = new Set([",", ".", ";", ":"])

export {defaultDesirableTags, ambiguosTags, unaryTags, badBeggining, quotes, containerTags, allowedTagFollowUps, 
    descriptionNames, separators}