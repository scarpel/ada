String.prototype.find = function(word, start=0, end=null){
    if(end){
        let index = this.slice(start, end).indexOf(word)
        return index != -1? index+start: -1
    }else{
        let index = this.indexOf(word, start)
        return index != -1? index: -1
    }
}

String.prototype.replaceAll = function(find, replace){
    return this.replace(new RegExp(find, 'g'), replace)
}

const capitalize = (word) => word[0].toUpperCase() + word.slice(1)

function replaceAll(word, find, rep){
    return word.replace(new RegExp(find, 'g'), rep)
}

function get_until(text, delimiter, start=0, end=null){
    let delimiterIndex = text.find(delimiter, start, end)
    return text.slice(start, delimiterIndex===-1?end:delimiterIndex)
}

function get_until_if_exists(text, delimiter, likelyStart=0, end=null){
    if(likelyStart>-1){
        end = end?end:text.length
        let delimiterIndex = text.find(delimiter, likelyStart, end)
        return text.slice(likelyStart, delimiterIndex === -1?end:delimiterIndex)
    }else return ""
}

function find_and_go_after(text, word, delimiter, start=0, end=null){
    end = end?end:text.length
    let wordIndex = text.find(word, start, end)
    if(wordIndex>-1){
        wordIndex = text.find(delimiter, wordIndex, end)
        return wordIndex>-1?wordIndex+delimiter.length:-1
    }else return -1
}

function find_until(text, word, delimiter, start=0, end=null){
    end = end?end:text.length
    let delimiterIndex = text.find(delimiter, start, end)
    let wordIndex = text.find(word, start, end)
    return (wordIndex>-1 && wordIndex+word.length<=delimiterIndex)?wordIndex:-1
}

function find_end(text, word, start=0, end=null){
    return index_after(text, word, start, end?end:text.length)
}

function index_after(text, word, start, end){
    let wordIndex = text.find(word, start, end) 
    return wordIndex>-1? wordIndex+word.length: -1
}

function index_before(text, word, start, end){
    let wordIndex = text.find(word, start, end) 
    return wordIndex>-1?wordIndex-1:-1
}

function get_all_before_until(text, delimiter, start){
    if(start>0){
        let index = start

        while(index>=0){
            if(text[index] === delimiter) return text.slice(index+1,start+1)
            else index -= 1
        }

        return text.slice(0, start+1)
    }else if(start === 0) return text[start] === delimiter? null: text[start]
    else return null
}

function find_index_backward(text, character, start){
    if(start>0){
        let index = start

        while(index>=0){
            if(text[index] == character) return index
            else index--
        }
    }else if(start === 0) return text[start] == character? 0: null
    else return null
}

function get_all_after_until(text, delimiter, start){
    let index = text.find(delimiter, start)

    if(index != -1) return text.slice(start, index)
    else{
        let t = text.slice(start)
        return t !== ""? t: null
    }
}

function find_space_after_last_letter(text){
    let length = text.length-1
    let index = length

    while(index>0 && text[index] == " ") index -= 1

    return length==index? length: index + 1
}

function count_last_spaces(text, lenText){
    lenText = -lenText
    let index = -1
    let count = 0

    while(index>lenText && text[index] == " "){
        count += 1
        index -= 1
    }

    return count
}

export { get_until, get_until_if_exists, find_and_go_after, find_until, find_end, index_after, index_before, 
    get_all_before_until,  get_all_after_until, find_index_backward, find_space_after_last_letter, count_last_spaces,
    replaceAll, capitalize }