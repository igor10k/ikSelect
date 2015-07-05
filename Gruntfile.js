module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({
		stylus: {
			dist: {
				src: ['docs/css/style.styl'],
				dest: 'docs/css/style.css'
			}
		},
		uglify: {
			options: {
				preserveComments: 'some'
			},
			dist: {
				files: {
					'dist/jquery.ikSelect.min.js': ['src/jquery.ikSelect.js']
				}
			}
		},
		connect: {
			server: {
				options: {
					// hostname: '*',
					port: 3000
				}
			}
		},
		watch: {
			stylus: {
				files: 'docs/css/*.styl',
				tasks: ['stylus']
			},
			livereload: {
				options: {
					livereload: true
				},
				files: ['<%= stylus.dist.dest %>']
			},
			html: {
				options: {
					livereload: true
				},
				files: ['*.html', '**/*.js']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['stylus', 'connect', 'watch']);
	grunt.registerTask('production', ['stylus', 'uglify']);
};
