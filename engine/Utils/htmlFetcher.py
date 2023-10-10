from asyncio import Semaphore, gather, get_event_loop, run, ensure_future
from asyncio.exceptions import TimeoutError
from aiohttp import ClientSession
from requests import get
from .consts import HEADERS
from pyppeteer import launch

async def fetch(semaphore, session, url, timeout=10):
    try:
        async with semaphore, session.get(url, timeout=timeout) as response:
            return await response.text()
    except TimeoutError:
        return None
    except UnicodeDecodeError:
        return await response.text(encoding="ISO-8859-1")

async def fetch_js(url, timeout=10):
    browser = await launch()
    page = await browser.newPage()
    await page.setExtraHTTPHeaders(HEADERS)
    await page.setRequestInterception(True)
    async def intercept(request):
        if (request.resourceType in {'stylesheet', 'image', 'font', 'fetch', "media", "ping"}):
            await request.abort()
        else: await request.continue_()
    page.on('request', lambda req: ensure_future(intercept(req)))

    await page.goto(url, timeout=timeout)
    html = await page.content()
    await page.close()
    await browser.close()
    return html

async def fetch_all_js(urls, timeout=10):
    tasks = []

    for url in urls:
        tasks.append(ensure_future(fetch_js(url, timeout)))
    
    return await gather(*tasks)

async def fetch_all(urls, numSemaphore=600):
    semaphore = Semaphore(numSemaphore)
    tasks = []

    async with ClientSession(headers=HEADERS) as session:
        for url in urls:
            tasks.append(ensure_future(fetch(semaphore, session, url)))
        
        return await gather(*tasks)

def get_html_from_urls(urls):
    return get_event_loop().run_until_complete(fetch_all(urls))
    
def get_html_from_url(url, timeout=10, headers=HEADERS):
    return get(url, timeout=timeout, headers=headers).text

def get_js_html_from_urls(urls, timeout=10):
    return get_event_loop().run_until_complete(fetch_all_js(urls, timeout*1000))
    
def get_js_html_from_url(url, timeout=10):
    return get_event_loop().run_until_complete(fetch_js(url, timeout*1000))
