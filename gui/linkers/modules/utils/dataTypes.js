import { WEBSITE_TYPES } from "../consts/websiteTypes.js"
import { get } from "./utils.js"
import { treat_all_url } from "./websiteUtils.js"

class Counter{
    constructor(values={}){
        this.values = values
        this.size = 0
    }

    has = (key) => key in this.values

    clear = () => {this.values = {}}

    keys = () => Object.keys(this.values)

    pop = (key) => {
        let value = this.values[key]
        if(value !== undefined){
            this.size -= value
            delete this.values[key]
        }
    }

    union = (counter) => {
        var otherValues = Object.entries(counter.values)
        let lenOtherValues = otherValues.length

        for(var i=0; i<lenOtherValues; i++){
            this.add(...otherValues[i])
        }
    }

    add = (name, number=1) => {
        if(name in this.values){
            this.values[name] += number
        }else{
            this.values[name] = number
        }

        this.size += number
    }
        
    remove = (name, number=1) => {
        if(name in this.values){
            this.values[name] -= number
            if(this.values[name] === 0)
                delete this.values[name]
        }

        this.size -= number
    }
    
    decrease = (name, number=1) => {
        if(get(this.values, name, 0)>0) this[name] -= number

        this.size -= number
    }

    decreaseAll = (number=1) => {
        let keys = this.values.key()
        let lenOtherValues = keys.length

        for(var i=0; i<lenOtherValues; i++){
            if(this.values[keys[i]]>0){
                this.values[keys[i]] -= number
                this.size -= number
            }
        }
    }

    isEmpty = () => {
        return this.values.length === 0
    }
    
    getAllEqualOrAbove = (number) => {
        var keys = []
        let entries = Object.entries(this.values)
        let lenEntries = entries.length

        for(var i=0; i<lenEntries; i++){
            let [key, value] = entries[i]
            if(value>number) keys.push(key)
        }

        return keys
    }
    
    getKeyWithHigherValue = () => {
        let entries = Object.entries(this.values)
        let len = entries.length
        if(len>1){
            let keyWithHigherValue = null
            let higherValue = null
            let times = 0
        
            for(var i=0; i<len; i++){
                let [key, value] = entries[i]

                if(value>higherValue){
                    keyWithHigherValue = key
                    higherValue = value
                    times = 1
                }else if(value === higherValue) times += 1
            }

            return times == 1? keyWithHigherValue: null
        }else return len === 1? entries[0][0]: null
    }
    
    toString = () => {
        let entries = Object.entries(this.values)
        let len = entries.length
        let arr = []

        for(var i=0; i<len; i++){
            let [key, value] = entries[i]
            arr.push(`${key}(${value})`)
        }

        return arr
    }

    getSortedArray = () => Object.entries(this.values).sort(([,a], [,b]) => b-a)
}

class FrequencyCounter extends Counter{
    constructor(){
        this.mostFrequentKey = null
    }
    
    setMostFrequentKey = () => {
        this.mostFrequentKey = this.getKeyWithHigherValue()
    }
    
    updateMostFrequentKey = (lastUpdatedKey) => {
        if(this.mostFrequentKey != lastUpdatedKey && get(this.values, lastUpdatedKey, 0)>get(this.values, this.mostFrequentKey, 0))
            this.mostFrequentKey = lastUpdatedKey
    }

    add = (name, number=1) => {
        super.add(name, number)
        this.updateMostFrequentKey(name)
    }
        
    remove = (name, number=1) => {
        super.remove(name, number)
        if(name === this.mostFrequentKey) this.setMostFrequentKey()
    }
}

class ArticleTagCounter extends Counter{
    merge = (articleCounter) => {
        this.union(articleCounter)
    }
    
    verify = (decisionTree, acceptancePercentage=0.5) => decisionTree.evaluate(this.values) >= acceptancePercentage

    clear = () => {
        if(Object.keys(this.values).length>0){
            this.values = {}
            this.length = 0
        }
    }
    
    lazyCount = (max, min=0, minNumTags=2) => {
        delete this.values.undefined
        let keys = Object.keys(this.values)
        let len = keys.length
        
        if(len<minNumTags) return false
        let sum = 0
        
        for(var i=0; i<len; i++){
            sum += this.values[keys[i]]
            if(sum>max) return false
        }

        return sum>=min
    }
}

class InterpreterEnvironment{
    constructor(minTagsForAcceptance=3, minNumOccurences=5, maxTagsForAcceptance=10, decisionTree=getNewsDecisionTree(), acceptancePercentage=0.8){
        this.tagCounter = new ArticleTagCounter()
        this.articleClasses = new Counter()
        this.minNumOccurences = minNumOccurences
        this.minTagsForAcceptance = minTagsForAcceptance
        this.maxTagsForAcceptance = maxTagsForAcceptance
        this.decisionTree = decisionTree
        this.acceptancePercentage = acceptancePercentage
    }
    
    resetTagCounter = () => {
        if(Object.keys(this.tagCounter.values).length>0){
            this.tagCounter = new ArticleTagCounter()
        }
    }
    
    checkArticleClasses = () => {
        delete this.articleClasses.values.null

        let entries = Object.entries(this.articleClasses.values)
        let length = entries.length

        for(var i=0; i<length; i++){
            var [articleClass, count] = entries[i]
            if(count<this.minNumOccurences){
                delete this.articleClasses.values[articleClass]  
            } 
        }
    }
    
    createNewsWebsiteInfo = (url, maxFailedAttemps=1) => {
        return new NewsWebsiteInfo(undefined, url, undefined, new Set(Object.keys(this.articleClasses.values)), undefined, maxFailedAttemps)
    }

    getArticleClasses = () => new Set(this.articleClasses.keys())
}

