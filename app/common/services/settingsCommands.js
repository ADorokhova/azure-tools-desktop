exports.create =
    function ($rootScope, dialog, fileService, appSettings) {
        var self = this;

        function writeToSettingsFile(data, cb) {
            fileService.writeToFile(appSettings.current.getConfigFilePath(), data, function success() {
                appSettings.recreate(function success() {
                    console.log("The file was saved!");
                    if (cb) {
                        cb();
                    }
                });
            });
        };

        self.import = function (cb) {

            dialog.showOpenDialog({
                filters: [
                    { name: 'json', extensions: ['json'] }
                ]
            }, function (fileNames) {
                if (fileNames === undefined) return;
                var fileName = fileNames[0];
                fileService.readFromFile(fileName, function success(data) {
                    if (!appSettings.current) {
                        appSettings.init();
                    }

                    if (appSettings.current) {
                        console.log(String.format('import data {0} to {1}', data, appSettings.current.getConfigFilePath()));
                        writeToSettingsFile(data, cb);
                    }
                });
            });
        };

        return self;
    };