exports.create = function ($redisDataAccess) {
    'use strict';

    return new function () {
        var self = this;

        self.create = function (key, value, cb) {
            self.safeRedisCmd(function (client) {
                client.sadd(key, value, cb);
            });
        };

        self.sadd = function (key, value, cb) {
            self.safeRedisCmd(function (client) {
                client.sadd(key, value, cb);
            });
        };

        self.update = function (key, oldValue, value, cb) {
            self.safeRedisCmd(function (client) {
                client.multi()
                    .sadd(key, value)
                    .srem(key, oldValue)
                    .exec(function (err, replies) {
                        cb();
                    });
            });
        };

        self.get = function (key, cb) {
            self.safeRedisCmd(function (client) {
                client.smembers(key, cb);
            });
        };
    };
};