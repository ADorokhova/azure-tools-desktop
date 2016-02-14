exports.register = function (module) {
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
            '$utils',
            'searchViewModel',
            'keyViewModel',
            'Notification',

            function (
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
                $utils,
                searchViewModel,
                keyViewModel,
                Notification) {
                var self = this;
                var loadDetailsOperation = 'loadDetails';

                var databaseViewModel = {
                    setCurrent: function (pair) {
                        $activeDatabase.Current = pair.key;
                        this.Current = pair;
                        searchViewModel.search();
                    },
                    convertNumToName: function (num) {
                        var mappings = this.getMappings();
                        if (mappings) {
                            return mappings[num];
                        } else {
                            return num;
                        }
                    },
                    Current: null,
                    items: null,
                    getMappings: function () {
                        var currentConnection = $redisSettings.get();
                        if (currentConnection !== undefined
                            && currentConnection !== null
                            && currentConnection["database-mappings"] !== undefined
                             && currentConnection["database-mappings"] !== null) {
                            var mappings = currentConnection["database-mappings"];
                            return mappings;
                        }

                        return null;
                    },
                    all: function () {
                        if (this.items === null) {
                            this.items = [];
                            var mappings = this.getMappings();
                            if (mappings) {
                                for (var each in mappings) {
                                    this.items.push({ key: each, value: mappings[each] });
                                }
                            } else {
                                for (var i = 0; i < 10; i++) {
                                    var item = { key: i, value: i };
                                    this.items.push(item);
                                }
                            }
                        }
                       // console.log(this.items)
                        return this.items;
                    }
                };
                databaseViewModel.Current = {
                    key: $activeDatabase.Current,
                    value: databaseViewModel.convertNumToName($activeDatabase.Current)
                };

                // extend keyViewModel
                keyViewModel.loadKeyDetails = function (selectedKey) {
                    if ($busyIndicator.getIsBusy(loadDetailsOperation) === false) {
                        $busyIndicator.setIsBusy(loadDetailsOperation, true);
                        console.log(selectedKey)
                        redisRepo.getKey(selectedKey, function (result) {
                            $busyIndicator.setIsBusy(loadDetailsOperation, false);
                            keyViewModel.selectedKeys = [result];
                            $scope.$broadcast('redisViewModel-key-selected-type-' + result.Type, result);
                        });
                    }
                };

                keyViewModel.refreshKeyDetails = function () {
                    if (keyViewModel.selectedKeys === null
                        || keyViewModel.selectedKeys === undefined
                        || keyViewModel.selectedKeys.length === 0) {
                        return;
                    }

                    keyViewModel.loadKeyDetails(keyViewModel.selectedKeys[0].Key);
                };

                keyViewModel.onRegisterApi = function (gridApi) {
                    var selectOneOrMany = function (selectedItems) {
                        if (selectedItems.length === 1) {
                            keyViewModel.loadKeyDetails(selectedItems[0].Key);
                        } else if (selectedItems.length > 1) {
                            keyViewModel.selectedKeys.length = 0;
                            for (var i = 0; i < selectedItems.length; i++) {
                                keyViewModel.selectedKeys.push(selectedItems[i]);
                            };
                        }
                    };

                    gridApi.selection.on.rowSelectionChanged($scope, function () {
                        selectOneOrMany(gridApi.selection.getSelectedRows());
                    });

                    gridApi.selection.on.rowSelectionChangedBatch($scope, function () {
                        selectOneOrMany(gridApi.selection.getSelectedRows());
                    });
                };
                keyViewModel.getStyle = function () {
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
                searchViewModel.onSuccess = function (keys) {
                    for (var i = 0, len = keys.length; i < len; i++) {
                        keyViewModel.data.push({
                            Key: keys[i]
                        });
                    }
                };

                searchViewModel.beforeSearch = function () {
                    $scope.$emit('reload');

                    keyViewModel.data.length = 0;
                    keyViewModel.selectedKeys = [];
                };

                $scope.updateString = function () {
                    if (keyViewModel.selectedKeys.length === 0) return;

                    var selectedItem = keyViewModel.selectedKeys[0];
                    var repo = $redisRepositoryFactory(selectedItem.Type);
                    try {
                        repo.update(selectedItem.Key, selectedItem.Value, function () { });
                        Notification.success(String.format('String value was changed to "{0}" successfully', $utils.truncate(selectedItem.Value)));
                    } catch (ex) {
                        showError(ex.message);
                    }
                };

                self.updateKey = function () {
                    if (keyViewModel.selectedKeys.length === 0) return;
                    var type = keyViewModel.selectedKeys[0].Type;
                    var key = keyViewModel.selectedKeys[0].Key;
                    $scope.$broadcast('redisViewModel-save-' + type, key);
                };

                var showError = function (data) {
                    dialog.showErrorBox('Error', data);
                };

                var showInfo = function (msg) {
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
                    function (event, data) {
                        console.log('Received data: ' + data);
                        showError(data);
                    });

                if ($redisSettings.isEmpty()) {
                    actionBarViewModel.changeSettings();
                } else {
                    $timeout(function () {
                        actionBarViewModel.refresh();
                    });
                }
            }
        ]);
};