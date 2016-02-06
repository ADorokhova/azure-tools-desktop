exports.create = function($redisDataAccess) {
    'use strict';

    return new function() {
        var self = this;
        self.create = function(key, name, value, cb) {
                self.safeRedisCmd(function(client) {
                    client.hset(key, name, value, cb);
                });
        };

        self.hset = function(key, name, value, cb) {
            self.safeRedisCmd(function(client) {
                console.log(key);
                console.log(name);
                console.log(value);
                client.hset(key, name, value, cb);
            });
        };

        self.hdel = function (key, members, cb) {
            self.safeRedisCmd(function (client) {
                client.hdel(key, members, cb);
            });
        };

        self.replaceMember = function(key, oldName, name, value, cb) {
            self.safeRedisCmd(function(client) {
                console.log(key);
                console.log(name);
                console.log(value);
                client.multi()
                    .hset(key, name, value)
                    .hdel(key, oldName)
                    .exec(function(err, replies) {
                        cb();
                    });
            });
        };

        self.get = function(key, cb) {
            self.safeRedisCmd(function(client) {
                client.hgetall(key, cb);
            });
        };
    };
};