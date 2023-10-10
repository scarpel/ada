import { DatabaseInfo } from "./dataTypes.js"
const PythonShell = window.parent.PythonShell

let options = {
    scriptPath: window.parent.path_join(window.parent.mainPath, "/linkers/modules/python")
}

const SupportedBrowsers = {
    FIREFOX: 0,
    CHROME: 1,
    UNKNOWN: 2
}

function identify_browser(browser){
    if(browser === "FIREFOX") return SupportedBrowsers.FIREFOX
    else if(browser === "CHROME") return SupportedBrowsers.CHROME
    else return SupportedBrowsers.UNKNOWN
}

async function get_browser_info(browser = null){
    let result = await new Promise((resolve, reject) => 
        PythonShell.run('getBrowserInfo.py', {...options, args: browser?[browser]:[""]}, (err, message) => {
            if(err)
                return reject(err)
            else
                return resolve(message[0]?JSON.parse(message[0]):null)
        })
    )

    return result? new DatabaseInfo(result.path, result.fileName, identify_browser(result.browser)): null
}

export { get_browser_info, SupportedBrowsers }