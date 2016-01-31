module.exports = function(grunt) {
    // Load all grunt tasks matching the `grunt-*` pattern,
    // unless we're on Linux or Windows
    if (process.platform && process.platform === 'darwin') {
        require('load-grunt-tasks')(grunt);
    } else {
        require('load-grunt-tasks')(grunt, {scope: ['devDependencies', 'dependencies']});
    }

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
        },
        electron: {
            osxBuild: {
                options: {
                    name: 'azuretools',
                    dir: 'electronbuildcache',
                    out: 'builds',
                    version: '0.36.7',
                    overwrite: true,
                    platform: 'darwin',
                    arch: 'x64'
                }
            }
        },
        appdmg: {
            options: {
                title: 'Azure Tools',
                icon: './public/icon/ase.icns',
                background: './public/osx/background.tiff',
                'icon-size': 156,
                contents: [{
                    x: 470,
                    y: 430,
                    type: 'link',
                    path: '/Applications'
                }, {
                    x: 120,
                    y: 430,
                    type: 'file',
                    path: './builds/azuretools-darwin-x64/azuretools.app'
                }]
            },
            target: {
                dest: './builds/Azure Tools-darwin-x64/azuretools.dmg'
            }
        },
        copy: {
            app: {
                expand: true,
                src: ['main.js', 'package.json', 'app/**', 'node_modules/**', 'libs/**'],
                dest: 'electronbuildcache/'
            }
        },
        clean: ['./electronbuildcache', './builds']
    });

    grunt.registerTask('default', 'build', ['create-windows-installer']);
    grunt.registerTask('osx', ['clean', 'copy:app', 'electron', 'appdmg']);
};