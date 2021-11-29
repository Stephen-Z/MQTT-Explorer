import * as log from 'electron-log'
import * as path from 'path'
import ConfigStorage from '../backend/src/ConfigStorage'
import { app, BrowserWindow, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import { ConnectionManager } from '../backend/src/index'
import { electronTelemetryFactory } from 'electron-telemetry'
import { menuTemplate } from './MenuTemplate'
import buildOptions from './buildOptions'
import { waitForDevServer, isDev, runningUiTestOnCi, loadDevTools } from './development'
import { shouldAutoUpdate, handleAutoUpdate } from './autoUpdater'
import { registerCrashReporter } from './registerCrashReporter'

require('@electron/remote/main').initialize()

registerCrashReporter()

if (!isDev() && !runningUiTestOnCi()) {
  const electronTelemetry = electronTelemetryFactory('9b0c8ca04a361eb8160d98c5', buildOptions)
}

app.commandLine.appendSwitch('--no-sandbox')

autoUpdater.logger = log
log.info('App starting...')

const connectionManager = new ConnectionManager()
connectionManager.manageConnections()

const configStorage = new ConfigStorage(path.join(app.getPath('appData'), app.name, 'settings.json'))
console.log(path.join(app.getPath('appData'), app.name, 'settings.json'))
configStorage.init()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | undefined

async function createWindow() {
  if (isDev()) {
    await waitForDevServer()
    loadDevTools()
  }

  const iconPath = path.join(__dirname, '..', '..', 'icon.png')
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      sandbox: false,
    },
    icon: iconPath,
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      runningUiTestOnCi() && mainWindow.setFullScreen(true)
      mainWindow.show()
    }
  })

  console.log('icon path', iconPath)

  // Load the index.html of the app.
  console.log("is dev =>", isDev())
  if (isDev()) {
    mainWindow.loadURL('http://localhost:8080')
  } else {
    mainWindow.loadFile('app/build/index.html')
  }
  require("@electron/remote/main").enable(mainWindow.webContents)
  // mainWindow.loadURL('http://localhost:8080')

  // Emitted when the window is closed.
  mainWindow.on('close', () => {
    connectionManager.closeAllConnections()
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined
    app.quit()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Menu.setApplicationMenu(menuTemplate)
  createWindow()

  if (shouldAutoUpdate(buildOptions)) {
    handleAutoUpdate()
  }
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
