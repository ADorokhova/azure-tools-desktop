exports.create = function ($rootScope, $timeout, Notification, dialog, fileService) {
    'use strict';

    var self = {};
    var ElectronSettings;

    ElectronSettings = require('electron-settings');

    var application = require('electron').remote.app;
    var path = application.getPath('userData');
    self.current = null;
    self.recreate = function () {
        require('electron').remote.getCurrentWindow().reload();
    };

    try {
        self.current = new ElectronSettings({
            configDirPath: path
        });
    } catch (e) {
        dialog.showMessageBox({
            type: 'error',
            title: 'Azure Tools',
            buttons: ['Yes, I want clean up config and work safely', 'No, I will fix settings file by myself'],
            message: String.format('Error occured trying to read application settings from "{0}". {1}Do you want to clean up settings file to continue your work safely?\n\nDetails: {2}', application.getPath('userData'), '\n\n', e.message),
        },
        function (x) {
            if (x === 0) {
                fileService.writeToFile(require('path').join(application.getPath('userData'), 'settings.json'), '{}', function success() {
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Azure Tools',
                        buttons: ['Ok'],
                        message: 'Settings cleaned up successsfully'
                    });
                });
            }
        });
    }

    return self;
};