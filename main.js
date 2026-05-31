const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWindow = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.setMenuBarVisibility(false)

  const indexPath = path.join(__dirname, 'dist', 'index.html')
  mainWindow.loadFile(indexPath)
}

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close()
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
