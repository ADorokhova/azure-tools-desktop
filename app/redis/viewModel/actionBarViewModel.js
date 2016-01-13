exports.register = function(module) {
    module
        .service('actionBarViewModel', [
            '$timeout',
            'keyViewModel',
            '$activeDatabase',
            '$redisRepositoryFactory',
            'redisRepo',
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
            'keyViewModel',
            function(
                $timeout,
                keyViewModel,
                $activeDatabase,
                $redisRepositoryFactory,
                redisRepo,
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
                keyViewModel) {
                var self = this;

                self.init = function() {
                    $actionBarItems.ModuleName = ': Redis';
                    $actionBarItems.IsActionBarVisible = true;
                    $actionBarItems.IsAddKeyVisible = true;
                    $actionBarItems.IsRefreshVisible = true;
                    $actionBarItems.IsSettingsVisible = true;
                    $actionBarItems.IsSearchVisible = true;
                    $actionBarItems.IsDatabaseSelectVisible = true;



                    $actionBarItems.addKey = function() {
                        var addKeyDialog = $dialogViewModel();

                        addKeyDialog.WithOption = true;
                        addKeyDialog.IsChecked = true;
                        addKeyDialog.OptionText = 'Close dialog on save';
                        addKeyDialog.IsVisible = true;
                        addKeyDialog.BodyViewModel = {
                            Key: '',
                            Value: '',
                            Types: ['string', 'set', 'hash set'],
                            SelectedType: 'string',
                            selectType: function(value) {
                                this.SelectedType = value;
                                var example = '';
                                switch (this.SelectedType) {
                                    case 'string':
                                        example = 'any string';
                                        break;
                                    case 'set':
                                        example = '["set value 1", "set value 2"]';
                                        break;
                                    case 'hash set':
                                        example = '[ ["name 1", "value 1"], ["name 2, "value 2"] ]';
                                        break;
                                }

                                this.ValueExample = 'Example: ' + example;
                            },
                            ValueExample: 'Example: any string'
                        };
                        addKeyDialog.Body = 'createKeyTemplate';
                        addKeyDialog.Header = 'Add Key';

                        addKeyDialog.save = function() {
                            var type = addKeyDialog.BodyViewModel.SelectedType;
                            var repo = $redisRepositoryFactory(type);
                            try {
                                repo.create(
                                    addKeyDialog.BodyViewModel.Key,
                                    addKeyDialog.BodyViewModel.Value);
                            } catch (e) {
                                if (e.name && e.name === 'Json Parse Error') {
                                    console.log(e.details);
                                    showError(e.message + ' ' + addKeyDialog.BodyViewModel.ValueExample);
                                    return;
                                }

                                throw e;
                            }

                            addKeyDialog.BodyViewModel.Key = '';
                            addKeyDialog.BodyViewModel.Value = '';

                            if (addKeyDialog.IsChecked) {
                                addKeyDialog.IsVisible = false;
                                searchViewModel.search();
                            }
                        };
                    };

                    $actionBarItems.removeKey = function() {
                        if (keyViewModel.selectedKeys == null || keyViewModel.selectedKeys.length === 0) return;

                        $timeout(function() {
                            $confirmViewModel.scope().$apply(function() {
                                $confirmViewModel.Body = 'Are you sure you want to delete "' + (keyViewModel.selectedKeys.length === 1 ? keyViewModel.selectedKeys[0].Key : keyViewModel.selectedKeys.length) + '"?';
                                $confirmViewModel.show(function() {
                                    for (var i = 0; i < keyViewModel.selectedKeys.length; i++) {
                                        var type = keyViewModel.selectedKeys[i].Type;
                                        var repo = $redisRepositoryFactory(type);
                                        repo.delete(keyViewModel.selectedKeys[i]);
                                    };
                                    keyViewModel.selectedKeys = [];
                                    searchViewModel.search();
                                });
                            });
                        });
                    };

                    $actionBarItems.refresh = function() {
                        searchViewModel.search();
                    };

                    $actionBarItems.changeSettings = function() {
                        var changeSettingsDialog = $dialogViewModel();
                        changeSettingsDialog.AreButtonsDisabled = false;
                        changeSettingsDialog.WithOption = true;
                        changeSettingsDialog.OptionText = 'Use demo credentials';
                        changeSettingsDialog.IsChecked = false;
                        changeSettingsDialog.onChecked = function() {
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
                            Password: $redisSettings.Password,
                        }
                        changeSettingsDialog.Body = 'changeSettingsTemplate';
                        changeSettingsDialog.Header = 'Settings';
                        changeSettingsDialog.save = function() {
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
                };

                self.changeSettings = function() {
                    $actionBarItems.changeSettings();
                };

                self.refresh = function() {
                    $actionBarItems.refresh();
                };
            }
        ]);
};