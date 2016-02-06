exports.register = function(module) {
    module
        .service('keyViewModel', [
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
                var self = this;

                return {
                    enableSorting: true,
                    columnDefs: [{
                        name: 'Key',
                        field: 'Key',
                        width: '*',
                        sort: {
                            direction: uiGridConstants.ASC,
                            priority: 0,
                        }
                    }],
                    rowHeight: 18,
                    data: [],
                    noUnselect: true,
                    enableRowSelection: true,
                    enableSelectAll: false,
                    enableFullRowSelection: true,
                    enableRowHeaderSelection: false,
                    multiSelect: true,
                    enableColumnMenus: false,
                    selectedKeys: [],
                    modifierKeysToMultiSelect: true,
                    virtualizationThreshold: 30,
                };
            }
        ])
};