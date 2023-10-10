import { retrieve_month_events, store_event, remove_event, update_value, retrieve_intersected_events } from "./storageAgenda.js"
import { get_timestamp, days_of_month, monthShortName } from "../utils/dateUtils.js"
import MonthEvents from "../../components/MonthEvents.js"
import { cleanAppend } from "../utils/htmlUtils.js"
import DayEvents from "../../components/DayEvents.js"
import EventCard from "../../components/EventCard.js"
import { binary_search, binary_search_for_insertion } from "../utils/utils.js"
import { ArticleItems } from "../utils/dataTypes.js"

export default class AgendaController{
    events = {}
    displayElements = {}

    constructor(calendar, eventsDisplayID, database){
        this.calendar = calendar
        calendar.bindController(this)

        this.displayDiv = document.getElementById(eventsDisplayID)
        this.database = database
    }

    getIntersectedEvents = (month, year) => {
        return retrieve_intersected_events(this.database, moment([year, month]).unix(), userInfo.id)
    }

    getElement = (obj, year, month=undefined, day=undefined) => {
        let yearObj = obj[year]

        if(yearObj && month){
            let monthObj = yearObj[month]
            if(monthObj && day) return monthObj[day]
            else return monthObj
        }else return yearObj
    }

    getDayEvents = (monthObj, day) => {
        return monthObj.children[day-1]
    }

    getAgendaEventInArray = (agendaEventFromDB, array) => {
        return binary_search(agendaEventFromDB, array, (a, b) => a.start_at<b.start_at, (a, b) => a.id === b.id)
    }

    addToEventArray = (agendaEvent, monthObj, day) => {
        let eventArray = monthObj[day]
        if(eventArray){
            let length = eventArray.length
            let index = binary_search_for_insertion(agendaEvent.start_at, eventArray, (a, b) => a<b.start_at)

            eventArray.splice(index, 0, agendaEvent)
            return [index, length>0]
        }else{
            monthObj[day] = [agendaEvent]
            return [0, false]
        }
    }

    addToDisplay = (position, dayEvents, eventCard) => {
        let eventCardsDiv = dayEvents.children[1]
        let eventCards = eventCardsDiv.children

        if(eventCards.length>0){
            eventCardsDiv.insertBefore(eventCard, eventCards[position])
        }else{
            dayEvents.classList.remove("no-events")
            eventCardsDiv.append(eventCard)
        }

        return eventCard
    }

    addNewEvent = (agendaEvent) => {
        let date = moment.unix(agendaEvent.start_at)
        let month = date.month()
        let year = date.year()
        let monthObj = this.getElement(this.events, year, month)

        if(monthObj){
            if(month === this.calendar.currentMonth) this.calendar.selectDay(date.date())
            return this.addEvent(agendaEvent, date, monthObj)
        }
    }

    addEvent = (agendaEvent, startDate, monthObj, displayTimeFunction=undefined, monthEventsElement=undefined) => {
        return agendaEvent.end_at? this._addNewEventWithEndDate(agendaEvent, startDate, monthObj) : this._addEvent(startDate.date(), startDate.month(), startDate.year(), agendaEvent, monthObj, displayTimeFunction, monthEventsElement)
    }

    _addEvent = (day, month, year, agendaEvent, monthObj, displayTimeFunction=undefined, monthEventsElement=undefined) => {
        let [position, moreThanOne] = this.addToEventArray(agendaEvent, monthObj, day)
        if(!moreThanOne) this.calendar.markAsBusy(year, month, day)
        monthEventsElement = monthEventsElement? monthEventsElement: this.getElement(this.displayElements, year, month)
        return this.addToDisplay(position, this.getDayEvents(monthEventsElement, day), this.getEventCard(agendaEvent, displayTimeFunction))
    }

    findEventPositionInArray = (id, eventsArray) => {
        let length = eventsArray.length
        
        for(let i=0; i<length; i++) if(eventsArray[i].id === id) return i

        return undefined
    }

