import { get_favicon_src, get_img_src, get_product_prices_from_db } from "./modules/shop/shopFacade.js"
import { convert_prices_from_db } from "./modules/utils/priceFuncs.js"
import PricesTableData from "./components/PricesTableData.js"
import { getDecimalPlaces } from "./modules/consts/decimalPlaces.js"
import { cleanAppend, clearChildren } from "./modules/utils/htmlUtils.js"
import OddPageSelector from "./components/OddPageSelector.js"
import { get_normal_date, monthName } from "./modules/utils/dateUtils.js"
import Counter from "./components/Counter.js"
import { SHOP_PRODUCTS } from "./modules/consts/databaseConsts.js"

let productUrl, product, decimalPlaces, prices, paginatedPrices, paginatedPricesElements, currency, chart, updateTimeout, updateCounter

let getPriceAndLabelFuncs = {
    0: () => getPricesAndLabelsXDays(30),
    1: () => getPricesAndLabelsXDays(60),
    2: () => getPricesAndLabelsXMonths(6),
    3: () => getPricesAndLabelsXMonths(12)
}

window.productSetup = () => {
    changeTitleBarBackground("rgb(255, 255, 255)")
    changeContentBackground("rgb(255, 255, 255)")

    let shopInfo
    ({product, shopInfo} = window.props)
    productUrl = product.url
    currency = product.price.currency
    decimalPlaces = getDecimalPlaces(currency)
    paginatedPrices = []
    paginatedPricesElements = {}
    chart = undefined
    updateTimeout = undefined
    updateCounter = new Counter(product.update_in, 1, 365)
    
    setupProduct(product, shopInfo)
    
    prices = convert_prices_from_db(get_product_prices_from_db(connection, product.id, true))
    setupMainPrices(analysePrices(prices))
    setupPricesTable(prices)
    setupGraph()
}

window.unloadProduct = () => {
    if(product.update_in !== updateCounter.currentValue){
        updateProductUpdateIn(product.id, updateCounter.currentValue)
        product.update_in = updateCounter.currentValue
    }
}

$(document).ready(() => {
    productSetup()
    setRenderFunction(window.productSetup)
    setUnloadFunction(window.unloadProduct)
})

function updateProductUpdateIn(id, value){
    database.prepare(`UPDATE ${SHOP_PRODUCTS} SET update_in=${value} WHERE id=${id}`).run()
}

function getPaginatePrices(prices, numPricesPerPage=30){
    decimalPlaces = getDecimalPlaces(prices[0].currency)
    let length = prices.length
    let times = Math.ceil(length/numPricesPerPage)
    let array = []

    for(let i=0, start=0; i<times; i++, start+=numPricesPerPage){
        array.push(prices.slice(start, start+numPricesPerPage))
    }

    return array
}

function getPaginatePricesElement(index){
    let element = paginatedPricesElements[index]

    if(!element){
        let lastPrice = paginatedPrices[index+1]
        if(lastPrice) lastPrice = lastPrice[0].value

        element = PricesTableData(paginatedPrices[index], decimalPlaces, lastPrice)
        paginatedPricesElements[index] = element
    }

    return element
}

function setPaginatedPrice(pageNumber){
    cleanAppend(document.getElementById("prices-table"), getPaginatePricesElement(pageNumber-1))
}

function setupGraph(){
    if(chart) chart.destroy()
    
    let [priceArray, labelArray] = getPricesAndLabels()

    var ctx = document.getElementById('price-graph').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            "labels": labelArray,
            "datasets": [{
                label: currency,
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: priceArray
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    ticks: {
                        display: false
                    },
                    gridLines: {
                        display: false
                    },
                    offset: priceArray.length === 1
                }],
                yAxes: [{
                    ticks: {
                        display: false
                    },
                    gridLines: {
                        display: false
                     }
                }]
            },
            legend: {
                display: false
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 5,
                    bottom: 0
                }
            }
        }
    });
}

function setupPricesTable(prices){
    paginatedPrices = getPaginatePrices(prices, 10)
    let element = document.getElementById("prices-page-selector")
    clearChildren(element)

    if(paginatedPrices.length>1){
        element.append(new OddPageSelector(paginatedPrices.length, 3, 1, setPaginatedPrice))
    }else document.getElementById("prices-table").append(PricesTableData(paginatedPrices[0], decimalPlaces))
}