class WebsiteInfo{
    constructor(id, url, domain, name){
        this.id = id
        this.url = url
        this.name = name
        this.domain = domain
    }
}
        
class NewsWebsiteInfo extends WebsiteInfo{
    constructor(id="", url, name="", type = WEBSITE_TYPES.GENERAL, score = 0, articlesInfo = {}, lastTagsUpdate = moment(), maxFailedAttemps=1){
        super(id, url, "", name)
        this.maxFailedAttemps = maxFailedAttemps
        this.categories = {}
        this.invalidCategories = new Set()
        this.articlesInfo = articlesInfo
        this.lastTagsUpdate = lastTagsUpdate
        this.score = score
        this.type = type
    }
    
    isEmpty = () => {
        return Object.keys(this.categories.values).length == 0
    }

    addCategory = (url, obj) => {
        this.categories[url] = obj
    }

    static fromObject = (obj, url=undefined) => {
        return new NewsWebsiteInfo(obj.id, url?url:treat_all_url(obj.url), obj.name, obj.type, obj.score, undefined, moment.unix(obj.last_update))
    }
}

class NewsWebsitesInfo{
    constructor(){
        this.nonNewsWebsites = new Set(["https://www.google.com", "https://www.bing.com", "https://duckduckgo.com/", "https://www.yahoo.com"])
        this.newsWebsitesInfo = {}
        this.newsWebsitesScores = new Counter()
    }
}

class LazySplitter{
    index = 0

    constructor(word, delimiter){
        this.word = `${word}${word[-1]==delimiter?"":delimiter}`
        this.delimiter = delimiter
    }

    next = () => {
        let end = this.word.find(this.delimiter, this.index)
        if(end != -1){
            let word = this.word.slice(this.index, end)
            this.index = end+1
            return word
        }else return null
    }
}

class URLLazySplitter extends LazySplitter{
    index = this._getFirstIndex()

    _getFirstIndex = () => {
        let index  = this.word.find("//")
        if(index != -1)
            return index + 2
        else return 0
    }
    
    reset = (word, delimiter) => {
        this.word = `${word}${word[-1]==delimiter?"":delimiter}`
        this.index = this._getFirstIndex()
    }
}

const ArticleItems = {
    IMG: 0,
    HEADER: 1,
    TITLE: 2,
    DESCRIPTION: 3,
    AUTHOR: 4,
    LINK: 5,
    NEWS_INFO: 6,
    CODE: 7
}

function createArticleElementsTable(img=null, header=null, title=null, description=null, author=null){
    let obj = {}

    if(img) obj[ArticleItems.IMG] = img
    if(header) obj[ArticleItems.HEADER] = header
    if(title) obj[ArticleItems.TITLE] = title
    if(description) obj[ArticleItems.DESCRIPTION] = description
    if(author) obj[ArticleItems.AUTHOR] = author

    return obj
}

class LabeledObject{
    constructor(label, obj){
        this.label = label
        this.object = obj
    }
}

class DatabaseInfo{
    constructor(path, databaseFile, browser){
        this.path = path
        this.databaseFile = databaseFile
        this.browser = browser
    }
    
    get_path = () => window.path_join(this.path, this.databaseFile);
}

const ScheduleOperators = {
    null: 0,
    TITLE: 1,
    TIME: 2,
    DATE: 3,
    INTERVAL: 4,
    ACTION: 5
}

const ScheduleActions = {
    ADD: 0,
    DEL: 1,
    MOD: 2,
    null: 3
}
                    
function createScheduleObj(title=null, date=null, startTime=null, endTime=null){
    return {
        [ScheduleOperators.TITLE]: title,
        [ScheduleOperators.DATE]: date,
        [ScheduleOperators.TIME]: [startTime, endTime]
    }
}

class LinkedListNode{
    constructor(value, nextNode=null){
        this.value = value
        this.nextNode = nextNode
    }
}

class LinkedList{
    head = null
    tail = null
    length = 0
    currentNode = null

    constructor(firstElement = null){
        if(firstElement) this.push(firstElement)
    }

    push = (element) => {
        let node = new LinkedListNode(element)

        if(!this.head) this.head = this.tail = node
        else{
            this.tail.nextNode = node
            this.tail = node
        }

        this.length++
    }

    pop = () => {
        let node = this.head

        if(this.length<2){
            if(this.length === 1){
                this.head = this.tail = null
            }return node
        }else{
            node = this.head
            let lastNode

            while(node.nextNode){
                lastNode = node
                node = node.nextNode
            }

            this.tail = lastNode
            lastNode.nextNode = null
        }

        this.length--
        return node
    }

    shift = () => {
        if(this.head){
            let node = this.head
            this.head = this.head.nextNode
            this.length--

            return node
        }else return null
    }

    next = () => {
        if(this.currentNode) this.currentNode = this.currentNode.nextNode
        else this.currentNode = this.head

        return this.currentNode? this.currentNode.value: null
    }

    toArray = () => {
        let arr = []
        let node = this.head

        while(node){
            arr.push(node.value)
            node = node.nextNode
        }

        return arr
    }

    get = (index) => {
        let node

        if(index<this.length && index>-1){
            node = this.head
            for(let i=0; i<index; i++) node = node.nextNode
            node = node.value
        }

        return node
    }
}

class TaskManager{
    tasks = {}

    constructor(id){
        this.id = id
    }

    addTask = (func) => {
        
    }
}

export { Counter, FrequencyCounter, ArticleTagCounter, InterpreterEnvironment, WebsiteInfo, NewsWebsiteInfo, 
    NewsWebsitesInfo, LazySplitter, URLLazySplitter, ArticleItems, createArticleElementsTable, LabeledObject, DatabaseInfo,
    ScheduleActions, ScheduleOperators, createScheduleObj, LinkedList }