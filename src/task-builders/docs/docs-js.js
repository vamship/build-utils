'use strict';

const _gulp = require('gulp');
const _gulpJsdoc = require('gulp-jsdoc3');

/**
 * Sub builder that creates a task that will generate documentation from
 * javascript files.
 *
 * @private
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
module.exports = (project, options) => {
    const { rootDir, name, version } = project;

    const docOptions = Object.assign(
        {
            opts: {
                readme: rootDir.getFilePath('README.md'),
                destination: rootDir.getFilePath(`docs/${name}/${version}`),
                template: rootDir.getFilePath('node_modules/docdash')
            }
        },
        options
    );

    const paths = ['src']
        .map((dir) => rootDir.getChild(dir))
        .map((dir) => ['js'].map((ext) => dir.getAllFilesGlob(ext)))
        .reduce((result, arr) => result.concat(arr), []);

    const task = () =>
        _gulp.src(paths, { allowEmpty: true }).pipe(_gulpJsdoc(docOptions));

    return task;
};
