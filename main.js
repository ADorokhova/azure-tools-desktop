'use strict';
const electron = require('electron');
const dialog = require('dialog');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const showWindowFrame = process.platform !== 'win32';
var path = require('path');
var cp = require('child_process');

// Report crashes to our server.
electron.crashReporter.start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
var handleSquirrelEvent = function () {
    if (process.platform != 'win32') {
        return false;
    }

    function executeSquirrelCommand(args, done) {
        var updateDotExe = path.resolve(path.dirname(process.execPath),
            '..', 'update.exe');
        console.log(updateDotExe)
        var child = cp.spawn(updateDotExe, args, {
            detached: true
        });
        child.on('close', function (code) {
            done();
        });
    };

    function install(done) {
        var target = path.basename(process.execPath);
        executeSquirrelCommand(["--createShortcut", target], done);
    };

    function uninstall(done) {
        var target = path.basename(process.execPath);
        executeSquirrelCommand(["--removeShortcut", target], done);
    };

    var squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
            install(app.quit);
            return true;
        case '--squirrel-updated':
            install(app.quit);
            return true;
        case '--squirrel-obsolete':
            app.quit();
            return true;
        case '--squirrel-uninstall':
            uninstall(app.quit);
            return true;
    }

    return false;
};

var checkForGitHubRelease = function () {
    var gh_releases = require('electron-gh-releases');
    var pjson = require('./package.json');
    var options = {
        repo: 'Dorokhov/azure-tools-desktop',
        currentVersion: pjson.version
    }

    var update = new gh_releases(options, function (auto_updater) {
        auto_updater.on('update-downloaded', function (e, rNotes, rName, rDate, uUrl, quitAndUpdate) {
            var dialog = require('dialog');
            dialog.showMessageBox({
                type: 'info',
                buttons: ['OK'],
                title: 'Update Downloaded',
                message: 'We found and downdloaded a new version of the Azure Tools! Once you close this dialog, Azure Tools will automatically update and restart.'
            });

            // Install the update
            quitAndUpdate();
        });
    });

    // Check for updates
    update.check(function (err, status) {
        if (!err && status) {
            update.download();
        }
    });
};

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});


var handleStartupEvent = function () {
    if (process.platform !== 'win32') {
        return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
        case '--squirrel-install':
        case '--squirrel-updated':

            // Optionally do things such as:
            //
            // - Install desktop and start menu shortcuts
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Always quit when done
            app.quit();

            return true;
        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Always quit when done
            app.quit();

            return true;
        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
            app.quit();
            return true;
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
    if (handleSquirrelEvent()) {
        return;
    }

    checkForGitHubRelease();

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        'min-width': 800,
        'min-height': 800,
        frame: showWindowFrame
    });
    
    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/app/index.html`);

    var cfg = require('./envConfig.json');
    if (cfg.env === 'dev') {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});