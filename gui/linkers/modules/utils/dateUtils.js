const monthShortName = ["Jan", "Fev", "Mar", "Apr", "May", "Jun", "Jul", "Ago", "Sep","Oct","Nov","Dec"]

const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
"November", "December"]

const month_days = [31,28,31,30,31,30,31,31,30,31,30,31]

function day_of_week(dayOfWeekFirstDay, numDaysInMonth){
    return (dayOfWeekFirstDay+(numDaysInMonth-1))%7
}

function days_of_month(month, year=-1){
    if(month === 1 && isLeapYear(year)) return 29

    return month_days[month]
}

function isLeapYear(year){
    return (year%4)?false:((year%100)?true:((year%400)?false:true))
}

function get_timestamp(year, month, day=1, hours=0, minutes=0, seconds=0){
    return moment([year, month, day, hours, minutes, seconds]).unix()
}

function get_formatted_time(date){
    return `${date.getHours().toString().padStart(2,0)}:${date.getMinutes().toString().padStart(2,0)}`
}

function _change_date(date=null, days){
    let newDate = date? new Date(date): new Date()
    newDate.setDate(newDate.getDate() + days)
    return newDate
}

function date_after_x_days(daysAfter, date=null){
    return _change_date(date, daysAfter)
}

function date_before_x_days(daysBefore, date=null){
    return _change_date(date, -daysBefore)
}

function date_to_firefoxDate(date = new Date()){
    return (date.getTime()*1000)
}

function firefoxDate_to_date(firefoxDate){
    return new Date(firefoxDate/1000)
}

function date_to_ChromeDate(date = datetime.now()){
    return (date.timestamp() + 11644473600)*1000000
}

function chromeDate_to_date(ChromeDate){
    return datetime.fromtimestamp(ChromeDate/1000000 - 11644473600)
}

function get_date(day, month=null, year=null, hours=null, minutes=null){
    let date = new Date()
    return new Date(year?year:date.getFullYear(), month?month:date.getMonth(), day, hours?hours:date.getHours(), minutes?minutes:date.getMinutes())
}

function get_full_year(year){
    let newYear = typeof year === "string"? year: String(year)

    if(newYear.length<4)
        return int(`${String(new Date().getFullYear()).slice(0, 4-newYear.length)}${newYear}`)
    else return year
}

function get_formatted_date(date = new Date()){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function get_normal_date(moment){
    return `${moment.date()} ${monthName[moment.month()] }, ${moment.year()}`
}

function isSameDateByField(start, end){
    return start.getDate() === end.getDate() && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
}

function isSameDate(start, end){
    return start.getTime() === end.getTime()
}

export {date_after_x_days, date_before_x_days, date_to_firefoxDate, date_to_ChromeDate, firefoxDate_to_date, 
    chromeDate_to_date, get_date, get_full_year, get_formatted_date, get_normal_date, day_of_week, days_of_month, 
    isLeapYear, monthShortName, monthName, get_timestamp, get_formatted_time, isSameDate, isSameDateByField }