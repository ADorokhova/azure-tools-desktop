exports.register = function (module) {
    module
        .service('actionBarViewModel', [
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
            'searchViewModel',
            'Notification',
            function (
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
                searchViewModel,
                Notification) {
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
                    var header = 'Add Key';

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
                            Notification.success(String.format('String value was changed to "{0}" successfully', dialog.BodyViewModel.Value));
                            dialog.BodyViewModel.Value = '';
                            break;
                        case 'hash':
                            Notification.success(String.format('Member with name "{0}" was added successfully', dialog.BodyViewModel.Name));
                            dialog.BodyViewModel.Name = '';
                            dialog.BodyViewModel.Value = '';
                            break;
                        case 'set':
                            Notification.success(String.format('Value "{0}" was added to set successfully', dialog.BodyViewModel.Value));
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
                    changeSettingsDialog.onChecked = function () {
                        if (changeSettingsDialog.IsChecked) {
                            changeSettingsDialog.BodyViewModel.Host = 'redisdor.redis.cache.windows.net';
                            changeSettingsDialog.BodyViewModel.Port = 6379;
                            changeSettingsDialog.BodyViewModel.Password = 'ZaVlBh0AHJmw2r3PfWVKvm7X3FfC5fe+sMKJ93RueNY=';
                        } else {
                            changeSettingsDialog.BodyViewModel.Host = $redisSettings.Host;
                            changeSettingsDialog.BodyViewModel.Port = $redisSettings.Port;
                            changeSettingsDialog.BodyViewModel.Password = $redisSettings.Password;
                        }
                    };

                    changeSettingsDialog.IsVisible = true;
                    changeSettingsDialog.BodyViewModel = {
                        Host: $redisSettings.Host,
                        Port: $redisSettings.Port,
                        Password: $redisSettings.Password
                    };

                    changeSettingsDialog.Body = 'changeSettingsTemplate';
                    changeSettingsDialog.Header = 'Settings';
                    changeSettingsDialog.save = function () {
                        if ($validator.validatePort(+changeSettingsDialog.BodyViewModel.Port) === false) {
                            showError('Port value is wrong. Port must be in range [1;65535]');
                            return;
                        };

                        $redisSettings.Host = changeSettingsDialog.BodyViewModel.Host;
                        $redisSettings.Port = +changeSettingsDialog.BodyViewModel.Port;
                        $redisSettings.Password = changeSettingsDialog.BodyViewModel.Password;
                        changeSettingsDialog.IsVisible = false;
                        searchViewModel.search();
                    };
                };
                self.refresh = function () {
                    searchViewModel.search();
                };
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

                self.init = function () {
                    $actionBarItems.ModuleName = ': Redis';
                    $actionBarItems.IsActionBarVisible = true;
                    $actionBarItems.IsAddKeyVisible = true;
                    $actionBarItems.IsRefreshVisible = true;
                    $actionBarItems.IsSettingsVisible = true;
                    $actionBarItems.IsSearchVisible = true;
                    $actionBarItems.IsDatabaseSelectVisible = true;

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

                        addKeyDialog.BodyViewModel.saveAndEdit = function () {
                            self.createKeyAndEdit(addKeyDialog, function () {
                                self.clearCreateKeyDialog(addKeyDialog);
                            });
                        };
                    };

                    $actionBarItems.removeKey = self.removeKey;
                    $actionBarItems.refresh = self.refresh;
                    $actionBarItems.changeSettings = self.changeSettings;
                };
            }
        ]);
}