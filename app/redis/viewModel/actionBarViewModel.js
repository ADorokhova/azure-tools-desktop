exports.register = function (module) {
    module
        .service('actionBarViewModel', [
            '$rootScope',
            '$timeout',
            'keyViewModel',
            '$activeDatabase',
            '$redisRepositoryFactory',
            'redisRepo',
            '$baseRepo',
            '$redisScannerFactory',
            '$actionBarItems',
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
            'Notification',
            'appSettings',
            'fileService',
            'settingsCommands',
            function (
                $rootScope,
                $timeout,
                keyViewModel,
                $activeDatabase,
                $redisRepositoryFactory,
                redisRepo,
                $baseRepo,
                $redisScannerFactory,
                $actionBarItems,
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
                Notification,
                appSettings,
                fileService,
                settingsCommands) {
                var self = this;
                var dialogFactory = function (header, bodyVm, bodyTemplate, optionText) {
                    var dialog = $dialogViewModel();
                    dialog.WithOption = !(optionText === null || optionText === undefined);
                    dialog.IsChecked = true;
                    dialog.OptionText = optionText;
                    dialog.IsVisible = true;
                    dialog.BodyViewModel = bodyVm;
                    dialog.Body = bodyTemplate;
                    dialog.Header = header;
                    return dialog;
                };

                // dialogs
                var createAddKeyDialog = function () {
                    var vm = {
                        Key: '',
                        Value: '',
                        Types: ['string', 'set', 'hash'],
                        Type: 'string',
                        selectType: function (value) {
                            this.Type = value;
                        },
                        ValueExample: 'Example: any string'
                    };
                    var template = 'createKeyTemplate';
                    var optionText = 'Close dialog on save';
                    var header = 'Create New Redis Key';

                    return dialogFactory(header, vm, template, optionText);
                };

                var createEditValueDialog = function (key, type) {
                    var vm;
                    var template;

                    switch (type) {
                        case 'string':
                            template = 'editStringTemplate';
                            vm = {
                                Key: key,
                                Type: type,
                                Value: ''
                            };
                            break;
                        case 'hash':
                            template = 'editHashTemplate';
                            vm = {
                                Key: key,
                                Type: type,
                                Name: '',
                                Value: ''
                            };
                            break;
                        case 'set':
                            template = 'editSetTemplate';
                            vm = {
                                Key: key,
                                Type: type,
                                Value: ''
                            };
                            break;
                        default:
                            throw new Error('Unsupported type: ' + type);
                    }

                    var header = 'Edit Key';
                    return dialogFactory(header, vm, template);
                };

                // commands
                self.clearCreateKeyDialog = function (dialog) {
                    switch (dialog.BodyViewModel.Type) {
                        case 'string':
                            Notification.success(String.format('String value was changed to "{0}" successfully', $utils.truncate(dialog.BodyViewModel.Value)));
                            dialog.BodyViewModel.Value = '';
                            break;
                        case 'hash':
                            Notification.success(String.format('Member with name "{0}" was added successfully', $utils.truncate(dialog.BodyViewModel.Name)));
                            dialog.BodyViewModel.Name = '';
                            dialog.BodyViewModel.Value = '';
                            break;
                        case 'set':
                            Notification.success(String.format('Value "{0}" was added to set successfully', $utils.truncate(dialog.BodyViewModel.Value)));
                            dialog.BodyViewModel.Value = '';
                            break;
                        default:
                            throw new Error(String.format('Unsupported type {0}', type));
                    };
                };

                self.createKeyFromDialogData = function (dialog, cb) {
                    if (dialog.BodyViewModel.Key === undefined
                        || dialog.BodyViewModel.Key === null
                        || dialog.BodyViewModel.Key === '') {
                        dialog.ValidationErrorText = 'Key can not be empty';
                        return;
                    } else {
                        dialog.ValidationErrorText = '';
                    }

                    var repo = $redisRepositoryFactory(dialog.BodyViewModel.Type);
                    switch (dialog.BodyViewModel.Type) {
                        case 'string':
                            repo.create(dialog.BodyViewModel.Key, dialog.BodyViewModel.Value, cb);
                            break;
                        case 'hash':
                            repo.hset(dialog.BodyViewModel.Key, dialog.BodyViewModel.Name, dialog.BodyViewModel.Value, cb);
                            break;
                        case 'set':
                            repo.sadd(dialog.BodyViewModel.Key, dialog.BodyViewModel.Value, cb);
                            break;
                        default:
                            throw new Error(String.format('Unsupported type {0}', dialog.BodyViewModel.Type));
                    }
                };

                self.changeSettings = function () {
                    var changeSettingsDialog = $dialogViewModel();
                    changeSettingsDialog.AreButtonsDisabled = false;
                    changeSettingsDialog.WithOption = true;
                    changeSettingsDialog.OptionText = 'Use demo credentials';
                    changeSettingsDialog.IsChecked = false;

                    changeSettingsDialog.onChecked = function () { };

                    changeSettingsDialog.IsVisible = true;

                    changeSettingsDialog.BodyViewModel = {
                        Host: '',
                        Port: 6379,
                        Password: ''
                    };

                    var settingsFromStorage = $redisSettings.get();
                    if (settingsFromStorage) {
                        changeSettingsDialog.BodyViewModel.Host = settingsFromStorage.host;
                        changeSettingsDialog.BodyViewModel.Port = settingsFromStorage.port;
                        changeSettingsDialog.BodyViewModel.Password = settingsFromStorage.password;
                    }

                    changeSettingsDialog.Body = 'changeSettingsTemplate';

                    var settingsPath = $redisSettings.getSettingsPath();
                    console.log('Settings Path: ' + settingsPath);
                    changeSettingsDialog.Header = 'Settings';

                    function applySettings() {
                        changeSettingsDialog.IsVisible = false;
                        searchViewModel.search();
                    };

                    changeSettingsDialog.save = function () {
                        if ($validator.validatePort(+changeSettingsDialog.BodyViewModel.Port) === false) {
                            showError('Port value is wrong. Port must be in range [1;65535]');
                            return;
                        };

                        $redisSettings.save(
                            changeSettingsDialog.BodyViewModel.Host,
                            +changeSettingsDialog.BodyViewModel.Port,
                            changeSettingsDialog.BodyViewModel.Password);

                        applySettings();
                    };


                    changeSettingsDialog.import = function() {
                        settingsCommands.import(function() {
                            applySettings();
                        });
                    };
                };

                self.refresh = function () {
                    searchViewModel.search();
                };

                self.refreshKey = function () {
                    if (keyViewModel.selectedKeys == null || keyViewModel.selectedKeys.length === 0) return;
                    keyViewModel.refreshKeyDetails();
                }

                self.createKey = function (addKeyDialog, cb) {
                    cb = cb || function () { };
                    self.createKeyFromDialogData(addKeyDialog, cb);
                };

                self.removeKey = function () {
                    if (keyViewModel.selectedKeys == null || keyViewModel.selectedKeys.length === 0) return;

                    $timeout(function () {
                        $confirmViewModel.scope().$apply(function () {
                            $confirmViewModel.Body =
                                keyViewModel.selectedKeys.length === 1
                                ? 'Are you sure you want to delete "' + keyViewModel.selectedKeys[0].Key + '"?'
                                : 'Are you sure you want to delete ' + keyViewModel.selectedKeys.length + ' items?';
                            $confirmViewModel.show(function () {
                                var areAllDeleted = true;
                                try {
                                    $baseRepo.delete(_.map(keyViewModel.selectedKeys, 'Key'), function () {
                                        for (var i = 0; i < keyViewModel.selectedKeys.length; i++) {
                                            _.remove(keyViewModel.data, function (each) {
                                                return each.Key === keyViewModel.selectedKeys[i].Key;
                                            });
                                        }

                                        if (areAllDeleted) {
                                            Notification.success('Key(s) deleted successfully');
                                        } else {
                                            Notification.warning('Not all keys were deleted');
                                        }

                                        $rootScope.$broadcast('reload');
                                        keyViewModel.selectedKeys.length = 0;
                                    });
                                } catch (ex) {
                                    areAllDeleted = false;
                                }
                            });
                        });
                    });
                };

                self.createKeyAndEdit = function (addKeyDialog, cb) {
                    self.createKey(addKeyDialog, function () {
                        $timeout(function () {
                            var editValueDialog = createEditValueDialog(
                                addKeyDialog.BodyViewModel.Key,
                                addKeyDialog.BodyViewModel.Type);

                            editValueDialog.BodyViewModel.save = function () {
                                self.createKeyFromDialogData(editValueDialog, cb);
                            };
                        });
                    });
                };

                self.editKey = function (addKeyDialog, cb) {
                    var editValueDialog = createEditValueDialog(
                        addKeyDialog.BodyViewModel.Key,
                        addKeyDialog.BodyViewModel.Type);

                    editValueDialog.BodyViewModel.save = function () {
                        self.createKeyFromDialogData(editValueDialog, cb);
                    };
                };

                self.addContext = function (ctx) {
                    $actionBarItems.context = ctx;
                };

                self.init = function () {
                    $actionBarItems.ModuleName = ': Redis';
                    $actionBarItems.IsActionBarVisible = true;
                    $actionBarItems.IsAddKeyVisible = true;
                    $actionBarItems.IsRefreshVisible = true;
                    $actionBarItems.IsSettingsVisible = true;
                    $actionBarItems.IsSearchVisible = true;
                    $actionBarItems.IsDatabaseSelectVisible = true;
                    $actionBarItems.keyViewModel = keyViewModel;

                    $actionBarItems.addKey = function () {
                        var addKeyDialog = createAddKeyDialog();
                        addKeyDialog.BodyViewModel.save = function () {
                            self.createKey(addKeyDialog, function () {
                                // addKeyDialog.BodyViewModel.Key = '';
                                $timeout(function () {
                                    self.clearCreateKeyDialog(addKeyDialog);
                                    if (addKeyDialog.IsChecked) {
                                        addKeyDialog.IsVisible = false;
                                        searchViewModel.search();
                                    }
                                });
                            });
                        };
                    };

                    var editKey = function (key, type) {
                        var addKeyDialog = createAddKeyDialog();
                        console.log(key);
                        console.log(type);
                        addKeyDialog.BodyViewModel.Key = key;
                        addKeyDialog.BodyViewModel.Type = type;
                        self.editKey(addKeyDialog, function () {
                            self.clearCreateKeyDialog(addKeyDialog);
                        });
                    };

                    $actionBarItems.editSet = function () {
                        editKey(keyViewModel.selectedKeys[0].Key, 'set');
                    };

                    $actionBarItems.editHash = function () {
                        editKey(keyViewModel.selectedKeys[0].Key, 'hash');
                    };

                    $actionBarItems.deleteSetItem = function () {
                        var context = $actionBarItems.context;
                        $confirmViewModel.Body =
                                context.setOptions.selectedItems.length === 1
                                ? 'Are you sure you want to delete "' + $utils.truncate(context.setOptions.selectedItems[0].Value) + '"?'
                                : 'Are you sure you want to delete ' + context.setOptions.selectedItems.length + ' items?';
                        $confirmViewModel.show(function () {
                            var repo = $redisRepositoryFactory('set');
                            repo.srem(keyViewModel.selectedKeys[0].Key,
                                _.map(context.setOptions.selectedItems, 'Value'),
                                function () {
                                    for (var i = 0; i < context.setOptions.selectedItems.length; i++) {
                                        _.remove(context.setOptions.data, function (each) {
                                            return each.Value === context.setOptions.selectedItems[i].Value;
                                        });
                                    }

                                    context.setOptions.selectedItems.length = 0;
                                    context.memberForEdit = null;
                                    Notification.success('Deleted successfully');
                                });
                        });
                    };

                    $actionBarItems.deleteHashItem = function () {
                        var context = $actionBarItems.context;
                        $confirmViewModel.Body =
                                context.hashOptions.selectedItems.length === 1
                                ? 'Are you sure you want to delete "' + context.hashOptions.selectedItems[0].Value + '"?'
                                : 'Are you sure you want to delete ' + context.hashOptions.selectedItems.length + ' items?';
                        $confirmViewModel.show(function () {
                            var repo = $redisRepositoryFactory('hash');
                            repo.hdel(keyViewModel.selectedKeys[0].Key,
                                _.map(context.hashOptions.selectedItems, 'Name'),
                                function () {
                                    for (var i = 0; i < context.hashOptions.selectedItems.length; i++) {
                                        _.remove(context.hashOptions.data, function (each) {
                                            return each.Value === context.hashOptions.selectedItems[i].Value;
                                        });
                                    }

                                    context.hashOptions.selectedItems.length = 0;
                                    context.memberForEdit = null;
                                    Notification.success('Deleted successfully');
                                });
                        });
                    };

                    $actionBarItems.removeKey = self.removeKey;
                    $actionBarItems.refresh = self.refresh;
                    $actionBarItems.refreshKey = self.refreshKey;
                    $actionBarItems.changeSettings = self.changeSettings;
                };
            }
        ]);
}