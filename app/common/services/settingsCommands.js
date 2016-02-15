exports.create =
    function ($rootScope, dialog, fileService, appSettings) {
        var self = this;
        self.import = function (cb) {

            dialog.showOpenDialog({
                filters: [
                    { name: 'json', extensions: ['json'] }
                ]
            }, function (fileNames) {
                if (fileNames === undefined) return;
                var fileName = fileNames[0];
                fileService.readFromFile(fileName, function success(data) {
                    console.log(String.format('import data {0} to {1}', data, appSettings.current.getConfigFilePath()));
                    fileService.writeToFile(appSettings.current.getConfigFilePath(), data, function success() {
                        appSettings.recreate(function success() {
                            console.log("The file was saved!");
                            if (cb) {
                                cb();
                            }
                        });
                    });
                });
            });
        };

        return self;
    };