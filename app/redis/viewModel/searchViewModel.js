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
                dialog) {
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

                                client.keys(pattern ? pattern : '*', function(err, keys) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }

                                    self.onSuccess(keys);
                                    $busyIndicator.setIsBusy(loadKeysOperation, false);
                                });
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