function setupMainPrices(analysePrices){
    let {highest, lowest, current} = analysePrices

    document.getElementById("product-price").innerHTML =  `${current.currency}&#8201;${current.value.toFixed(decimalPlaces)}`
    document.getElementById("lowest-price").innerHTML = `${lowest.currency}&#8201;${lowest.value.toFixed(decimalPlaces)}`
    document.getElementById("highest-price").innerHTML = `${highest.currency}&#8201;${highest.value.toFixed(decimalPlaces)}`
}

function analysePrices(prices){
    let highest, lowest
    highest = lowest = prices[0]
    let len = prices.length

    for(let i=len-1; i>0; i--){
        let price = prices[i]
        
        if(price.value>highest.value) highest = price
        else if(price.value<lowest.value) lowest = price
    }

    return {highest, lowest, current: prices[len-1]}
}

function setupProduct(product, shopInfo){
    document.getElementById("product-img").src = get_img_src(product.id)

    document.getElementById("favicon").src = get_favicon_src(shopInfo.id)
    let siteNameElement = document.getElementById("website-name")
    siteNameElement.innerText = shopInfo.name
    siteNameElement.onclick = (event) => {openInBrowser(shopInfo.url, event)}

    document.getElementById("product-name-a").onclick = (event) => {openInBrowser(product.url, event)}
    document.getElementById("product-name").innerText = product.name

    document.getElementById("website-btn").onclick = (() => {openWebsite(product.url)})

    document.getElementById("update-rate").append(updateCounter.createCounter())
}

window.openWebsite = (url) => {
    if(url) openInBrowser(url)
}

function findStartingPrice(prices, startTimestamp){
    let start = 0, length = prices.length, end = length-1
    let diff = end-start

    while(diff>1){
        let middle = start + (diff>>1)
        let date = prices[middle].date

        if(date === startTimestamp){
            while(middle>length){
                middle++
                if(price[midle].date<startTimestamp) return middle-1
            }

            return middle
        }else if(date<startTimestamp) end = middle
        else start = middle

        diff = end-start
    }

    return prices[start].date<startTimestamp?start-1:start
}

function getPricesAndLabels(){
    let a = getPriceAndLabelFuncs[document.getElementById("time-select").selectedIndex]()
    return a
}

function _getPricesAndLabelsDays(array){
    let pricesArray = []
    let labelArray = []
    let length = array.length

    for(let i=length-1; i>=0; i--){
        let price = array[i]
        pricesArray.push(price.value)
        labelArray.push(get_normal_date(moment.unix(price.date)))
    }

    return [pricesArray, labelArray]
}

function _getPricesAndLabelsMonths(array){
    let pricesArray = []
    let labelArray = []
    let length = array.length
    let date = moment.unix(array[length-1].date)
    let currentSum = 0
    let currentNumberElements = 0

    for(let i=length-1; i>=0; i--){
        let price = array[i]
        let currentDate = moment.unix(price.date)

        if(!date.isSame(currentDate, "month")){
            pricesArray.push((currentSum/currentNumberElements).toFixed(decimalPlaces))
            labelArray.push(`${monthName[date.month()]}, ${date.year()}`)
            currentSum = price.value
            currentNumberElements = 1
            date = currentDate
        }else{
            currentSum += price.value
            currentNumberElements++
        }
    }

    if(currentNumberElements>0){
        pricesArray.push((currentSum/currentNumberElements).toFixed(decimalPlaces))
        labelArray.push(`${monthName[date.month()]}, ${date.year()}`)
    }

    return [pricesArray, labelArray]
}

function getPricesAndLabelsXDays(days){
    let array = getPricesStartingAt(moment({hour:0, minutes:0, seconds:0}).subtract(days, "days").unix())
    return _getPricesAndLabelsDays(array)
}

function getPricesAndLabelsXMonths(months){
    let array = getPricesStartingAt(moment({hour:0, minutes:0, seconds:0}).subtract(months, "months").unix())
    return _getPricesAndLabelsMonths(array)
}

function getPricesStartingAt(timestamp){
    return prices[prices.length-1].date<timestamp ? prices.slice(0, findStartingPrice(prices, timestamp)): prices
}

window.handleSelectChange = (event) => {
    setupGraph()
}

// window.addEventListener("unload", function() {
//     database.prepare(`INSERT INTO ${LAST_UPDATE_DATE} VALUES(?,?,?)`).run([null, "meu cu", 0])
// });