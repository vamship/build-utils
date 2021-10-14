'use strict';

const _execa = require('execa');
const _gulp = require('gulp');
const _log = require('fancy-log');
const _semver = require('semver');

/**
 * Sub builder that builds a docker image based on a predefined dockerfile.
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
    const { version } = project;

    const dockerBin = 'docker';
    const major = _semver.major(version);
    const minor = _semver.minor(version);

    const tasks = project.getDockerTargets().map((target) => {
        const { name, isDefault, isDeprecated } = target;

        let repo = target.repo;
        if (typeof process.env.BUILD_DOCKER_REPO !== 'undefined') {
            repo = process.env.BUILD_DOCKER_REPO;
            _log.warn(`Docker repo override specified: [${repo}]`);
        }

        let suffix = `${isDefault ? '' : '-name'}${
            options.latestOnly ? '-latest' : ''
        }`;

        const tagList = options.latestOnly
            ? ['latest']
            : [version, major, `${major}.${minor}`];

        const tags = tagList.map((tag) => `${repo}:${tag}`);

        const tasks = tags.map((tag) => {
            const tagTask = () =>
                _execa(dockerBin, ['tag', tag], {
                    stdio: 'inherit',
                });
            tagTask.displayName = `publish-docker-tag-${tag}${suffix}`;
            tagTask.description = `Tag image with ${tag} (${name})`;

            const pushTask = () =>
                _execa(dockerBin, ['push', tag], {
                    stdio: 'inherit',
                });
            pushTask.displayName = `publish-docker-push-${tag}${suffix}`;
            pushTask.description = `Publish docker image with ${tag} (${name}) to registry`;

            const task = _gulp.series([tagTask, pushTask]);
            task.displayName = `publish-docker-${tag}${suffix}`;
            task.description = `Tag and push image with ${tag} (${name})`;

            return task;
        });

        const task = _gulp.parallel(tasks);
        task.displayName = `publish${suffix}`;
        task.description = `Tags image ${name} with version tags, and pushes to registry`;

        return task;
    });

    return tasks;
};
