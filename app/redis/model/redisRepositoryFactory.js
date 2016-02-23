exports.create = function (stringRepo, setRepo, hashSetRepo) {
    'use strict';

    return function (type) {
        var self = this;

        switch (type) {
            case 'string':
                return stringRepo;
            case 'set':
                return setRepo;
            case 'hash set':
            case 'hash':
                return hashSetRepo;
            default:
                return null;
        }
    };
};