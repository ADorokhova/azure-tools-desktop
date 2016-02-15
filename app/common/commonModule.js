exports.register = function (angular, angularRoute) {
    'use strict';
    
    angular
        .module('common', [angularRoute])
        .factory('$busyIndicator', [
            '$rootScope', '$timeout', function ($rootScope, $timeout) {
                return require('./services/busyIndicator.js').create($rootScope, $timeout);
            }
        ])
        .factory('appSettings', [
            '$rootScope', '$timeout', 'Notification', 'dialog', 'fileService', function ($rootScope, $timeout, Notification, dialog, fileService) {
                return require('./services/appSettings.js').create($rootScope, $timeout, Notification, dialog, fileService);
            }
        ])
        .factory('settingsCommands', [
            '$rootScope', 'dialog', 'fileService', 'appSettings', function ($rootScope, dialog, fileService, appSettings) {
                return require('./services/settingsCommands.js').create($rootScope, dialog, fileService, appSettings);
            }
        ])
        .factory('fileService', [
            '$rootScope', '$timeout', 'Notification', 'dialog', function ($rootScope, $timeout, Notification, dialog) {
                return require('./services/fileService.js').create(Notification);
            }
        ])
        .factory('$validator', [function () {
            return require('./services/validator.js').create();
        }
        ])
        .factory('$messageBus', [
            '$rootScope', function ($rootScope) {
                return require('./services/messageBus.js').create($rootScope);
            }
        ])
        .factory('$utils', [function () {
            return require('./services/utils.js').create();
        }
        ])
        .controller('BusyIndicatorController', [
            '$scope', '$busyIndicator', function ($scope, $busyIndicator) {
                $scope.BusyIndicator = $busyIndicator;
            }
        ]);
}