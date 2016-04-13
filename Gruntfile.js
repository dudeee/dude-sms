module.exports = function (grunt) { // eslint-disable-line
  grunt.initConfig({
    babel: {
      scripts: {
        files: [{
          expand: true,
          cwd: 'src',
          src: '**/*.js',
          dest: 'build/'
        }]
      }
    },
    clean: {
      files: ['build/**/*.js']
    },
    eslint: {
      files: ['src/**/*.js']
    },
    watch: {
      scripts: {
        files: ['src/**/*.js'],
        tasks: ['eslint', 'babel']
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('default', ['clean', 'eslint', 'babel']);
};
