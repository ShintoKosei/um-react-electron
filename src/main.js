// Modules to control application life and create native browser window
const { app, shell, BrowserWindow, Menu, dialog } = require('electron')
const path = require('path')
const { electronApp, optimizer } = require('@electron-toolkit/utils')

let name, mainWindow;

function downloadURL(url, filepath) {
    return new Promise((resolve, reject) => {
        name = filepath;
        mainWindow.webContents.downloadURL(url);
        mainWindow.webContents.session.once('will-download', (event, item) => {
            item.once('done', (event, state) => {
                if (state === 'completed') {
                    resolve();
                } else {
                    reject(new Error(`Download failed: ${state}`));
                }
            });
        });
    });
}

async function downloadAll() {
    console.log('保存全部')
    const links = await mainWindow.webContents.executeJavaScript(`
            Array.from(document.querySelectorAll('a[href^="blob"]')).map(a => ({
                href: a.href,
                download: a.download
            }))
        `);
    console.log(links);
    // Ask for a directory to save all files
    const { filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (!filePaths || !filePaths.length) {
        return;
    }
    for (const link of links) {
        try {
            await downloadURL(link.href, path.join(filePaths[0], link.download));
            console.log(`Downloaded ${link.download}`);
        } catch (error) {
            console.log(`Failed to download ${link.download}: ${error.message}`);
        }
    }
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        // autoHideMenuBar: true,
        // frame: false, // 隐藏标题栏
        ...(process.platform === 'linux' || process.platform === 'win32' ? {
            icon: path.join(__dirname, '../resources/icon.png')
        } : {}),
        ...(process.platform === 'darwin' ? {
            titleBarStyle: 'hidden' // 隐藏 macOS 的默认标题栏
        } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            nodeIntegration: true
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    mainWindow.webContents.session.on('will-download', (event, item) => {
        if (name) {
            item.setSavePath(name);
            name = null;
        }

        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed')
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused')
                } else {
                    console.log(`Received bytes: ${item.getReceivedBytes()}`)
                }
            }
        });

        item.once('done', (event, state) => {
            if (state === 'completed') {
                console.log('Download successfully')
            } else {
                console.log(`Download failed: ${state}`)
            }
        });
    });

    // and load the index.html of the app.
    // console.log(app.isPackaged)
    // if (!app.isPackaged) {
    //   mainWindow.loadURL('http://localhost:5173')
    // } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'))
        // }

    mainWindow.on('closed', () => {
        // 在窗口关闭时触发before-quit事件以结束进程
        app.quit()
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.dreamfly.um')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    app.on('NSApplicationDelegate.applicationSupportsSecureRestorableState', () => true)

    const menu = Menu.buildFromTemplate([{
        label: '文件',
        submenu: [{
            label: '保存全部',
            click: downloadAll
        }]
    }]);
    Menu.setApplicationMenu(menu);

    createWindow()

    app.on('activate', function() {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
