import semver from 'semver';

/**
 * Checks if a given input tag is a valid semantic version, and returns an array
 * of the four corresponding tags (ex. tag = '1.2.3' => ['1.2.3', '1.2', '1', 'latest']).
 * If tag = '1.2' => ['1.2.0', '1.2', '1', 'latest'].
 * If tag = '1' => ['1.0.0', '1.0', '1', 'latest'].
 * If the tag is not a semantic version, such as 'latest' simply returns ['latest']
 *
 * @param {String} tag String input for tag name of docker image
 * @returns {Array} Array of tag strings
 */
export function getSemverComponents(tag) {
    const semTag = semver.coerce(tag);
    if (!semver.valid(semTag)) {
        return [tag];
    }

    const major = semver.major(semTag);
    const minor = semver.minor(semTag);
    const patch = semver.patch(semTag);

    return [
        `${major}.${minor}.${patch}`,
        `${major}.${minor}`,
        `${major}`,
        'latest',
    ];
}
