class ArticleElement{
    constructor(tag, tagClass){
        this.tag = tag;
        this.tagClass = tagClass
    }
}

class ArticleItem{
    constructor(node){
        this.content = node.content
        if(node.link){
            this.link = node.link
        }
    }
}

function getCategoryObj(name, id=undefined){
    return {
        name,
        id
    }
}

export { ArticleElement, ArticleItem, getCategoryObj }