const { versions } = require('electron')

document.getElementById('node-version').innerText = `Node.js: ${versions.node}`
document.getElementById('chrome-version').innerText = `Chrome: ${versions.chrome}`
document.getElementById('electron-version').innerText = `Electron: ${versions.electron}`