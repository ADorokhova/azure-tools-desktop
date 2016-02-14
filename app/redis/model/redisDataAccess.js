exports.create = function ($activeDatabase, $redisClientFactory, $redisSettings, $messageBus) {
    'use strict';
    return new function () {
        var self = this;
        var client = null;

        self.createClient = function () {
            var redisSettings = $redisSettings.get();
            if (client !== null) {
                client.quit();
                client.end(true);
            }

            console.log(String.format('creating client host: {0}, port: {1}, password: {2}', redisSettings.host, redisSettings.port, redisSettings.password));
            client = $redisClientFactory(redisSettings.host, redisSettings.port, redisSettings.password);

            if ($activeDatabase.Current !== null) {
                client.select($activeDatabase.Current);
            }
            client.on("error", function (msg) {
                console.log('error ' + msg);
                client.end();
                $messageBus.publish('redis-communication-error', msg);
            });
            client.on("end", function (msg) {
                console.log('end...');
                client.end();
                $messageBus.publish('redis-communication-error', msg);
            });
            client.on("reconnecting", function (msg) {
                console.log('reconnecting...');
            });
            return client;
        };
    };
};