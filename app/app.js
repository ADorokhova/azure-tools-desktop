(function() {
    'use strict';

    window.jQuery = window.$ = require('jquery');
    var angular = require('angular');
    window.angular = angular;
    window._ = require('lodash');
    
    var angularRoute = require('angular-ui-router'),
        dataTable = require('datatables'),
        uiGrid = require('angular-ui-grid'),
        dranDrop = require('angular-dragdrop'),
        resizable = require('angular-resizable'),
        notifications = require('angular-ui-notification'),
        app;

    var jqueryUI = require('jquery-ui');
    var pjson = require('../package.json');

    window.isDebugVersion = false;
    window.productVersion = pjson.version;

    require('./exceptionHandling/exceptionHandlingModule.js').register(angular);
    require('./common/commonModule.js').register(angular, angularRoute);
    require('./common/dialogsModule.js').register(angular, angularRoute);
    require('./common/actionBarModule.js').register(angular);
    require('./redis/redisModule.js').register(angular, angularRoute);
    require('./tables/tablesModule.js').register(angular, angularRoute);
    require('./blobs/blobsModule.js').register(angular, angularRoute);
    require('./tiles/tilesModule.js').register(angular, angularRoute);

    if (!String.format) {
        String.format = function (format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                  ? args[number]
                  : match
                ;
            });
        };
    }

    app = angular
        .module('app', [
            'ui-notification',
            'ui.grid',
            'ui.grid.autoResize',
            'ui.grid.selection',
            'ui.grid.resizeColumns',
            'ui.grid.moveColumns',
            'ngDragDrop',
            'angularResizable',
            'exceptionOverride',
            'common',
            'actionBar',
            'dialogs',
            'tiles',
            'tiles.redis',
            'tiles.tables',
            'tiles.blobs',
        ], function() {});

    require('./directives/appDirectives.js')
        .register(app)
        .controller('AppController', ['$state', function($state) {
            $state.go('tiles');
        }]);
}());