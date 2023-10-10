from sys import stdin, stdout
from Shop.shopFacade import get_product, get_json_product
from Utils.shopDataTypes import ProductProperties, TitleProperties, PriceProperties, ShopWebsiteInfo
from os import rename, getcwd
from os.path import join
import sqlite3
from datetime import date
from Utils.shopUtils import store_product, store_shop_website, get_main_url
from Utils.databaseConsts import SHOP_WEBSITES, SHOP_TITLE_IDS, SHOP_IMG_IDS

shopInfos = {}

last_product = None
last_shopInfo = None
connection = None
unknown_website = False

def get_shop_info(main_url):
    shopInfo = shopInfos.get(main_url, None)

    if(not shopInfo):
        cursor = connection.cursor()
        infos = cursor.execute(f"SELECT * FROM {SHOP_WEBSITES} WHERE url = '{main_url}'").fetchone()
        if(infos):
            titleIds = cursor.execute(f"SELECT tag_id FROM {SHOP_TITLE_IDS} WHERE website_id={infos[0]}").fetchall()
            titleIds = set(map(lambda x: x[0], titleIds)) if titleIds else None
            imgIds = cursor.execute(f"SELECT tag_id FROM {SHOP_IMG_IDS} WHERE website_id={infos[0]}").fetchall()
            imgIds = set(map(lambda x: x[0], imgIds)) if imgIds else None
            
            shopInfo = ShopWebsiteInfo.from_db(*infos, titleIds, imgIds)

    return shopInfo

def simple():
    url = stdin.readline().rstrip("\n")

    main_url = get_main_url(url)

    last_product, last_shopInfo = get_product(url, main_url)

    print(get_json_product(last_product, last_shopInfo.url_id, last_shopInfo.name))
    stdout.flush()

def handle_item():
    url = stdin.readline().rstrip("\n")
    global last_product, last_shopInfo, unknown_website

    main_url = get_main_url(url)
    shopInfo = get_shop_info(main_url)
    unknown_website = False if shopInfo else True
    if(shopInfo):
        shopInfos[main_url] = shopInfo

    last_product, last_shopInfo = get_product(url, main_url, shopInfo)

    print(get_json_product(last_product, last_shopInfo.url_id, last_shopInfo.name))
    stdout.flush()

def handle_show_item():
    print(get_json_product(last_product, last_shopInfo.url_id, last_shopInfo.name))
    stdout.flush()

def handle_save_item():
    website_id = None
    if(last_product and last_shopInfo):
        cursor = connection.cursor()

        if(unknown_website): 
            store_shop_website(cursor, last_shopInfo, getcwd())
            shopInfos[last_shopInfo.url] = last_shopInfo
        
        website_id = last_shopInfo.website_id
        store_product(cursor, last_product, last_shopInfo)
        
        connection.commit()

    print(website_id)
    stdout.flush()

table = {
    "get_item": handle_item,
    "show_last_item": handle_show_item,
    "save_item": handle_save_item,
    "simple": simple
}

def get_in():
    message = stdin.readline()
    return message.rstrip("\n")

def main():
    with sqlite3.connect("shopTeste.sqlite") as conn:
        global connection
        connection = conn
        while(True):
            opt = get_in()
            if(opt != "exit"):
                if(opt in table): table[opt]()
            else: 
                print("exit")
                break
        

if __name__ == "__main__":
    main()