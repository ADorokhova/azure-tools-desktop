exports.register = function(module) {
    module
        .controller('RedisController', [
            '$scope',
            '$timeout',
            '$activeDatabase',
            '$redisRepositoryFactory',
            'redisRepo',
            '$redisScannerFactory',
            'actionBarViewModel',
            '$dialogViewModel',
            '$confirmViewModel',
            '$notifyViewModel',
            '$redisSettings',
            '$busyIndicator',
            '$messageBus',
            '$validator',
            'uiGridConstants',
            'dialog',
            'searchViewModel',
            'keyViewModel',

            function(
                $scope,
                $timeout,
                $activeDatabase,
                $redisRepositoryFactory,
                redisRepo,
                $redisScannerFactory,
                actionBarViewModel,
                $dialogViewModel,
                $confirmViewModel,
                $notifyViewModel,
                $redisSettings,
                $busyIndicator,
                $messageBus,
                $validator,
                uiGridConstants,
                dialog,
                searchViewModel,
                keyViewModel) {
                var self = this;
                var loadDetailsOperation = 'loadDetails';

                var databaseViewModel = {
                    setCurrent: function(n) {
                        $activeDatabase.Current = n;
                        this.Current = n;
                        searchViewModel.search();
                    },
                    Current: $activeDatabase.Current
                };

                // extend keyViewModel
                keyViewModel.onRegisterApi = function(gridApi) {
                    $scope.keyApi = gridApi;
                    $scope.keyApi.selection.on.rowSelectionChanged($scope, function(row) {
                        if ($busyIndicator.getIsBusy(loadDetailsOperation) === false) {
                            $busyIndicator.setIsBusy(loadDetailsOperation, true);
                            redisRepo.getKey(row.entity.Key, function(result) {
                                $busyIndicator.setIsBusy(loadDetailsOperation, false);
                                keyViewModel.selectedKeys = [result];
                                $scope.$broadcast('redisViewModel-key-selected-type-' + result.Type, result);
                            });
                        }
                    });
                    gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {
                        keyViewModel.selectedKeys.length = 0;
                        for (var i = 0; i < rows.length; i++) {
                            keyViewModel.selectedKeys.push(rows[i].entity);
                        };
                    });
                };
                keyViewModel.getStyle = function() {
                    return {
                        height: '100%'
                    };
                }
                $scope.keyOptions = keyViewModel;

                // redis action bar
                actionBarViewModel.init();

                $scope.SearchViewModel = searchViewModel;
                $scope.DatabaseViewModel = databaseViewModel;

                // load redis data
                var maxItemsToLoad = 100;

                searchViewModel.onSuccess = function(keys) {
                    for (var i = 0, len = keys.length; i < len; i++) {
                        keyViewModel.data.push({
                            Key: keys[i]
                        });
                    }
                };
                searchViewModel.beforeSearch = function() {
                    $scope.$emit('reload');

                    keyViewModel.data.length = 0;
                    keyViewModel.selectedKeys = [];
                };

                $scope.updateString = function() {
                    if (keyViewModel.selectedKeys.length === 0) return;

                    var type = keyViewModel.selectedKeys[0].Type;
                    var repo = $redisRepositoryFactory(type);
                    try {
                        repo.update(keyViewModel.selectedKeys[0].Key, keyViewModel.selectedKeys[0].Value, function() {})
                    } catch (ex) {
                        showError(ex.message);
                    }
                };

                self.updateKey = function() {
                    if (keyViewModel.selectedKeys.length === 0) return;
                    var type = keyViewModel.selectedKeys[0].Type;
                    var key = keyViewModel.selectedKeys[0].Key;
                    $scope.$broadcast('redisViewModel-save-' + type, key);
                };

                var showError = function(data) {
                    dialog.showErrorBox('Error', data);
                };

                var showInfo = function(msg) {
                    //if (msg !== undefined && msg !== null) {
                    //    $timeout(function() {
                    //        $notifyViewModel.scope().$apply(function() {
                    //            $notifyViewModel.showInfo(msg);
                    //        });
                    //    });
                    //}
                };

                $messageBus.subscribe(
                    ['redis-communication-error'],
                    function(event, data) {
                        console.log('Received data: ' + data);
                        showError(data);
                    });

                // init
                if ($redisSettings.isEmpty()) {
                    actionBarViewModel.changeSettings();
                } else {
                    $timeout(function() {
                        actionBarViewModel.refresh();
                    });
                }
            }
        ]);
};