module.exports = {
    files: {
        expand: true,
        src: [
            './img/*.{png,jpg,jpeg}',
            './img/{,*/}*.{png,jpg,jpeg}'
        ],
        dest: ''
    }
}