    removeEvent = (agendaEvent) => {
        let date = moment.unix(agendaEvent.start_at)
        let month = date.month()
        let year = date.year()
        let day = date.date()
        
        remove_event(this.database, agendaEvent.id)
        
        if(agendaEvent.children) this.removeEventChildren(agendaEvent, date)
        else{
            let monthEventsObj = this.getElement(this.events, year, month)
            let eventsArray = monthEventsObj[day]
            let position = this.findEventPositionInArray(agendaEvent.id, eventsArray)
            eventsArray.splice(position, 1)
            let dayEvents = this.getDayEvents(this.getElement(this.displayElements, year, month), day)
            dayEvents.children[1].children[position].remove()

            if(eventsArray.length === 0) this.handleNoEventArray(dayEvents, monthEventsObj, year, month, day)
        }
    }

    removeEventChildren = (agendaEvent, startDate) => {
        if(agendaEvent.children){
            this.removeEventWithEndDate(agendaEvent, startDate, moment.unix(agendaEvent.end_at))

            let children = agendaEvent.children
            for(let i=children.length-1; i>=0; i--){
                let element = children[i]
                if(element.parentNode.children.length === 1) element.parentNode.parentNode.classList.add("no-events")
                element.remove()
            }
            
            delete agendaEvent.children
        }
    }

    removeEventWithEndDate = (agendaEvent, startDate, endDate) => {
        let month, year, monthEventsObj

        while(month !== startDate.month() && !startDate.isAfter(endDate, "month")){
            month = startDate.month()
            year = startDate.year()
            monthEventsObj = this.getElement(this.events, year, month)

            if(monthEventsObj){
                this._removeEventsFromMonth(agendaEvent, startDate, endDate, monthEventsObj, month, year)
            }else{
                startDate.add(1, "month")
                startDate.date(1)
            }
        }
    }

    _removeEventsFromMonth = (agendaEvent, startDate, endDate, monthEventsObj, month, year) => {
        while(!startDate.isAfter(endDate, "day") && startDate.month() === month){
            let eventsArray = monthEventsObj[startDate.date()]
            console.log(startDate, eventsArray, monthEventsObj)
            eventsArray.splice(this.findEventPositionInArray(agendaEvent.id, eventsArray), 1)

            if(eventsArray.length === 0) this.handleNoEventArray(monthEventsObj, year, month, startDate.date())

            startDate.add(1, "day")
        }
    }

    handleNoEventArray = (monthEventsObj, year, month, day) => {
        this.calendar.unmarkBusy(year, month, day)
        delete monthEventsObj[day]
    }

    updateEventTitle = (agendaEvent) => {
        update_value(this.database, agendaEvent.id, "title", agendaEvent.title)
        if(agendaEvent.children){
            let children = agendaEvent.children
            let length = children.length

            for(let i=0; i<length; i++) children[i].children[2].innerText = agendaEvent.title
        }
    }

    selectDay = (day) => {
        document.getElementById(`day-${day}`).scrollIntoView({ behavior: 'smooth' })
    }

    sortByDay = (array) => {
        let length = array.length
        let obj = {}

        for(let i=0; i<length; i++){
            let event = array[i]
            let day = moment.unix(event.start_at).date()
            let o = obj[day]

            if(!o) obj[day] = [event]
            else o.push(event)
        }

        return obj
    }

    _getElementOrInsert(obj, element, insertIfNotFound){
        let result = obj[element]

        if(!result){
            result = insertIfNotFound
            obj[element] = result
        }

        return result
    }

    sortByFullDate = (array) => {
        let obj = {}
        let year, month, day
        let length = array.length
        let currentYear, currentMonth, currentDay

        for(let i=0; i<length; i++){
            let agendaEvent = array[i]
            let date = moment.unix(agendaEvent.start_at)

            if(date.year() !== year){
                year = date.year()
                month = undefined
                day = undefined
                currentYear = this._getElementOrInsert(obj, year, {})
            }

            if(date.month() !== month){
                month = date.month()
                day = undefined
                currentMonth = this._getElementOrInsert(currentYear, month, {})
            }

            if(date.date() !== day){
                day = date.date()
                currentDay = this._getElementOrInsert(currentMonth, day, [])
            }

            currentDay.push(agendaEvent)
        }

        return obj
    }

