'use strict';

import Project from '../../src/project2.js';
import {
    getAllButString,
    getAllButObject,
    getAllButArray,
    makeOptional,
} from '../utils/data-generator.js';
import { setProperty } from 'dot-prop';

describe('[Project]', () => {
    function _createProjectDefinition(overrides) {
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

    function _createInstance(name, version) {
        name = name || 'sample-project';
        version = version || '1.0.0';
        return new Project(name, version);
    }

    describe('ctor()', () => {
        getAllButObject().forEach((definition) => {
            it(`should throw an error if invoked without valid project definition (value=${typeof definition})`, () => {
                const error = 'Invalid project definition (arg #1)';
                const wrapper = () => new Project(definition);

                expect(wrapper).toThrow(error);
            });
        });

        describe('[package.json properties]', () => {
            getAllButString('').forEach((name) => {
                it(`should throw an error if the project definition has an invalid name (value=${typeof name})`, () => {
                    const definition = _createProjectDefinition({ name });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*name.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            getAllButString('', 'abc').forEach((version) => {
                it(`should throw an error if invoked without a valid version (value=${typeof version})`, () => {
                    const definition = _createProjectDefinition({ version });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*version.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });
        });

        describe('[buildMetadata properties]', () => {
            getAllButObject().forEach((buildMetadata) => {
                it(`should throw an error if invoked without a valid buildMetadata (value=${typeof buildMetadata})`, () => {
                    const definition = _createProjectDefinition({
                        buildMetadata,
                    });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*buildMetadata.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            getAllButString('bad-type').forEach((type) => {
                it(`should throw an error if invoked without a valid buildMetadata.type (value=${typeof type})`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.type': type,
                    });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*type.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            getAllButString('bad-language').forEach((language) => {
                it(`should throw an error if invoked without a valid buildMetadata.language (value=${typeof language})`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.language': language,
                    });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*language.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            makeOptional(getAllButArray()).forEach((requiredEnv) => {
                it(`should throw an error if invoked without a valid buildMetadata.requiredEnv (value=${typeof requiredEnv})`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.requiredEnv': requiredEnv,
                    });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*requiredEnv.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            makeOptional(getAllButArray()).forEach((staticFilePatterns) => {
                it(`should throw an error if invoked without a valid buildMetadata.staticFilePatterns (value=${typeof staticFilePatterns})`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.staticFilePatterns': staticFilePatterns,
                    });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*staticFilePatterns.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            describe('[aws properties]', () => {
                makeOptional(getAllButObject()).forEach((aws) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws (value=${typeof aws})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.aws': aws,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*aws.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                getAllButObject().forEach((stacks) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws.stacks (value=${typeof stacks})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.aws.stacks': stacks,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*stacks.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                it(`should throw an error if invoked without at least one stack`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.aws': { stacks: {} },
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No AWS stacks defined/;

                    expect(wrapper).toThrow(error);
                });

                ['$?!', ''].forEach((stackName) => {
                    it(`should throw an error if the stack name is invalid`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.aws': {
                                stacks: {
                                    [`${stackName}`]: 'foo',
                                },
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*additional properties.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                getAllButString('').forEach((stackName) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws.stacks[stackName] (value=${typeof stackName})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.aws.stacks.myStack': stackName,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*myStack.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                it('should throw an error if unsupported additional parameters are specified', () => {
                    const definition = _createProjectDefinition();
                    definition.buildMetadata.aws.foo = 'bar';
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*additional properties.*\]/;

                    expect(wrapper).toThrow(error);
                });
            });

            describe('[container properties]', () => {
                makeOptional(getAllButObject()).forEach((container) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container (value=${typeof container})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container': container,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*container.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                it(`should throw an error if invoked without at least one build configuration`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.container': {},
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No container builds defined/;

                    expect(wrapper).toThrow(error);
                });

                ['$?!', ''].forEach((buildName) => {
                    it(`should throw an error if the build name is invalid`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container': {
                                [`${buildName}`]: 'foo',
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*additional properties.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                getAllButObject().forEach((buildName) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container[buildName] (value=${typeof buildName})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild': buildName,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*myBuild.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                getAllButString('').forEach((repo) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.myBuild.repo (value=${typeof repo})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild.repo': repo,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*repo.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                makeOptional(getAllButString('')).forEach((buildFile) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.myBuild.buildFile (value=${typeof buildFile})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild.buildFile':
                                buildFile,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*buildFile.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                makeOptional(getAllButObject()).forEach((buildArgs) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.myBuild.buildArgs (value=${typeof buildArgs})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild.buildArgs':
                                buildArgs,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*buildArgs.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                it('should throw an error if unsupported additional parameters are specified', () => {
                    const definition = _createProjectDefinition();
                    definition.buildMetadata.container.myBuild.foo = 'bar';
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*additional properties.*\]/;

                    expect(wrapper).toThrow(error);
                });

                ['$?!', ''].forEach((buildArg) => {
                    it(`should throw an error if the build arg name is invalid`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild.buildArgs': {
                                [`${buildArg}`]: 'foo',
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*additional properties.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });

                getAllButString().forEach((buildArgValue) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.myBuild.buildArgs[buildArgValue] (value=${typeof buildArgValue})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild.buildArgs': {
                                foo: buildArgValue,
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*buildArgs.*\]/;

                        expect(wrapper).toThrow(error);
                    });
                });
            });
        });
    });

    describe('[properties]', () => {
        [
            ['name', 'test-project'],
            ['version', '1.2.3'],
            ['buildMetadata.language', 'ts'],
            ['buildMetadata.type', 'cli'],
        ].forEach(([property, value]) => {
            it(`should set the property [${property}]  based on data in the project definition`, () => {
                const definition = _createProjectDefinition({
                    [property]: value,
                });
                const project = new Project(definition);
                const projectProp = property.split('.').pop();

                console.log(projectProp);
                expect(project[projectProp]).toEqual(value);
            });
        });
    });

    describe('getStaticFilePatterns()', () => {
        it('should return an empty array if the definition does not contain static file patterns', () => {
            const definition = _createProjectDefinition({
                'buildMetadata.staticFilePatterns': undefined,
            });
            const project = new Project(definition);

            expect(project.getStaticFilePatterns()).toEqual([]);
        });

        it('should return the values specified in the project definition', () => {
            const values = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.staticFilePatterns': values,
            });
            const project = new Project(definition);

            expect(project.getStaticFilePatterns()).toEqual(values);
        });

        it('should return a copy of the values, not a reference', () => {
            const values = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.staticFilePatterns': values,
            });
            const project = new Project(definition);

            const actualValues = project.getStaticFilePatterns();
            actualValues.pop();

            expect(values).not.toEqual(actualValues);
        });
    });

    xdescribe('createTasks()', () => {
        getAllButObject().forEach((gulp) => {
            it(`should throw an error if invoked without a valid Gulp instance (value=${typeof gulp})`, () => {
                const project = _createInstance();
                const wrapper = () => project.createTasks(gulp);
                const error = 'Invalid gulp instance (arg #1)';

                expect(wrapper).toThrow(error);
            });
        });
    });
});
