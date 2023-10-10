import { DAYS_OF_WEEK } from "../consts/consts.js"
import { AgendaEvent } from "../utils/agendaDataTypes.js"

let simpleDateRE = /^\d{1,2}([\/.-]\d{1,2}([\/.-]\d{1,4})?)?$/
let simpleTimeRE = /^\d{0,2}:\d{0,2}$/
let simpleTimeAbbreviationRE = /^\d{1,}[hm]$/

let priorityRE = /^\*[1-4]$/

let dateSeparators = new Set([".", "/", "-"])

function parseQuick(text, dateAsUnix=false){
    let array = text.split(" ")
    let length = array.length
    let afterSeparator = false
    let gettingTitle = false
    let endTimeAbbreviation = false
    let startTimeAbbreviation = false
    let hasSetStartAt = false
    let date, time, priority, titleStart, title, endDate, endTime, i=0

    for(; i<length; i++){
        let str = array[i]

        if(!afterSeparator){
            if(simpleDateRE.test(str)){
                date = verifyDate(date, str)
                if(!date.isValid()) throw "Invalid date!"
                else hasSetStartAt = true
            }else if(str in DAYS_OF_WEEK){
                date = verifyDateAsDay(date, str)
                if(!date.isValid()) throw "Invalid date!"
                else hasSetStartAt = true
            }else if(simpleTimeRE.test(str)){
                if(startTimeAbbreviation) throw "You can't have time abbreviations and date at the same time!"
                else{
                    time = verifyTime(time, str)
                    hasSetStartAt = true
                }
            }else if(simpleTimeAbbreviationRE.test(str)){
                time = verifyTimeAbbreviation(time, str)
                startTimeAbbreviation = true
                hasSetStartAt = true
            }
            else if(priorityRE.test(str)) priority = verifyPriority(priority, str)
            else{
                if(str === "-") afterSeparator = true
                else{
                    if(!gettingTitle){
                        if(str && title) throw "More than one title found!"
                        else{
                            titleStart = i
                            if(str[0] === '"'){
                                i++
                                
                                while(i<length){
                                    str = array[i]
                                    if(str[str.length-1] === '"'){
                                        title = array.slice(titleStart, i+1).join(" ")
                                        break
                                    }
                                    i++
                                }

                                if(title) title = title.slice(1, title.length-1)
                                else throw "Ending quote not found!"
                            }else gettingTitle = true
                        }
                    }

                    continue
                }
            }

            if(gettingTitle){
                title = array.slice(titleStart, i).join(" ")
                gettingTitle = false
            }
        }else{
            if(simpleDateRE.test(str)){
                if(endTimeAbbreviation) throw "You can't have time abbreviations and date at the same time!"
                else endDate = verifyDate(endDate, str)
            }else if(str in DAYS_OF_WEEK){
                if(endTimeAbbreviation) throw "You can't have time abbreviations and date at the same time!"
                else endDate = verifyDateAsDay(endDate, str)
            }else if(simpleTimeRE.test(str)){
                if(endTimeAbbreviation) throw "You can only have time or time abbreviation, not both!"
                else endTime = verifyTime(endTime, str)
            }
            else if(simpleTimeAbbreviationRE.test(str)){
                endTimeAbbreviation = true
                endTime = verifyTimeAbbreviation(endTime, str)
            }else throw `You can only have date or time after the separator!`
        }
    }

    if(gettingTitle) title = array.slice(titleStart, i).join(" ")
    
    if(!date) date = moment()
    
    if(time) date = updateDateWithTime(date, time, startTimeAbbreviation)
    
    date.second(0)
    
    if(endTime){
        if(!endDate) endDate = moment(date)
        endDate = updateDateWithTime(endDate, endTime, endTimeAbbreviation)
    }

    if(dateAsUnix){
        date = date.unix()
        if(endDate) endDate = endDate.unix()
    }
    return AgendaEvent(title, hasSetStartAt?date:undefined, endDate, priority)
}

function updateDateWithTime(date, time, timeAbbreviation=false){
    let [hours, minutes] = time

    if(timeAbbreviation){
        if(minutes !== undefined) date.add(minutes, "m")
        if(hours !== undefined) date.add(hours, "h")
    }else{
        if(minutes !== undefined) date.minutes(minutes)
        if(hours !== undefined) date.hour(hours)
    }

    return date
}

function verifyDate(date, str){
    if(date) throw "More than one date before separator!"
    else{
        let today = moment()
        let [day, month, year] = str.split(getDateSeparator(str))
        
        if(day){
            day = parseInt(day)
            if(day>31) throw "Invalid date: day must be lower than 32"
            today.date(day)
        }

        if(month){
            month = parseInt(month)-1
            if(month<0 || month>11) throw "Invalid date: month must be between 1 and 12"
            today.month(month)
        }

        if(year){
            let length = year.length

            if(length>4) throw "Invalid date: weird year format"
            else if(length<4){
                let yearStr = (new Date()).getFullYear().toString()
                year = parseInt([yearStr.slice(0, yearStr.length-length), year].join(""))
            }else year = parseInt(year)

            today.year(year)
        }

        return today
    }
}

function verifyDateAsDay(date, str){
    if(date) throw "More than one date before separator!"
    else{
        let today = moment()
        let day = DAYS_OF_WEEK[str]

        if(day === -1) day = today.day()+1
        else if(day<=today.day()) day += 7

        today.day(day)
        return today
    }
}

function getDateSeparator(date){
    let length = date.length
    let separator = "/"

    for(let i=0; i<length; i++){
        if(dateSeparators.has(date[i])) return date[i]
    }

    return separator
}

function verifyTime(time, str){
    if(time) throw "More than one time before separator!"
    else{
        let [hours, minutes] = str.split(":")

        if(hours){
            hours = parseInt(hours)
            if(hours>23) throw "Invalid time: time must be between 0 and 23"
        }else hours = 0

        if(minutes){
            minutes = parseInt(minutes)
            if(minutes>59) throw "Invalid time: minutes must be between 0 and 59"
        }else minutes = 0

        return [hours, minutes]
    }
}

function verifyTimeAbbreviation(time, str){
    let lastIndex = str.length-1
    let unit = str[lastIndex]
    let value = parseInt(str.slice(0, lastIndex))

    if(time){
        if(unit === "h"){
            if(time[0]) throw "More than one hour found in end time!"
            else time[0] = value
        }else if(unit === "m"){
            if(time[1]) throw "More than one minute found in end time!"
            else time[1] = value
        }

        return time
    }else return unit === "h"? [value, null]: [null, value]
}

function verifyPriority(priority, str){
    if(priority) throw "More than one priority found!"
    else{
        let priority = parseInt(str.slice(1))
        if(priority<1 || priority>3) throw "Invalid priority: priority must be between 1 and 3!"

        return priority
    }
}

export { parseQuick }