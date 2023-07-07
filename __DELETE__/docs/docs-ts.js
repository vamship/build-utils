'use strict';

import _gulp from 'gulp';
import _gulpTypedoc from 'gulp-typedoc';

/**
 * Sub builder that creates a task that will generate documentation from
 * typescript files.
 *
 * @private
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
export default (project, options) => {
    const { rootDir, name, version } = project;

    const docOptions = Object.assign(
        {
            name: `${name} Documentation`,
            disableOutputCheck: true,
            readme: rootDir.getFilePath('README.md'),
            out: rootDir.getFilePath(`docs/${name}/${version}`),
        },
        options
    );

    const paths = ['src']
        .map((dir) => rootDir.getChild(dir))
        .map((dir) => ['ts'].map((ext) => dir.getAllFilesGlob(ext)))
        .reduce((result, arr) => result.concat(arr), []);

    const task = () =>
        _gulp.src(paths, { allowEmpty: true }).pipe(_gulpTypedoc(docOptions));

    return task;
};
