exports.register = function (angular, angularRoute) {
    'use strict';

    var tablesModule = angular.module('tiles.tables', [angularRoute]);
    require('./services/tablesServices.js').register(tablesModule);

    tablesModule
        .factory('tablesPresenter', [
      function () {
          return require('./presenter/tablesPresenter.js').create();
      }
        ]);

    require('./viewModel/tablesViewModel.js').register(tablesModule);

    tablesModule.factory('tablesSettings', [
        'appSettings', 'Notification', function(appSettings, Notification) {
            return require('./model/tablesSettings.js').create(appSettings, Notification);
        }
    ]);

    tablesModule
      .config(function ($stateProvider, NotificationProvider) {
          $stateProvider
            .state('tables', {
                url: '/tables',
                templateUrl: 'tables/view/index.html',
                controller: 'TablesController',
                params: {
                    seq: {}
                }
            });

          NotificationProvider.setOptions({
              positionX: 'center',
              positionY: 'top'
          });
      });
}