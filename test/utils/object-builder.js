import { setProperty } from 'dot-prop';
import { stub } from 'sinon';

/**
 * Creates a default project definition, with the option to override specific
 * properties.
 *
 * @param {Object} overrides Optional overridden properties. This is an array of
 * properties with overridden values. Nested properties may be referenced by
 * using a dot separator between levels.
 *
 * @returns {Object} The project definition.
 */
export function buildProjectDefinition(overrides) {
    overrides = overrides || [];
    const definition = {
        name: 'sample-project',
        version: '1.0.0',
        buildMetadata: {
            type: 'lib',
            language: 'js',
            requiredEnv: ['ENV_1', 'ENV_2'],
            aws: {
                stacks: {
                    mystack: 'foo',
                },
            },
            staticFilePatterns: ['foo'],
            container: {
                myBuild: {
                    repo: 'my-repo',
                    buildFile: 'BuildFile-1',
                    buildArgs: {
                        arg1: 'value1',
                    },
                },
            },
        },
    };

    Object.keys(overrides).forEach((key) => {
        const value = overrides[key];
        setProperty(definition, key, value);
    });
    return definition;
}

/**
 * Creates and returns a mock object for gulp.
 *
 * @returns {Object} A mock gulp object.
 */
export function createGulpMock() {
    return [
        { method: 'src' },
        { method: 'pipe' },
        { method: 'dest', retValue: '_dest_ret_' },
    ].reduce(
        (result, item) => {
            const { method, retValue } = item;
            const mock = stub().callsFake(() => {
                result.callSequence.push(method);
                return typeof retValue !== 'undefined' ? retValue : result;
            });
            result[method] = mock;
            return result;
        },
        { callSequence: [] }
    );
}
