exports.create = function (appSettings, Notification) {
    'use strict';

    return new function() {
        var self = this;
        
        self.save = function (accountName, accountKey) {
            appSettings.current.set('storage.connections', [{
                accountName: accountName,
                accountKey: accountKey
            }]);
        };

        self.get = function () {
            try {
                if (appSettings && appSettings.current) {
                    var allConnections = appSettings.current.get('storage.connections');
                    console.log('all settings');
                    console.log(allConnections);
                    return allConnections && allConnections.length > 0 ? allConnections[0] : null;
                } else {
                    console.log('no settings');
                    console.log(appSettings);
                    return null;
                }
            } catch (e) {
                Notification.error('Unable to load settings.');
                return null;
            }
        };

        self.getSettingsPath = function () {
            if (appSettings && appSettings.current) {
                return appSettings.current.getConfigFilePath();
            }

            return null;
        };

        self.isEmpty = function () {
            var settings = self.get();
            console.log(settings);
            return !settings
               || (settings.accountName === null || settings.accountName === '')
               && (settings.accountKey === null || settings.accountKey === '');
        };
    }
};