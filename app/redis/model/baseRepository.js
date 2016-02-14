exports.create = function ($redisDataAccess, $utils) {
    'use strict';

    return new function() {
        var self = this;
        self.Utils = $utils;

        self.safeRedisCmd = function(cb) {
            var client = $redisDataAccess.createClient();
            try {
                cb(client);
            } finally {
            }

            return client;
        };

        self.delete = function(keys, cb) {
            self.safeRedisCmd(function(client) {
                client.del(keys, cb);
            });
        };
    };
};