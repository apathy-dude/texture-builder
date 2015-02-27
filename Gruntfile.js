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
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/**/*.js', 'main.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'main.js', 'src/**/*.js', 'test/**/*.js']
        },
        watch: {
            toArray: {
                files: ['images/**/*.png'],
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
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerMultiTask('toArray', 'Put file system file names into an array with module.exports preceding it', function() {
        var data = [];

        var options = this.options();

        this.files.forEach(function(file) {
            file.src.filter(function(filepath) {
                if(options.getFiles && options.getFolders)
                    return true;

                var isFile = grunt.file.isFile(filepath);

                return (options.getFiles && isFile) || (options.getFolders && !isFile);
            }).map(function(filepath) {
                data.push('"' + filepath + '"');

                grunt.log.ok(filepath);
            });

            grunt.file.write(file.dest, 'module.exports = [' + data + '];');
        });
    });

    grunt.registerTask('test', ['jshint', 'mochaTest']);
    grunt.registerTask('default', ['toArray', 'jshint', 'mochaTest', 'concat', 'uglify']);
};