    getMonthEvents = (year, month) => {
        let yearObj = this.events[year]
        if(!yearObj){
            yearObj = {}
            this.events[year] = yearObj
        }

        let monthObj = yearObj[month]
        if(!monthObj){
            monthObj = this.getMonthEventsFromDatabase(year, month)
            yearObj[month] = monthObj
        }

        return monthObj
    }

    getMonthEventsFromDatabase = (year, month) => {
        let endAt = month === 11? get_timestamp(year+1, 0): get_timestamp(year, month+1)
        return this.sortByDay(retrieve_month_events(this.database, get_timestamp(year, month), endAt, userInfo.id))
    }

    createDisplayElement = (year, month) => {
        let monthEventsObj = this.getMonthEvents(year, month)
        let monthEventsElement = MonthEvents(year, monthShortName[month], days_of_month(month, year))
        let yearObj = this.displayElements[year]

        if(!yearObj){
            this.displayElements[year] = {[month]: monthEventsElement}
        }else yearObj[month] = monthEventsElement

        this.setEventsDisplay(monthEventsObj, monthEventsElement, year, month)
        this.setIntersectedEvents(month, year, monthEventsObj, monthEventsElement)

        return monthEventsElement
    }

    setIntersectedEvents = (month, year, monthEventsObj, monthEventsElement) => {
        let intersectedEvents = this.getIntersectedEvents(month, year)
        let length = intersectedEvents.length

        if(length>0){
            let currentMonth, currentYear, currentMonthObj

            for(let i=0; i<length; i++){
                let event = intersectedEvents[i]
                let startDate = moment.unix(event.start_at)

                if(startDate.year() !== currentYear){
                    currentYear = startDate.year()
                    currentMonth = startDate.month()
                    currentMonthObj = this.getMonthEvents(currentYear, currentMonth)
                }else if(startDate.month() !== currentMonth){
                    currentMonth = startDate.month()
                    currentMonthObj = this.getMonthEvents(currentYear, currentMonth)
                }

                let agendaEvent = this.getAgendaEventInArray(event, currentMonthObj[startDate.date()])
                if(agendaEvent) this._addIntersectedEvent(agendaEvent, month, year, monthEventsObj, monthEventsElement)
            }
        }
    }
    
    setEventsDisplay = (monthEvents, monthEventElement, year, month) => {
        let keys = Object.keys(monthEvents)
        let length = keys.length

        for(let i=length-1; i>=0; i--){
            let day = keys[i]
            this._displayDayEvents(monthEvents[day], monthEvents, monthEventElement, year, month, parseInt(day))
        }
    }

    _displayDayEvents = (dayEvents, monthEventsObj, monthEventElement, year, month, day) => {
        let length = dayEvents.length
        let dayEventsElement = this.getDayEvents(monthEventElement, day)

        for(let i=0; i<length; i++){
            let event = dayEvents[i]
            if(event.end_at) this._displayDayEventWithEndDate(i, event, dayEventsElement, monthEventsObj, monthEventElement, month, year)
            else this.addToDisplay(i, dayEventsElement, this.getEventCard(event))
        }

        if(length>0) this.calendar.markAsBusy(year, month, day)

        dayEventsElement.classList.remove("no-events")
    }

    _displayDayEventWithEndDate = (position, agendaEvent, dayElement, monthEventsObj, monthEventElement, month, year) => {
        let startDate = moment.unix(agendaEvent.start_at)
        let endDate = moment.unix(agendaEvent.end_at)

        if(endDate.isAfter(startDate, "day")){
            this._addEventWithEndDate(agendaEvent, monthEventsObj, monthEventElement, month, year, startDate, endDate)
        }else this.addToDisplay(position, dayElement, this.getEventCard(agendaEvent))
    }

    getEventCard = (agendaEvent, displayTimeFunction=undefined) => EventCard(agendaEvent, agendaEvent.id, this.removeEvent, this.updateEventTitle, displayTimeFunction)

    _changeEventCardTime = (eventCard, time) => {
        eventCard.children[3].innerText = time
    }

