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
        extras || []
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
        extras || []
    );
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
        .map(transform)
        .filter((item) => !!item);
}

/**
 * Gets a list of pre-canned project overrides for every project type/language
 * combination. This list is useful when testing the task builders.
 *
 * @return {Array} An array of objects that includes the following fields:
 *    - title : A string that can be interpolated into test descriptions
 *    - overrides: Specific overrides to a project definition that apply the
 *    project type.
 */
export function getAllProjectOverrides() {
    return mapProjectList(({ type, language }) => ({
        title: `${type} - ${language}`,
        overrides: {
            'buildMetadata.type': type,
            'buildMetadata.language': language,
        },
    }));
}
