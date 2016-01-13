exports.register = function(module) {
    module
        .service('stringViewModel', [
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
            function(
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
                dialog) {

                
            }
        ])
};