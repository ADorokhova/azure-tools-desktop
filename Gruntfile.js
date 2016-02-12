module.exports = function (grunt) {
    // Load all grunt tasks matching the `grunt-*` pattern,
    // unless we're on Linux or Windows
    if (process.platform && process.platform === 'darwin') {
        require('load-grunt-tasks')(grunt);
    } else {
        require('load-grunt-tasks')(grunt, { scope: ['devDependencies', 'dependencies'] });
    }

    // Get Version
    function getVersion() {
        var githash = require('githash');
        var version = process.env.RELEASE_VERSION ? process.env.RELEASE_VERSION : githash();
        return version;
    }
    console.log(getVersion())
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
                        'angular-ui-grid': './libs/angular-ui-grid',
                    },
                    debug: true
                }
            }
        },

        'create-windows-installer': {
            x64: {
                appDirectory: './builds/azuretools-win32-x64',
                outputDirectory: './builds/installer64',
                exe: 'azuretools.exe',
                authors: 'Vladimir Dorokhov',
                setupIcon: './public/icon/icon.ico',
            },
            ia32: {
                appDirectory: './builds/azuretools-win32-ia32',
                outputDirectory: './builds/installer32',
                exe: 'azuretools.exe',
                authors: 'Vladimir Dorokhov',
                setupIcon: './public/icon/icon.ico'
            }
        },
        electron: {
            osx: {
                options: {
                    name: 'azuretools',
                    dir: 'electronbuildcache',
                    out: 'builds',
                    version: '0.36.7',
                    overwrite: true,
                    platform: 'darwin',
                    arch: 'x64'
                }
            },
            windowsWithIcon: {
                options: {
                    name: 'azuretools',
                    platform: 'win32',
                    arch: 'all',
                    dir: './node_modules/electron-prebuilt/dist',
                    out: './builds',
                    version: '0.36.7',
                    overwrite: true,
                    asar: false,
                    icon: 'public/icon/icon.ico',
                    'version-string': {
                        ProductName: 'Azure Tools',
                        ProductVersion: '1.0.0.0',
                        FileDescription: 'Azure Tools',
                        FileVersion: '1.0.0.0'
                    }
                }
            },
            linux: {
                options: {
                    name: 'azuretools',
                    dir: 'electronbuildcache',
                    out: 'builds',
                    version: '0.36.7',
                    overwrite: true,
                    platform: 'linux',
                    arch: 'ia32'
                }
            }
        },
        zip: {
            linux: {
                cwd: './builds/azuretools-linux-ia32',
                src: ['./builds/azuretools-linux-ia32/**/*'],
                dest: './builds/azuretools-linux-ia32/build.zip'
            },
            osx: {
                cwd: './builds/azuretools-darwin-x64',
                src: ['./builds/azuretools-darwin-x64/**/*'],
                dest: './builds/azuretools-darwin-x64/build.zip'
            },
            windows32: {
                cwd: './builds/azuretools-win32-ia32',
                src: ['./builds/azuretools-win32-ia32/*'],
                dest: './builds/azuretools-win32-ia32/build.zip'
            },
            windows64: {
                cwd: './builds/azuretools-win32-x64',
                src: ['./builds/azuretools-win32-x64/*'],
                dest: './builds/azuretools-win32-x64/build.zip'
            }
        },
        exec: {
            flatten: {
                command: 'node ../node_modules/flatten-packages/bin/flatten .',
                cwd: './tmp'
            }
        },
        appdmg: {
            options: {
                title: 'Azure Tools',
                icon: './public/icon/ase.icns',
                background: './public/osx/background.tiff',
                'icon-size': 156,
                contents: [
                    {
                        x: 470,
                        y: 430,
                        type: 'link',
                        path: '/Applications'
                    },
                    {
                        x: 120,
                        y: 430,
                        type: 'file',
                        path: './builds/azuretools-darwin-x64/azuretools.app'
                    }
                ]
            },
            target: {
                dest: './builds/Azure Tools-darwin-x64/azuretools.dmg'
            }
        },
        copy: {
            windows32: {
                expand: true,
                src: ['main.js', 'package.json', 'app/**', 'libs/**'],
                dest: './builds/azuretools-win32-ia32/resources/app'
            },
            windows64: {
                expand: true,
                src: ['main.js', 'package.json', 'app/**', 'libs/**'],
                dest: './builds/azuretools-win32-x64/resources/app',

                overwrite: true,
            },
            windows32pack : {
                expand: true,
                cwd: './tmp',
                src: ['node_modules/**'],
                dest: './builds/azuretools-win32-ia32/resources/app'
            },
            windows64pack: {
                expand: true,
                cwd: './tmp',
                src: ['node_modules/**'],
                dest: './builds/azuretools-win32-x64/resources/app'
            }
        },
        clean: {
            cache: ['./electronbuildcache', './builds', './tmp'],
            app: ['./builds/azuretools-win32-ia32/resources/app', './builds/azuretools-win32-x64/resources/app']
        },
        packageModules: {
            dist: {
                src: 'package.json',
                dest: './tmp',
            }
        },
        'file-creator': {
            version_file: {
                '.version': function (fs, fd, done) {
                    var githash = require('githash');
                    var version = process.env.RELEASE_VERSION ? process.env.RELEASE_VERSION : githash();
                    fs.writeSync(fd, version);
                    done();
                }
            }
        },
    });

    grunt.registerTask('default', 'build', ['installerWindows32', 'installerWindows64']);
    grunt.registerTask('installerWindows32', ['buildWindows32', 'create-windows-installer:ia32']);
    grunt.registerTask('installerWindows64', ['buildWindows64', 'create-windows-installer:x64']);

    grunt.registerTask('prebuild', ['clean', 'file-creator:version_file']);
    grunt.registerTask('buildWindows32', ['prebuild', 'electron:windowsWithIcon', 'clean:app', 'copy:windows32', 'packageModules', 'exec:flatten', 'copy:windows32pack', 'zip:windows32']);
    grunt.registerTask('buildWindows64', ['prebuild', 'electron:windowsWithIcon', 'clean:app', 'copy:windows64', 'packageModules', 'exec:flatten', 'copy:windows64pack', 'zip:windows64']);
    grunt.registerTask('osx', ['clean', 'copy:app', 'electron:osx', 'appdmg']);
    grunt.registerTask('linux', ['clean', 'copy:app', 'electron:linux'])
};