(function() {
    'use strict';

    window.jQuery = window.$ = require('jquery');
    var angular = require('angular');
    window.angular = angular;

    var angularRoute = require('angular-ui-router'),
        dataTable = require('datatables'),
        uiGrid = require('angular-ui-grid'),
        dranDrop = require('angular-dragdrop'),
        resizable = require('angular-resizable'),
        app;

    var jqueryUI = require('jquery-ui');

    window.isDebugVersion = false;
    require('./exceptionHandling/exceptionHandlingModule.js').register(angular);
    require('./common/commonModule.js').register(angular, angularRoute);
    require('./common/dialogsModule.js').register(angular, angularRoute);
    require('./common/actionBarModule.js').register(angular);
    require('./redis/redisModule.js').register(angular, angularRoute);
    require('./tables/tablesModule.js').register(angular, angularRoute);
    require('./blobs/blobsModule.js').register(angular, angularRoute);
    require('./tiles/tilesModule.js').register(angular, angularRoute);

    app = angular
        .module('app', [
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