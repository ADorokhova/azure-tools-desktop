exports.register = function (angular) {
    'use strict';

    angular
        .module('actionBar', [])
        .factory('$actionBarItems', function () {
            return { IsActionBarVisible: false };
        })
        .controller('ActionBarController', [
            '$scope', '$state', '$actionBarItems', function ($scope, $state, $actionBarItems) {
                $scope.ActionBarItems = $actionBarItems;
                $scope.state = $state;

                $scope.customWindowButtons = process.platform === 'win32';
                if ($scope.customWindowButtons) {
                    const currentWindow = require('electron').remote.getCurrentWindow();
                    $scope.isMaximized = currentWindow.isMaximized();

                    $scope.close = function() {
                        currentWindow.close();
                    };

                    $scope.minimize = function() {
                        currentWindow.minimize();
                    };

                    $scope.maximize = function() {
                        if ($scope.isMaximized) {
                            currentWindow.unmaximize();
                        } else {
                            currentWindow.maximize();
                        }

                        $scope.isMaximized = currentWindow.isMaximized();
                    };
                }
            }
        ]);
}