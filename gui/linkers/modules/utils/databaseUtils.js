import { date_to_firefoxDate, firefoxDate_to_date, date_to_ChromeDate, chromeDate_to_date, date_before_x_days } from "./dateUtils.js"
import { SupportedBrowsers } from "./browserUtils.js"

async function _get_urls(query, databasePath){
    let connection = null
    
    try{
        connection = new Database(databasePath, { verbose: console.log })
        return connection.all(query)
            .then(data => {
                console.log(data);
                return data.map(obj => obj.url);
            })
            .catch(err => {
                console.log(err);
                return [];
            })
    }finally{
        if(connection) connection.close()
    }

    return []
}

function get_urls_from_firefox(startDate, endDate, databaseInfo){
    startDate = date_to_firefoxDate(startDate)
    endDate = date_to_firefoxDate(endDate)
    let query = `SELECT url FROM moz_places WHERE last_visit_date BETWEEN ${startDate} AND ${endDate}`

    return _get_urls(query, databaseInfo.get_path())
}

function get_urls_from_chrome(startDate, endDate, databaseInfo){
    startDate = date_to_ChromeDate(startDate)
    endDate = date_to_ChromeDate(endDate)
    let query = `SELECT url FROM urls WHERE last_visit_time BETWEEN ${startDate} AND ${endDate}`

    return _get_urls(query, databaseInfo.get_path())
}

function get_urls_from_interval(startDate, endDate, databaseInfo){
    if(databaseInfo.browser == SupportedBrowsers.FIREFOX)
        return get_urls_from_firefox(startDate, endDate, databaseInfo)
    else if(databaseInfo.browser == SupportedBrowsers.CHROME)
        return get_urls_from_chrome(startDate, endDate, databaseInfo)
    else return null
}

async function get_last_id(connection, tableName){
    try{
        const data = await connection.get(`SELECT seq FROM sqlite_sequence WHERE name='${tableName}'`)
        return data["seq"]
    }catch (error){
        console.log(error)
        return null
    }
}

function insert(connection, tableName, params){
    return connection.prepare(`INSERT INTO ${tableName} VALUES (${Array(params.length).fill("?").join(", ")})`).run(...params)
}

export { get_urls_from_chrome, get_urls_from_firefox, get_urls_from_interval, get_last_id, insert }