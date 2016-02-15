exports.register = function (module) {
    module
        .controller('TablesController', [
            '$scope',
            '$timeout',
            '$actionBarItems',
            '$busyIndicator',
            '$confirmViewModel',
            '$dialogViewModel',
            '$notifyViewModel',
            'tablesSettings',
            'azureStorage',
            'tablesPresenter',
            'settingsCommands',
            'Notification',
            function (
                $scope,
                $timeout,
                $actionBarItems,
                $busyIndicator,
                $confirmViewModel,
                $dialogViewModel,
                $notifyViewModel,
                tablesSettings,
                azureStorage,
                tablesPresenter,
                settingsCommands,
                Notification) {
                var self = this;
                var listTablesOperation = 'listTablesOperation';
                var queryEntitiesOperation = 'queryEntitiesOperation';

                var searchViewModel = {
                    search: function () {
                        if (!isConnectionSettingsSpecified()) {
                            return;
                        }

                        queryTableEntities(this.Pattern);
                    },
                    Pattern: '',
                    clear: function () {
                        this.Pattern = '';
                        this.IsClearVisible = false;
                        searchViewModel.search();
                    },
                    IsClearVisible: false,
                    onChange: function () {
                        this.IsClearVisible = this.Pattern !== '';
                    }
                };

                var tableSelectionViewModel =  {
                    Tables : null,
                    SelectedTable : null,
                    onSelectedTableChanged : function (selectedTable) {
                        this.SelectedTable = selectedTable;
                        $notifyViewModel.close();
                        searchViewModel.search();
                    }
                };

                var entitiesSelectionViewModel = new function () {
                    var self = this;
                    this.SelectedEntities = null;
                    this.onSelectedEntitiesChanged = function (selectedEntities) {
                        self.SelectedEntities = selectedEntities;
                        $notifyViewModel.close();
                    };
                };

                $busyIndicator.Text = 'Loading...';

                // tables action bar
                self.Settings = tablesSettings;

                $actionBarItems.ModuleName = ': Tables';
                $actionBarItems.IsTablesSelectVisible = true;
                $actionBarItems.IsActionBarVisible = true;
                $actionBarItems.IsRefreshVisible = true;
                $actionBarItems.IsSettingsVisible = true;
                $actionBarItems.IsSearchVisible = true;
                $actionBarItems.refresh = function () {
                    if (!isConnectionSettingsSpecified()) {
                        return;
                    }

                    $actionBarItems.Continuation = null;
                    entries = null;

                    if (tableSelectionViewModel.SelectedTable == null) {
                        loadTableList();
                    } else {
                        searchViewModel.search();
                    }
                };
                $actionBarItems.Continuation = null;
                $actionBarItems.loadMore = function () {
                    appendTableEntities(searchViewModel.Pattern);
                };
                $actionBarItems.SearchViewModel = searchViewModel;
                $scope.TableSelectViewModel = tableSelectionViewModel;
                $actionBarItems.changeSettings = function () {
                    var changeSettingsDialog = $dialogViewModel();

                    changeSettingsDialog.WithOption = true;
                    changeSettingsDialog.OptionText = 'Use demo credentials';
                    changeSettingsDialog.IsChecked = false;

                    changeSettingsDialog.onChecked = function () { };
                    changeSettingsDialog.IsVisible = true;
                    changeSettingsDialog.BodyViewModel = {
                        AccountName: '',
                        AccountKey: '',
                    };

                    var settingsFromStorage = tablesSettings.get();
                    console.log('settings from storage');
                    console.log(settingsFromStorage);

                    if (settingsFromStorage) {
                        changeSettingsDialog.BodyViewModel.AccountName = settingsFromStorage.accountName;
                        changeSettingsDialog.BodyViewModel.AccountKey = settingsFromStorage.accountKey;
                    }

                    changeSettingsDialog.Body = 'tablesSettingsTemplate';
                    changeSettingsDialog.Header = 'Settings';

                    function applySettings() {
                        changeSettingsDialog.IsVisible = false;
                        loadTableList();
                    };

                    changeSettingsDialog.save = function () {
                        tablesSettings.save(changeSettingsDialog.BodyViewModel.AccountName, changeSettingsDialog.BodyViewModel.AccountKey);
                        applySettings();
                    };

                    changeSettingsDialog.import = function () {
                        settingsCommands.import(function () {
                            applySettings();
                        });
                    };
                };

                $actionBarItems.createTable = function () {
                    var createTableDialog = $dialogViewModel();
                    createTableDialog.Body = 'createTableTemplate';
                    createTableDialog.Header = 'Create Table';
                    createTableDialog.IsVisible = true;

                    createTableDialog.save = function () {
                        createTableDialog.AreButtonsDisabled = true;

                        try {

                            defaultClientFactory().createTableIfNotExists(createTableDialog.BodyViewModel.TableName,
                                function (error, result, response) {
                                    createTableDialog.AreButtonsDisabled = false;
                                    if (!error) {
                                        createTableDialog.IsVisible = false;
                                        loadTableList();
                                    } else {
                                        createTableDialog.BodyViewModel.ErrorMessage = error.message;
                                    }
                                });
                        } catch (ex) {
                            createTableDialog.BodyViewModel.ErrorMessage = ex.message;
                        }
                    };
                };

                $actionBarItems.createTableEntity = function () {
                    var createTableEntityDialog = $dialogViewModel();
                    createTableEntityDialog.Body = 'createTableEntityTemplate';
                    createTableEntityDialog.Header = 'Update Entity';
                    createTableEntityDialog.IsVisible = true;

                    var columnsDictionary = { PartitionKey: '', RowKey: '' };
                    var tableProperties = [{
                        Key: 'PartitionKey',
                        Value: ''
                    }, {
                        Key: 'RowKey',
                        Value: ''
                    }];
                    for (var i = 0; i < self.entries.length; i++) {
                        for (var propertyName in self.entries[i]) {
                            if (columnsDictionary[propertyName] == undefined && propertyName !== 'Timestamp' && propertyName !== '.metadata') {
                                columnsDictionary[propertyName] = propertyName;
                                tableProperties.push({
                                    Key: propertyName,
                                    Type: {
                                        Types: ['string', 'binary', 'boolean', 'datetime'],
                                        Selected: 'string'
                                    },
                                    Value: ''
                                });
                            }
                        }
                    }
                    createTableEntityDialog.BodyViewModel.TableProperties = tableProperties;

                    createTableEntityDialog.save = function () {
                        createTableEntityDialog.AreButtonsDisabled = true;

                        try {
                            var entGen = azureStorage.TableUtilities.entityGenerator;
                            var task = {};
                            for (var i = 0; i < createTableEntityDialog.BodyViewModel.TableProperties.length; i++) {
                                var each = createTableEntityDialog.BodyViewModel.TableProperties[i];
                                task[each.Key] = entGen.String(each.Value);
                            };
                            console.log('creating')
                            console.log(task)
                            defaultClientFactory().insertEntity(tableSelectionViewModel.SelectedTable, task, function (error, result, response) {
                                if (!error) {
                                    // Entity inserted
                                }
                            });
                        } catch (ex) {
                            createTableEntityDialog.BodyViewModel.ErrorMessage = ex.message;
                        }
                    };
                };

                $actionBarItems.deleteTableEntity = function () {
                    console.log(entitiesSelectionViewModel.SelectedEntities)
                    if (entitiesSelectionViewModel.SelectedEntities != null) {
                        $confirmViewModel.Body = 'Are you sure you want to delete ' + entitiesSelectionViewModel.SelectedEntities.length + ' entities?';
                        $confirmViewModel.show(function () {
                            for (var i = 0; i < entitiesSelectionViewModel.SelectedEntities.length; i++) {
                                var each = entitiesSelectionViewModel.SelectedEntities[i];
                                defaultClientFactory().deleteEntity(
                                    tableSelectionViewModel.SelectedTable,
                                    each,
                                    function (error, result, response) {
                                        if (!error) {
                                            //loadTableList();
                                            //tableSelectionViewModel.SelectedTable = null;
                                            //tablesPresenter.showEntities(null);
                                        } else { }
                                    });
                            };
                        });
                    }
                };

                $actionBarItems.deleteTable = function () {
                    if (tableSelectionViewModel.SelectedTable != null) {
                        $confirmViewModel.Body = 'Are you sure you want to delete "' + tableSelectionViewModel.SelectedTable + '"?';
                        $confirmViewModel.show(function () {
                            defaultClientFactory().deleteTable(tableSelectionViewModel.SelectedTable, function (error, result, response) {
                                if (!error) {
                                    loadTableList();
                                    tableSelectionViewModel.SelectedTable = null;
                                    tablesPresenter.showEntities(null);
                                } else { }
                            });
                        });
                    }
                };

                var isConnectionSettingsSpecified = function () {
                    return !tablesSettings.isEmpty();
                };

                var showError = function (data) {
                    if (data !== undefined && data !== null) {
                        if (data.name && data.name === 'Error') {
                            $timeout(function () {
                                $notifyViewModel.scope().$apply(function () {
                                    $notifyViewModel.showWarning(data.message);
                                });
                            });
                        } else {
                            $timeout(function () {
                                $notifyViewModel.scope().$apply(function () {
                                    $notifyViewModel.showWarning(data);
                                });
                            });
                        }
                    }
                };

                var defaultClient = null;
                var defaultClientFactory = function () {
                    console.log(defaultClient);
                    var settings = tablesSettings.get();
                    if (settings && (defaultClient == null || (defaultClient.storageAccount !== settings.accountName || defaultClient.storageAccessKey !== settings.accountKey))) {
                        defaultClient = azureStorage.createTableService(settings.accountName, settings.accountKey, String.format('http://{0}.table.core.windows.net/', settings.accountName));
                    }

                    return defaultClient;
                };

                var cancelOperation = function () { };

                self.entries = [];
                var queryTableEntities = function (query) {
                    if ($busyIndicator.getIsBusy(queryEntitiesOperation) === false) {
                        var tableService = defaultClientFactory();
                        if (!tableService) {
                            Notification.error('No settings found. Provide access settings');
                            $actionBarItems.changeSettings();
                            return;
                        }

                        var cancelled = false;
                        $busyIndicator.setIsBusy(queryEntitiesOperation, true, function () {
                            cancelled = true;
                        });

                        var azureQuery = new azureStorage.TableQuery().where(query);

                        tableService.queryEntities(tableSelectionViewModel.SelectedTable, azureQuery, null, function (error, result, response) {
                            if (cancelled) return;
                            $busyIndicator.setIsBusy(queryEntitiesOperation, false, function () {
                                cancelled = true;
                            });
                            if (error) {
                                showError(error);
                                return;
                            }

                            self.entries = result.entries;
                            $actionBarItems.Continuation = result.continuationToken;

                            tablesPresenter.showEntities(result.entries, entitiesSelectionViewModel.onSelectedEntitiesChanged);
                        });
                    }
                };

                var appendTableEntities = function (query) {
                    if ($busyIndicator.getIsBusy(queryEntitiesOperation) === false) {
                        var tableService = defaultClientFactory();
                        if (!tableService) {
                            Notification.error('No settings found. Provide access settings');
                            $actionBarItems.changeSettings();
                            return;
                        }

                        var cancelled = false;
                        $busyIndicator.setIsBusy(queryEntitiesOperation, true, function () {
                            cancelled = true;
                        });

                        var azureQuery = new azureStorage.TableQuery().where(query);
                        console.log($actionBarItems.Continuation);



                        tableService.queryEntities(tableSelectionViewModel.SelectedTable, azureQuery, $actionBarItems.Continuation, function (error, result, response) {
                            $busyIndicator.setIsBusy(queryEntitiesOperation, false, function () {
                                cancelled = true;
                            });
                            if (cancelled) return;
                            if (error) {
                                showError(error);
                                return;
                            }

                            $actionBarItems.Continuation = result.continuationToken;
                            self.entries = self.entries.concat(result.entries);

                            tablesPresenter.showEntities(self.entries);
                        });
                    }
                };
                var loadTableList = function (cb) {
                    if ($busyIndicator.getIsBusy(listTablesOperation) === false) {
                        var cancelled = false;
                        $busyIndicator.setIsBusy(listTablesOperation, true, function () {
                            cancelled = true;
                        });
                        var client = defaultClientFactory();
                        if (!client) {
                            Notification.error('No settings found. Provide access settings');
                            $actionBarItems.changeSettings();
                            return;
                        }

                        client.listTablesSegmented(null, null, function (error, data) {
                            console.log('Tables Loaded')
                            if (cancelled) return;
                            $busyIndicator.setIsBusy(listTablesOperation, false, cancelOperation);
                            if (error) {
                                showError(error);
                                return;
                            }

                            tableSelectionViewModel.Tables = data.entries;
                            if (cb) {
                                cb();
                            }
                        });
                    }
                };

                // init
                $scope.ActionBarItems = $actionBarItems;
                if (tablesSettings.isEmpty()) {
                    $actionBarItems.changeSettings();
                } else {
                    loadTableList();
                }
            }
        ]);
};