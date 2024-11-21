import _path from 'path';

function _transformOverrides({ type, language, noContainer, defaultAwsStack }) {
    const overrides = {
        title: `${type} - ${language}${noContainer ? ' [no container]' : ''}`,
        overrides: {
            'buildMetadata.type': type,
            'buildMetadata.language': language,
        },
        containerSpecified: !noContainer,
    };

    if (noContainer) {
        overrides.overrides['buildMetadata.container'] = undefined;
    }

    if (defaultAwsStack) {
        overrides.overrides['buildMetadata.aws.stacks.default'] =
            'default-stack';
    }

    return overrides;
}

/**
 * Generates an array of sample values of different types - everything except a
 * string.
 *
 * @param {Array} extras An array of extra values to append to the original
 * list.
 *
 * @returns {Array} A list of values that contain everything except a string,
 * concatenated with the extras.
 */
export function getAllButString(...extras) {
    return [undefined, null, 123, true, {}, [], () => 0].concat(extras || []);
}

/**
 * Generates an array of sample values of different types - everything except a
 * object.
 *
 * @param {Array} extras An array of extra values to append to the original
 * list.
 *
 * @returns {Array} A list of values that contain everything except a object,
 * concatenated with the extras.
 */
export function getAllButObject(...extras) {
    return [undefined, null, 123, true, 'abc', [], () => 0].concat(
        extras || [],
    );
}

/**
 * Generates an array of sample values of different types - everything except an
 * array.
 *
 * @param {Array} extras An array of extra values to append to the original
 * list.
 *
 * @returns {Array} A list of values that contain everything except an array,
 * concatenated with the extras.
 */
export function getAllButArray(...extras) {
    return [undefined, null, 123, true, 'abc', {}, () => 0].concat(
        extras || [],
    );
}

/**
 * Generates an array of sample values of different types - everything except a
 * boolean.
 *
 * @param {Array} extras An array of extra values to append to the original
 * list.
 *
 * @returns {Array} A list of values that contain everything except a boolean,
 * concatenated with the extras.
 */
export function getAllButBoolean(...extras) {
    return [undefined, null, 123, 'abc', {}, [], () => 0].concat(extras || []);
}

/**
 * Generates an array of sample values of different types - everything except a
 * function.
 *
 * @param {Array} extras An array of extra values to append to the original
 * list.
 *
 * @returns {Array} A list of values that contain everything except a function,
 * concatenated with the extras.
 */
export function getAllButFunction(...extras) {
    return [undefined, null, 123, true, 'abc', {}, []].concat(extras || []);
}

/**
 * Takes an array of values and makes it sutiable for an argument that is
 * optional. Essentially, remove "undefined" from the value list, because an
 * optional argument can be set to undefined.
 *
 * @param {Array} values A list of values to modify.
 *
 * @return {Array} A list of test values, with any occurrences of "undefined"
 * removed.
 */
export function makeOptional(values) {
    return values.filter((value) => typeof value !== 'undefined');
}

/**
 * Generates a comprehensive list of all projects and transforms each record
 * using the provided callback. The mapped values  are filtered for falsy
 * values, and the resultant array is returned.
 *
 * @param {Function} transform A transformer function that receives the project
 * type and langauage as two input parameters.
 *
 * @return {Array} An array of transformed objects, with falsy results removed.
 */
export function mapProjectList(transform) {
    return ['lib', 'cli', 'api', 'ui', 'container', 'aws-microservice']
        .map((type) => ['js', 'ts'].map((language) => ({ language, type })))
        .reduce((result, item) => result.concat(item), [])
        .concat([
            { language: 'js', type: 'cli', noContainer: true },
            { language: 'ts', type: 'cli', noContainer: true },
        ])
        .concat([
            {
                language: 'js',
                type: 'aws-microservice',
                defaultAwsStack: true,
            },
            {
                language: 'ts',
                type: 'aws-microservice',
                defaultAwsStack: true,
            },
        ])
        .map(transform)
        .filter((item) => !!item);
}

/**
 * Gets a list of pre-canned project overrides for every project type/language
 * combination. This list is useful when testing the task builders.
 *
 * @param {Number} [maxItems=0] The upper limit to the number of records
 * returned. This is a useful parameter when debugging test failures.
 *
 * @return {Array} An array of objects that includes the following fields:
 *    - title : A string that can be interpolated into test descriptions
 *    - overrides: Specific overrides to a project definition that apply the
 *    project type.
 */
export function getAllProjectOverrides(maxItems) {
    if (typeof maxItems !== 'number') {
        maxItems = -1;
    }

    return mapProjectList(_transformOverrides).filter(
        (_, index) => maxItems < 0 || index < maxItems,
    );
}

/**
 * Gets a list of pre-canned project overrides for the specified project types,
 * combined with all language options. This list is useful when testing the task
 * builders.
 *
 * @param {Array} projectTypes A list of project types to include in
 * the result.
 * @param {Number} [maxItems=0] The upper limit to the number of records
 * returned. This is a useful parameter when debugging test failures.
 *
 * @return {Array} An array of objects that includes the following fields:
 *    - title : A string that can be interpolated into test descriptions
 *    - overrides: Specific overrides to a project definition that apply the
 *    project type.
 */
export function getSelectedProjectOverrides(projectTypes, maxItems) {
    if (!(projectTypes instanceof Array)) {
        throw new Error('Invalid projectTypes (arg #1)');
    }
    if (typeof maxItems !== 'number') {
        maxItems = -1;
    }

    return mapProjectList(_transformOverrides)
        .filter(
            ({ overrides }) =>
                !projectTypes ||
                projectTypes.indexOf(overrides['buildMetadata.type']) >= 0,
        )
        .filter((_, index) => maxItems < 0 || index < maxItems);
}

/**
 * Generates an array of glob patterns by interpolating multiple extensions into
 * multiple directories.
 *
 * @param {String} basePath The base path to use when generating glob paths
 * @param {String} dirs An array of directories to use
 * @param {String} extensions An array of extensions to use
 *
 * @return {Array} A list of glob patterns.
 */
export function generateGlobPatterns(basePath, dirs, extensions) {
    return dirs
        .map((dir) =>
            extensions.map((ext) =>
                _path.join(
                    basePath,
                    dir,
                    '**',
                    ext.length > 0 ? `*.${ext}` : '*',
                ),
            ),
        )
        .reduce((result, item) => result.concat(item), []);
}

/**
 * Generates a testing container object for the project property container based on a list
 * of container names. Adds the default container as well.
 *
 * @param {Array} targetList An array of container names as strings
 *
 * @return {Object} An object of containers.
 */
export function createContainerObject(targetList) {
    const containers = targetList.reduce((result, key) => {
        result[key] = {
            repo: 'my-repo-2',
            buildFile: 'BuildFile-2',
            buildArgs: {
                arg1: 'value2',
            },
            buildSecrets: {
                secret1: {
                    type: 'secret',
                    src: 'secret1',
                },
            },
        };
        return result;
    }, {});

    // Add default container
    containers.default = {
        repo: 'my-repo',
        buildFile: 'BuildFile-1',
        buildArgs: {
            arg1: 'value1',
        },
        buildSecrets: {
            secret1: {
                type: 'env',
                src: 'MY_SECRET',
            },
        },
    };
    return containers;
}
