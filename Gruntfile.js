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
                options: {
                    alias: {
                        'jquery': 'jquery-browserify',
                        'colReorder': './libs/datatables-colreorder',
                        'colResize': './libs/colResize/dataTables.colResize',
                        'colVis': 'drmonty-datatables-colvis',
                        'dataTablesSelect': './libs/select/js/dataTables.select',
                        'ui-grid': './app/content/js/ui-grid.min',
                    },
                    debug: true
                }
            }
        },

        'create-windows-installer': {
            x64: {
                appDirectory: './node_modules/electron-prebuilt/dist',
                outputDirectory: '/tmp/build/installer64',
                authors: 'My App Inc.',
                exe: 'myapp.exe'
            },
            ia32: {
                appDirectory: './',
                outputDirectory: '/tmp/build/installer32',
                authors: 'My App Inc.',
                exe: 'myapp.exe'
            }
        }
    });

    grunt.loadNpmTasks('grunt-electron-installer')
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', 'build', ['create-windows-installer']);
};