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
            'Notification',

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
                keyViewModel,
                Notification) {
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

                    var selectOneOrMany = function(selectedItems) {
                        if (selectedItems.length === 1) {
                            console.log(selectedItems[0])
                            if ($busyIndicator.getIsBusy(loadDetailsOperation) === false) {
                                $busyIndicator.setIsBusy(loadDetailsOperation, true);
                                redisRepo.getKey(selectedItems[0].Key, function(result) {
                                    $busyIndicator.setIsBusy(loadDetailsOperation, false);
                                    keyViewModel.selectedKeys = [result];
                                    $scope.$broadcast('redisViewModel-key-selected-type-' + result.Type, result);
                                });
                            }
                        } else if (selectedItems.length > 1) {
                            keyViewModel.selectedKeys.length = 0;
                            for (var i = 0; i < selectedItems.length; i++) {
                                keyViewModel.selectedKeys.push(selectedItems[i]);
                            };
                        }
                    };

                    gridApi.selection.on.rowSelectionChanged($scope, function() {
                        selectOneOrMany(gridApi.selection.getSelectedRows());
                    });

                    gridApi.selection.on.rowSelectionChangedBatch($scope, function() {
                        selectOneOrMany(gridApi.selection.getSelectedRows());
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
                        repo.update(keyViewModel.selectedKeys[0].Key, keyViewModel.selectedKeys[0].Value, function() {});
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


                // init
                $messageBus.subscribe(
                    ['redis-communication-error'],
                    function(event, data) {
                        console.log('Received data: ' + data);
                        showError(data);
                    });
                    
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