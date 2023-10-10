from winreg import HKEY_CURRENT_USER, OpenKey, QueryValueEx
from enum import Enum
import os
from .dataTypes import DatabaseInfo

FIREFOX_DATABASE = "places.sqlite"
CHROME_DATABASE = "History"

class SupportedBrowsers(Enum):
    FIREFOX = 0
    CHROME = 1
    UNKNOWN = 2

def get_main_browser():
    try:
        with OpenKey(HKEY_CURRENT_USER, r"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice") as key:
            browser = QueryValueEx(key, "ProgId")[0]
    except FileNotFoundError:
        with OpenKey(HKEY_CURRENT_USER, r"Software\Classes\http\shell\open\command") as key:
            browser = QueryValueEx(key, "ProgId")[0]
    
    return identify_browser(browser)

def identify_browser(browser):
    if("Firefox" in browser): return SupportedBrowsers.FIREFOX
    elif("Chrome" in browser): return SupportedBrowsers.CHROME
    else: return SupportedBrowsers.UNKNOWN

def get_path_history(browser):
    if(browser == SupportedBrowsers.FIREFOX):
        return "Firefox"
    elif(browser == SupportedBrowsers.CHROME):
        return "Chrome"
    else:
        return None

def search_file_in_folders(foldersPath, fileName):
    for folder in foldersPath:
        if(os.path.exists(os.path.join(folder, fileName))):
            return folder

    return None

def search_file_in_folder(folderPath, fileName):
    if(os.path.exists(os.path.join(folderPath, fileName))):
        return True
    else: return False

def get_folders_from_path(directory):
    folders = []

    for item in os.listdir(directory):
        item = os.path.join(directory, item)
        if(os.path.isdir(item)): folders.append(item)
    
    return folders

def get_database_path(browser):
    if(browser == SupportedBrowsers.FIREFOX):
        return get_database_path_firefox()
    elif(browser == SupportedBrowsers.CHROME):
        return get_database_path_chrome()
    else: return None

def get_database_path_firefox():
    path = rf"{os.path.expanduser('~')}\AppData\Roaming\Mozilla\Firefox\Profiles"

    return search_file_in_folders(get_folders_from_path(path), FIREFOX_DATABASE)

def get_database_path_chrome():
    path = rf"{os.path.expanduser('~')}\AppData\Local\Google\Chrome\User Data\Default"

    return path if search_file_in_folder(path, CHROME_DATABASE) else None

def createDatabaseInfo(browser=None):
    if(browser is None): browser = get_main_browser() 

    if(browser == SupportedBrowsers.FIREFOX):
        return DatabaseInfo(get_database_path_firefox(), FIREFOX_DATABASE, SupportedBrowsers.FIREFOX)
    elif(browser == SupportedBrowsers.CHROME):
        return DatabaseInfo(get_database_path_chrome(), CHROME_DATABASE, SupportedBrowsers.CHROME)

    return None