// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

// Axios
window.Axios = require("axios")
window.Axios.defaults.adapter = require('axios/lib/adapters/http')

//argon2
window.argon2 = require("argon2")

// puppeteer
window.puppeteer = require('puppeteer')

// puppeteer-cluster
const { Cluster } = require("puppeteer-cluster")
window.Cluster = Cluster

// better-sqlite3
// const sqlite3 = require("sqlite3")
// window.database = new sqlite3.Database("shopTeste.sqlite", (err) => {
//   if(err) console.log("Deu ruim no DB!");
//   else console.log("DB conectado com sucesso!");
// })
const NeoSQLite = require("./linkers/classes/NeoSQLite");
window.Database = NeoSQLite;
window.database = new NeoSQLite("shopTeste.sqlite", (err) => {
  if(err) console.log("Deu ruim, DB!");
  else console.log("Deu bom, DB!")
})

window.database.run("PRAGMA journal_mode = WAL")
window.database.run("PRAGMA synchronous = NORMAL")

//Chart.js
window.Chart = require('chart.js')

// Path
window.path_join = require("path").join

// fs
const { existsSync, createWriteStream, unlinkSync, readFileSync, writeFileSync } = require("fs")

window.existsSync = existsSync
window.createWriteStream = createWriteStream
window.unlinkSync = unlinkSync
window.read = readFileSync
window.write = writeFileSync

// moment
window.moment = require("moment")

// Open
const { shell } = require("electron")
window.openInBrowser = (url, event=undefined) => {
  if(event) event.preventDefault(); 
  shell.openItem(url);
}

// PythonShell
const {PythonShell} = require("python-shell")
window.PythonShell = PythonShell

// Remote
var remote = require("electron").remote
window.mainPath = __dirname
window.getGlobal = remote.getGlobal
const win = remote.BrowserWindow.getFocusedWindow()

window.minimize = () => { win.minimize() }
window.maximize = () => { win.isMaximized()? win.unmaximize(): win.maximize() }
window.close = () => {  remote.BrowserWindow.getFocusedWindow().close() }
window.reload = () => { win.reload() }

window.addEventListener('DOMContentLoaded', () => {
  // jQuery
  window.$ = require("jquery")

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})


