module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                },
                src: ['test/**/*.js']
            }
        },
        browserify: {
            dist: {
                files: {
                    'bin/<%= pkg.name %>.js': ['src/**/*.js', 'main.js'],
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'bin/<%= pkg.name %>.min.js': ['bin/<%= pkg.name %>.js']
                }
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'main.js', 'src/**/*.js', 'test/**/*.js']
        },
        watch: {
            toArray: {
                files: ['images/**/*.png', 'src/layers/*.js'],
                tasks: ['toArray']
            }
        },
        toArray: {
            images: {
                options: {
                    getFiles: true
                },
                files: {
                    'src/images.js': ['images/**/*.png']
                }
            },
            menus: {
                options: {
                    getFolders: true
                },
                files: {
                    'src/menus.js': ['images/menu/*']
                }
            },
            layers: {
                options: {
                    getFiles: true,
                    require: true,
                },
                files: {
                    'src/layers.js': ['src/layers/*.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerMultiTask('toArray', 'Put file system file names into an array with module.exports preceding it', function() {
        var data = [];

        var options = this.options();

        var layers = this.target === 'layers';

        this.files.forEach(function(file) {
            file.src.filter(function(filepath) {
                if(options.getFiles && options.getFolders)
                    return true;

                var isFile = grunt.file.isFile(filepath);

                return (options.getFiles && isFile) || (options.getFolders && !isFile);
            }).map(function(filepath) {
                //TODO: Find better way to handle layer list
                if(layers) {
                    var label = filepath.split('/');
                    label = label[label.length - 1].split('.')[0];
                    var loc = filepath.split('.');
                    loc.pop();
                    loc = loc[0].split('/');
                    loc = './' + loc[1] + '/' + loc[2];

                    data.push('{ name: "' + label + '", layer: require("' + loc + '") }');
                }
                else {
                    data.push('"' + filepath + '"');
                }

                grunt.log.ok(filepath);
            });

            grunt.file.write(file.dest, 'module.exports = [' + data + '];');
        });
    });

    grunt.registerTask('test', ['jshint', 'mochaTest']);
    grunt.registerTask('default', ['toArray', 'jshint', 'mochaTest', 'browserify', 'uglify']);
};

