'use strict';

const _gulp = require('gulp');
const _execa = require('execa');
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
        const { name, isDefault, isDeprecated, repo } = target;

        const suffix = isDefault ? '' : `-${name}`;

        const tags = [version, major, `${major}.${minor}`, 'latest'].map(
            (tag) => `${repo}:${tag}`
        );
        const latestTag = tags[tags.length - 1];

        const tasks = tags.map((tag) => {
            const tagTask = () =>
                _execa(dockerBin, ['tag', latestTag, tag], {
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
