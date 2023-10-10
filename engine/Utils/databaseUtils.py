import sqlite3
from .dateUtils import date_to_firefoxDate, firefoxDate_to_date, date_to_ChromeDate, chromeDate_to_date, date_before_x_days
from .browserUtils import SupportedBrowsers, createDatabaseInfo, get_main_browser

def get_urls(query, databasePath):
    with sqlite3.connect(databasePath) as connection:
        cursor = connection.cursor()
        cursor.execute(query)
        return [item[0] for item in cursor.fetchall()]

def get_urls_from_firefox(startDate, endDate, databaseInfo):
    startDate = date_to_firefoxDate(startDate)
    endDate = date_to_firefoxDate(endDate)
    query = f"SELECT url FROM moz_places WHERE last_visit_date BETWEEN {startDate} AND {endDate}"

    return get_urls(query, databaseInfo.get_path())

def get_urls_from_chrome(startDate, endDate, databaseInfo):
    startDate = date_to_ChromeDate(startDate)
    endDate = date_to_ChromeDate(endDate)
    query = f"SELECT url FROM urls WHERE last_visit_time BETWEEN {startDate} AND {endDate}"

    return get_urls(query, databaseInfo.get_path())

def get_urls_from_interval(startDate, endDate, databaseInfo):
    if(databaseInfo.browser == SupportedBrowsers.FIREFOX):
        return get_urls_from_firefox(startDate, endDate, databaseInfo)
    elif(databaseInfo.browser == SupportedBrowsers.CHROME):
        return get_urls_from_chrome(startDate, endDate, databaseInfo)
    else: return None

def get_last_id(cursor, tableName):
    try:
        id = cursor.execute(f"SELECT seq FROM sqlite_sequence WHERE name='{tableName}'").fetchone()
        return id[0] if id else None
    except sqlite3.OperationalError:
        return None

def insert(cursor, tableName, values, params=None):
    if(params):
        cursor.execute(f"INSERT INTO {tableName} VALUES({values})", params)
    else: cursor.execute(f"INSERT INTO {tableName} VALUES({values})")