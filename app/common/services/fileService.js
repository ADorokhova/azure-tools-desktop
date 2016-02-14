exports.create = function (Notification) {
    'use strict';
    var fs = require('fs');
    var self = {};
    self.writeToFile = function (path, data, cb) {
        fs.writeFile(path, data, function (err) {
            if (err) {
                Notification.error(Strong.format('Unable to write to file {0}', path));
                return;
            }
            cb();
        });
    };

    self.readFromFile = function (fileName, cb) {
        fs.readFile(fileName, 'utf-8', function (err, data) {
            if (err) {
                Notification.error(Strong.format('Unable to read from file {0}', fileName));
                return;
            }
            cb(data);
        });
    };

    return self;
};