import { createElement, clearChildren, cleanAppend } from "../modules/utils/htmlUtils.js"
import { days_of_month, monthName } from "../modules/utils/dateUtils.js"
import CalendarMonth from "./CalendarMonth.js"

const dayNamesArray = ["d","s","t","q","q","s","s"]

export default class Calendar{
    years = {}
    monthNameElement = createElement("span", "calendar-month-info", "month")
    yearNameElement = createElement("span", "calendar-year-info", "year")
    monthDisplay = createElement("div", "", "calendar-month-display")
    currentDayElement = null
    currentMonthElement = null
    currentFirstDayOfWeek = null
    displayMonthCallback = () => {}
    selectDayCallback = () => {}
    getMonthEvents = () => {}

    constructor(currentDate = new Date()){
        this.currentYear = currentDate.getFullYear()
        this.currentMonth = currentDate.getMonth()
        this.currentDay = currentDate.getDate()
    }

    bindController = (agendaController) => {
        this.displayMonthCallback = agendaController.updateDisplay
        this.selectDayCallback = agendaController.selectDay
        this.getMonthEvents = agendaController.getMonthEvents
    }

    markAsBusy = (year, month, day) => {
        let [firstDayOfWeek, days] = this.getMonthObj(month, year)
        days.children[firstDayOfWeek+day-1].classList.add("busy")
    }

    unmarkBusy = (year, month, day) => {
        let [firstDayOfWeek, days] = this.getMonthObj(month, year)
        days.children[firstDayOfWeek+day-1].classList.remove("busy")
    }

    createMonthObj = (month, year) => {
        let firstDayOfWeek = new Date(year, month, 1).getDay()

        return [firstDayOfWeek, CalendarMonth(firstDayOfWeek, days_of_month(month, year), this.selectDay)]
    }

    getMonthObj = (month, year=this.currentMonth) => {
        let yearObj = this.years[year]
        
        if(!yearObj){
            yearObj = {}
            this.years[year] = yearObj
        }

        let monthObj = yearObj[month]

        if(!monthObj){
            monthObj = this.createMonthObj(month, year)
            yearObj[month] = monthObj
        }
        
        return monthObj
    }

    previousMonth = () => {
        if((--this.currentMonth)<0){
            this.currentMonth = 11
            this.currentYear--
        }

        this._changeMonth()
    }

    nextMonth = () => {
        if((++this.currentMonth)>11){
            this.currentMonth = 0
            this.currentYear++
        }

        this._changeMonth()
    }

    _changeMonth = () => {
        this.updateCalendarInfo()
        this.displayMonth(this.getMonthObj(this.currentMonth, this.currentYear))
    }

    updateCalendarInfo = (month=this.currentMonth, year=this.currentYear) => {
        this.monthNameElement.innerText = monthName[month]
        this.yearNameElement.innerText = year
    }

    displayMonth = (monthObj) => {
        let [startAt, element] = monthObj

        cleanAppend(this.monthDisplay, element)

        this.currentMonthElement = element
        this.currentFirstDayOfWeek = startAt

        this.displayMonthCallback(this.currentYear, this.currentMonth, this.currentDay)
        this.updateMonthWithEvents(this.getMonthEvents(this.currentYear, this.currentMonth))
        this.selectDay(this.currentDay)
    }

    updateMonthWithEvents = (monthEvents=undefined) => {
        if(monthEvents){
            let days = Object.keys(monthEvents)
            let length = days.length
            
            for(let i=0; i<length; i++){
                let dayElement = this.getDayElement(parseInt(days[i]))
                if(dayElement) dayElement.classList.add("busy")
            }
        }
    }

    selectDay = (day) => {
        let element = this.getDayElement(day)

        if(element){
            if(this.currentDayElement) this.currentDayElement.classList.remove("selected")
            this.selectDayCallback(day)

            element.classList.add("selected")
            this.currentDayElement = element
            this.currentDay = day
        }
    }

    getDayElement = (day, firstDayOfWeek = this.currentFirstDayOfWeek) => {
        return this.currentMonthElement.children[firstDayOfWeek+day-1]
    }

    createCalendarElement = (month=this.currentMonth, year=this.currentYear, daysNames = dayNamesArray) => {
        let base = createElement("div", "calendar")

        let calendarTop = createElement("div", "calendar-top")

        let previousBtn = createElement("button", "calendar-previous-btn")
        previousBtn.onclick = this.previousMonth
        previousBtn.innerText = "<"
        
        let nextBtn = createElement("button", "calendar-next-btn")
        nextBtn.onclick = this.nextMonth
        nextBtn.innerText = ">"
        
        let calendarInfo = createElement("div", "calendar-info")
        calendarInfo.append(this.monthNameElement)
        calendarInfo.append(document.createTextNode(", "))
        calendarInfo.append(this.yearNameElement)
        this.updateCalendarInfo()

        calendarTop.append(previousBtn)
        calendarTop.append(calendarInfo)
        calendarTop.append(nextBtn)

        let calendarBottom = createElement("div", "calendar-bottom")
        let daysOfWeek = createElement("div", "days-of-week")

        for(let i=0; i<7; i++){
            let div = createElement("div", "days-of-week")
            div.innerText = daysNames[i]
            daysOfWeek.append(div)
        }

        calendarBottom.append(daysOfWeek)
        calendarBottom.append(this.monthDisplay)
        this.displayMonth(this.getMonthObj(month, year))

        base.append(calendarTop)
        base.append(calendarBottom)

        return base
    }
}