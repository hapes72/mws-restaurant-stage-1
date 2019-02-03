module.exports = function(grunt) {

    grunt.initConfig({
        responsive_images: {
            dev: {
                files: [{
                    expand: true,
                    src: ['img/**/*.{jpg,gif,png}'],
                    cwd: 'original/',
                    dest: ''
                }]
            }
        },
    });

    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.registerTask('default', ['responsive_images']);

};