    _addNewEventWithEndDate = (agendaEvent, startDate, monthElements=undefined) => {
        let endDate = moment.unix(agendaEvent.end_at)

        if(startDate.isSame(endDate, "day")) this._addEvent(startDate.date(), startDate.month(), startDate.year(), agendaEvent, monthElements)
        else{
            let month, year, monthEventElement, monthEventsObj
            agendaEvent.children = []
    
            while(month !== startDate.month() && !startDate.isAfter(endDate, "month")){
                month = startDate.month()
                year = startDate.year()
                monthEventsObj = this.getElement(this.events, year, month)
    
                if(monthEventsObj){
                    monthEventElement = this.getElement(this.displayElements, year, month)
        
                    if(monthEventElement) this._addToEventsAndDisplay(agendaEvent, monthEventsObj, monthEventElement, month, year, startDate, endDate)
                    else this._addOnlyToEvents(agendaEvent, monthEventsObj, month, startDate, endDate)
                }else{
                    startDate.add(1, "month")
                    startDate.date(1)
                }
            }
    
            if(startDate.isSame(endDate, "month")){
                let children = agendaEvent.children
                this._changeEventCardTime(children[children.length-1], `Ends at ${endDate.format("HH:mm")}`)
            }
    
            if(monthElements){
                let startElement = agendaEvent.children[0]
                this._changeEventCardTime(startElement, `Starts at ${startDate.format("HH:mm")}`)
                return startElement
            }else return undefined
        }
    }

    _addIntersectedEvent = (agendaEvent, month, year, monthEventsObj, monthEventsElement) => {
        let startDate = moment([year, month, 1])
        let endDate = moment.unix(agendaEvent.end_at)

        if(!agendaEvent.children) agendaEvent.children = []

        this._addToEventsAndDisplay(agendaEvent, monthEventsObj, monthEventsElement, month, year, startDate, endDate)

        if(startDate.month() === month){
            let children = agendaEvent.children
            this._changeEventCardTime(children[children.length-1], `Ends at ${endDate.format("HH:mm")}`)
        }
    }

    _addEventWithEndDate = (agendaEvent, monthEventsObj, monthEventElement, month, year, startDate, endDate) => {
        // if(agendaEvent.children){
        //     let event = this.getEventCard(agendaEvent, (_, time) => {time.innerText = "All"})
        //     agendaEvent.children.push(event)
        //     this.addToDisplay(position, dayEvents, event)
        // }else return this._addNewEventWithEndDate(agendaEvent, startDate, monthElements)
        let numChildren = 0, children

        if(!agendaEvent.children){
            children = []
            agendaEvent.children = children
        }else{
            children = agendaEvent.children
            numChildren = children.length
        }

        this._addToEventsAndDisplay(agendaEvent, monthEventsObj, monthEventElement, month, year, startDate, endDate)
        
        this._changeEventCardTime(children[numChildren>0?numChildren-1:0], `Starts at ${startDate.format("HH:mm")}`)
        if(startDate.isSame(endDate, "month")){
            this._changeEventCardTime(children[children.length-1], `Ends at ${endDate.format("HH:mm")}`)
        }
    }

    _addToEventsAndDisplay = (agendaEvent, monthEventsObject, monthEventsElement, month, year, startDate, endDate) => {
        let children = agendaEvent.children

        while(!startDate.isAfter(endDate, "day") && startDate.month() === month){
            children.push(this._addEvent(startDate.date(), month, year, agendaEvent, monthEventsObject, (_, time) => {time.innerText = "All Day"}, monthEventsElement))
            startDate.add(1, "days")
        }
    }

    _addOnlyToEvents = (agendaEvent, monthEventsObject, month, startDate, endDate) => {
        while(!startDate.isAfter(endDate, "day") && startDate.month() === month){
            this.addToEventArray(agendaEvent, monthEventsObject, startDate.date())
            startDate.add(1, "days")
        }
    }

    updateDisplay = (year, month, day=undefined) => {
        let yearObjs = this.displayElements[year]
        let monthObj

        if(!yearObjs){
            monthObj = this.createDisplayElement(year, month)
            this.displayElements[year] = {[month]: monthObj}
        }else{
            monthObj = yearObjs[month]
            if(monthObj === undefined){
                monthObj = this.createDisplayElement(year, month)
                yearObjs[month] = monthObj
            }
        }

        cleanAppend(this.displayDiv, monthObj)
        if(day) document.getElementById(`day-${day}`).focus()
    }
}