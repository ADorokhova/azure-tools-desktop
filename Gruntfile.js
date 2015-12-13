module.exports = function(grunt) {
    grunt.initConfig({
        watch: {
            build: {
                files: ['./app/app.js'],
                tasks: ['browserify'],
                options: {
                    alias: {
                        'net': './libs/net-chromify/index.js',
                    }
                }
            }
        },
        browserify: {
            dist: {
                src: './app/app.js',
                dest: './app/bundle.js',
                transform: [nwjsify /** or nwjsify.with('_require') **/],
                options: {
                    alias: {
                        'jquery': 'jquery-browserify',
                        'colReorder': './libs/datatables-colreorder',
                        'colResize': './libs/colResize/dataTables.colResize',
                        'colVis': 'drmonty-datatables-colvis',
                        'dataTablesSelect' : './libs/select/js/dataTables.select',
                        'ui-grid' : './app/content/js/ui-grid.min',
                    },
                    debug: true
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', 'build', ['browserify']);
};