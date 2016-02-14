exports.create = function (appSettings, Notification) {
    'use strict';

    return new function() {
        var self = this;
        
        self.save = function (host, port, password) {
            appSettings.current.set('redis.connections', [{
                host: host,
                port: port,
                password: password
            }]);
        };

        self.get = function () {
            try {
                if (appSettings && appSettings.current) {
                    var allConnections = appSettings.current.get('redis.connections');
                    return allConnections && allConnections.length > 0 ? allConnections[0] : null;
                } else {
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
            var redisSettings = self.get();
            console.log(redisSettings);
            return !redisSettings
               || (redisSettings.host === null || redisSettings.host === '')
               && (redisSettings.password === null || redisSettings.password === '');
        };
    }
};