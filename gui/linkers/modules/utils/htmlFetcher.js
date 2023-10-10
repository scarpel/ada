import { HEADERS } from "../consts/consts.js"

const unwantedSet = new Set(['stylesheet', 'image', 'font', 'fetch', "media", "ping"])
const puppeteer = window.parent.puppeteer
const Cluster = window.parent.Cluster
const Axios = window.parent.Axios

const customRequestInfo = {headers: new Headers(HEADERS)}

// async function fetch(url, requestInfo=customRequestInfo, timeout=10):
//     try{
//         async with semaphore, session.get(url, timeout=timeout) as response:
//             return await response.text()
//     }catch(error){
//         console.log(error)
//         return null
//     }
    // except UnicodeDecodeError:
    //     return await response.text(encoding="ISO-8859-1")

async function fetch_js(url, timeout=10, headers=HEADERS){
    let browser = await puppeteer.launch()
    let page = await browser.newPage()

    page.setDefaultNavigationTimeout(timeout); 
    await page.setExtraHTTPHeaders(headers)
    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if(unwantedSet.has(req.resourceType())){
            req.abort();
        }
        else {
            req.continue();
        }
    })

    const response = await page.goto(url)
    let html = response.status() !== 200? null: await page.content()

    browser.close()
    return html
}

async function fetch_all_js(urls, timeout=10){
    timeout *= 1000
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 10
    })

    await cluster.task(async({page, data: url}) => {
        page.setDefaultTimeout(timeout)
        await page.setExtraHTTPHeaders(HEADERS)
        await page.setRequestInterception(true);

        page.on('request', (req) => {
            if(unwantedSet.has(req.resourceType())){
                req.abort();
            }
            else {
                req.continue();
            }
        })

        const response = await page.goto(url)
        return response.status() !== 200? null: await page.content()
    })

    return await Promise.all(
        urls.map(url => cluster.execute(url))
    )
}

async function fetch_all(urls){
    try{
        let promises = []
        let length = urls.length
        for(let i=0; i<length; i++){
            promises.push(fetch(urls[i], customRequestInfo).then(response => (response.ok && !response.redirected)? response.text(): "").catch(error => {console.log(error, urls[i]); return ""}))
        }

        return await Promise.all(promises)
    }catch (error){
        throw (error)
    }
}

async function fetch_html(url){
    return await fetch(url, customRequestInfo).then(response => (response.ok && !response.redirected)? response.text(): "")
}

async function download_img(url, savePath, fileName, fileExtentionWithoutDot){
    if(url && window.parent.existsSync(savePath)){
        return await Axios({
            url,
            method: 'GET',
            responseType: 'stream'
        })
            .then(response => {
                if(response.status === 200){
                    try{
                        response.data.pipe(window.parent.createWriteStream(window.parent.path_join(savePath, `${fileName}.${fileExtentionWithoutDot}`), {flags: "w+"}))
                        return true
                    }catch (err){
                        throw err
                        return false
                    }
                }else return false
            })
            .catch(error => {
                throw error
                return false
            })
    }else{
        return false
    }
}

export { fetch_js, fetch_all_js, fetch_all, download_img, fetch_html }