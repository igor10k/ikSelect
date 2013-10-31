module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({
		stylus: {
			dist: {
				src: ['css/style.styl'],
				dest: 'css/style.css'
			}
		},
		uglify: {
			options: {
				preserveComments: 'some'
			},
			dist: {
				files: {
					'js/jquery.ikSelect.min.js': ['js/jquery.ikSelect.js']
				}
			}
		},
		connect: {
			server: {
				options: {
					port: 3000
				}
			}
		},
		watch: {
			stylus: {
				files: 'css/*.styl',
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
				files: ['*.html', 'js/*.js']
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
