from datetime import timedelta, datetime, time

def date_after_x_days(daysPassed, date=datetime.now()):
    return date + timedelta(days=daysPassed)

def date_before_x_days(daysBefore, date=datetime.now()):
    return date - timedelta(days=daysBefore)

def date_to_firefoxDate(date = datetime.now()):
    return (date.timestamp()*1000000)

def firefoxDate_to_date(firefoxDate):
    return datetime.fromtimestamp(firefoxDate/1000000)

def date_to_ChromeDate(date = datetime.now()):
    return (date.timestamp() + 11644473600)*1000000

def chromeDate_to_date(ChromeDate):
    return datetime.fromtimestamp(ChromeDate/1000000 - 11644473600)

def get_date(day, month=None, year=None):
    today = datetime.today().date()

    if(year is not None):
        year = get_year(year)
        return today.replace(day=day, month=month, year=year)
    elif(month is not None):
        return today.replace(day=day, month=month)
    else:
        return today.replace(day=day)

def get_year(year):
    string = str(year)

    if(len(string)<4):
        currentYear = str(datetime.today().year)[0:4-len(string)]
        year = int("".join([currentYear, string]))

    return year
def get_time(hour, minute):
    return time(hour, minute)