exports.register = function(module) {
    module
        .service('searchViewModel', [
            '$rootScope',
            '$activeDatabase',
            '$redisRepositoryFactory',
            'redisRepo',
            '$redisScannerFactory',
            '$dialogViewModel',
            '$confirmViewModel',
            '$notifyViewModel',
            '$redisSettings',
            '$busyIndicator',
            '$messageBus',
            '$validator',
            'uiGridConstants',
            'dialog',
            'Notification',

            function(
                $rootScope,
                $activeDatabase,
                $redisRepositoryFactory,
                redisRepo,
                $redisScannerFactory,
                $dialogViewModel,
                $confirmViewModel,
                $notifyViewModel,
                $redisSettings,
                $busyIndicator,
                $messageBus,
                $validator,
                uiGridConstants,
                dialog,
                Notification) {
                var loadKeysOperation = 'loadKeys';
                return {
                    onSuccess: function(){},
                    beforeSearch: function(){},
                    search: function() {
                        var self = this;
                        var pattern = this.Pattern;

                        $notifyViewModel.close();
                        if ($busyIndicator.getIsBusy(loadKeysOperation) === false) {
                            $busyIndicator.Text = 'Loading... ';

                            var repo = $redisRepositoryFactory('string');
                            var client = repo.safeRedisCmd(function(client) {
                                self.beforeSearch();

                                if (pattern) {
                                    client.keys(pattern ? pattern : '*', function(err, keys) {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }

                                        self.onSuccess(keys);
                                        $busyIndicator.setIsBusy(loadKeysOperation, false);
                                    });
                                } else {
                                    var maxLoad = 1000;
                                    client.send_command('SCAN', ['0', 'COUNT', maxLoad], function (err, keys) {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }

                                        if (keys[1].length >= maxLoad) {
                                            Notification.warning(String.format('Only first {0} keys are loaded. Use search to find specific key', maxLoad));
                                        }

                                        self.onSuccess(keys[1]);
                                        $busyIndicator.setIsBusy(loadKeysOperation, false);
                                    });
                                }
                            });

                            $busyIndicator.setIsBusy(loadKeysOperation, true, function() {
                                client.end();
                            });
                        }
                    },
                    Pattern: '',
                    clear: function() {
                        this.Pattern = '';
                        this.IsClearVisible = false;
                        this.search();
                    },
                    IsClearVisible: false,
                    onChange: function() {
                        this.IsClearVisible = this.Pattern !== '';
                    }
                };
            }
        ]);
};