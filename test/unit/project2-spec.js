import {expect} from 'chai';
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

    describe('ctor()', () => {
        getAllButObject().forEach((definition) => {
            it(`should throw an error if invoked without valid project definition (value=${typeof definition})`, () => {
                const error = 'Invalid project definition (arg #1)';
                const wrapper = () => new Project(definition);

                expect(wrapper).to.throw(error);
            });
        });

        describe('[package.json properties]', () => {
            getAllButString('').forEach((name) => {
                it(`should throw an error if the project definition has an invalid name (value=${typeof name})`, () => {
                    const definition = _createProjectDefinition({ name });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*name.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('', 'abc').forEach((version) => {
                it(`should throw an error if invoked without a valid version (value=${typeof version})`, () => {
                    const definition = _createProjectDefinition({ version });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*version.*\]/;

                    expect(wrapper).to.throw(error);
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

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('bad-type').forEach((type) => {
                it(`should throw an error if invoked without a valid buildMetadata.type (value=${typeof type})`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.type': type,
                    });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*type.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('bad-language').forEach((language) => {
                it(`should throw an error if invoked without a valid buildMetadata.language (value=${typeof language})`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.language': language,
                    });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*language.*\]/;

                    expect(wrapper).to.throw(error);
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

                    expect(wrapper).to.throw(error);
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

                    expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
                    });
                });

                getAllButObject().forEach((stacks) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws.stacks (value=${typeof stacks})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.aws.stacks': stacks,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*stacks.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                it(`should throw an error if invoked without at least one stack`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.aws': { stacks: {} },
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No AWS stacks defined/;

                    expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
                    });
                });

                it('should throw an error if unsupported additional parameters are specified', () => {
                    const definition = _createProjectDefinition();
                    definition.buildMetadata.aws.foo = 'bar';
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*additional properties.*\]/;

                    expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
                    });
                });

                it(`should throw an error if invoked without at least one build configuration`, () => {
                    const definition = _createProjectDefinition({
                        'buildMetadata.container': {},
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No container builds defined/;

                    expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
                    });
                });

                getAllButString('').forEach((repo) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.myBuild.repo (value=${typeof repo})`, () => {
                        const definition = _createProjectDefinition({
                            'buildMetadata.container.myBuild.repo': repo,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*repo.*\]/;

                        expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
                    });
                });

                it('should throw an error if unsupported additional parameters are specified', () => {
                    const definition = _createProjectDefinition();
                    definition.buildMetadata.container.myBuild.foo = 'bar';
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*additional properties.*\]/;

                    expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
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

                        expect(wrapper).to.throw(error);
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
        ].forEach(([property, inputValue, expectedValue]) => {
            it(`should set the property [${property}]  based on data in the project definition`, () => {
                expectedValue = expectedValue || inputValue;
                const definition = _createProjectDefinition({
                    [property]: inputValue,
                });
                const project = new Project(definition);
                const projectProp = property.split('.').pop();

                expect(project[projectProp]).to.equal(expectedValue);
            });
        });

        describe('[unscopedName]', () => {
            [
                ['bar-project', 'bar-project'],
                ['@foo/bar-project', 'bar-project'],
            ].forEach(([name, unscopedName]) => {
                it(`should return the name of the project without scope (name=${name})`, () => {
                    const definition = _createProjectDefinition({
                        name: name,
                    });
                    const project = new Project(definition);

                    expect(project.unscopedName).to.equal(unscopedName);
                });
            });
        });

        describe('[kebabCasedName]', () => {
            [
                ['bar-project', 'bar-project'],
                ['@foo/bar-project', 'foo-bar-project'],
            ].forEach(([name, kebabCasedName]) => {
                it(`should return the name of the project in kebab case (name=${name})`, () => {
                    const definition = _createProjectDefinition({
                        name: name,
                    });
                    const project = new Project(definition);

                    expect(project.kebabCasedName).to.equal(kebabCasedName);
                });
            });
        });

        describe('[configFileName]', () => {
            [
                ['bar-project', '.barProjectrc'],
                ['@foo/bar-project', '.barProjectrc'],
            ].forEach(([name, configFileName]) => {
                it(`should return the name of the project without scope (name=${name})`, () => {
                    const definition = _createProjectDefinition({
                        name: name,
                    });
                    const project = new Project(definition);

                    expect(project.configFileName).to.equal(configFileName);
                });
            });
        });
    });

    describe('getStaticFilePatterns()', () => {
        it('should return an empty array if the definition does not contain static file patterns', () => {
            const definition = _createProjectDefinition({
                'buildMetadata.staticFilePatterns': undefined,
            });
            const project = new Project(definition);

            expect(project.getStaticFilePatterns()).to.deep.equal([]);
        });

        it('should return the values specified in the project definition', () => {
            const values = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.staticFilePatterns': values,
            });
            const project = new Project(definition);

            expect(project.getStaticFilePatterns()).to.deep.equal(values);
        });

        it('should return a copy of the values, not a reference', () => {
            const values = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.staticFilePatterns': values,
            });
            const project = new Project(definition);

            const oldValues = project.getStaticFilePatterns();
            oldValues.pop();

            const newValues = project.getStaticFilePatterns();
            expect(newValues).not.to.equal(oldValues);
        });
    });

    describe('getRequiredEnv()', () => {
        it('should return an empty array if the definition does not contain required environment variables', () => {
            const definition = _createProjectDefinition({
                'buildMetadata.requiredEnv': undefined,
            });
            const project = new Project(definition);

            expect(project.getRequiredEnv()).to.deep.equal([]);
        });

        it('should return the values specified in the project definition', () => {
            const values = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.requiredEnv': values,
            });
            const project = new Project(definition);

            expect(project.getRequiredEnv()).to.deep.equal(values);
        });

        it('should return a copy of the values, not a reference', () => {
            const values = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.requiredEnv': values,
            });
            const project = new Project(definition);

            const oldValues = project.getRequiredEnv();
            oldValues.pop();

            const newValues = project.getRequiredEnv();
            expect(newValues).not.to.equal(oldValues);
        });
    });

    describe('getCdkTargets()', () => {
        it('should return an empty array if the definition does not contain an aws definition', () => {
            const definition = _createProjectDefinition({
                'buildMetadata.aws': undefined,
            });
            const project = new Project(definition);

            expect(project.getCdkTargets()).to.deep.equal([]);
        });

        it('should return the stack keys specified in the project definition', () => {
            const targets = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.aws.stacks': targets.reduce((result, key) => {
                    result[key] = `${key}-stack`;
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            expect(project.getCdkTargets()).to.deep.equal(targets);
        });

        it('should return a copy of the values, not a reference', () => {
            const targets = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.aws.stacks': targets.reduce((result, key) => {
                    result[key] = `${key}-stack`;
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            const oldValues = project.getCdkTargets();
            oldValues.pop();

            const newValues = project.getCdkTargets();
            expect(newValues).not.to.equal(oldValues);
        });
    });

    describe('getCdkStackDefinition()', () => {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${typeof target})`, () => {
                const definition = _createProjectDefinition();
                const project = new Project(definition);
                const wrapper = () => project.getCdkStackDefinition(target);
                const error = 'Invalid CDK target (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if the CDK target has not been defined', () => {
            const targets = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.aws.stacks': targets.reduce((result, key) => {
                    result[key] = `${key}-stack`;
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            const target = 'bad-target';
            const wrapper = () => project.getCdkStackDefinition(target);
            const error = `CDK target has not been defined (${target})`;

            expect(wrapper).to.throw(error);
        });

        it('should return stack details if the CDK target has been defined', () => {
            const targets = ['foo', 'bar'];
            const stacks = targets.reduce((result, key) => {
                result[key] = `${key}-stack`;
                return result;
            }, {});
            const definition = _createProjectDefinition({
                'buildMetadata.aws.stacks': stacks,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const stack = project.getCdkStackDefinition(target);
                expect(stack).to.deep.equal({ name: stacks[target] });
            });
        });

        it('should return a copy of the definition and not a reference', () => {
            const targets = ['foo', 'bar'];
            const stacks = targets.reduce((result, key) => {
                result[key] = `${key}-stack`;
                return result;
            }, {});
            const definition = _createProjectDefinition({
                'buildMetadata.aws.stacks': stacks,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const oldValue = project.getCdkStackDefinition(target);
                expect(oldValue).to.deep.equal({ name: stacks[target] });

                oldValue.foo = 'bar';

                const newValue = project.getCdkStackDefinition(target);
                expect(newValue).not.to.equal(oldValue);
            });
        });
    });

    describe('getContainerTargets()', () => {
        it('should return an empty array if the definition does not contain an aws definition', () => {
            const definition = _createProjectDefinition({
                'buildMetadata.container': undefined,
            });
            const project = new Project(definition);

            expect(project.getContainerTargets()).to.deep.equal([]);
        });

        it('should return the stack keys specified in the project definition', () => {
            const targets = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.container': targets.reduce((result, key) => {
                    result[key] = {
                        repo: key,
                        buildFile: 'BuildFile-1',
                        buildArgs: {
                            arg1: 'value1',
                        },
                    };
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            expect(project.getContainerTargets()).to.deep.equal(targets);
        });

        it('should return a copy of the values, not a reference', () => {
            const targets = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.container': targets.reduce((result, key) => {
                    result[key] = {
                        repo: key,
                        buildFile: 'BuildFile-1',
                        buildArgs: {
                            arg1: 'value1',
                        },
                    };
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            const oldValues = project.getContainerTargets();
            oldValues.pop();

            const newValues = project.getContainerTargets();
            expect(newValues).not.to.equal(oldValues);
        });
    });

    describe('getContainerDefinition()', () => {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${typeof target})`, () => {
                const definition = _createProjectDefinition();
                const project = new Project(definition);
                const wrapper = () => project.getContainerDefinition(target);
                const error = 'Invalid container target (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if the container target has not been defined', () => {
            const targets = ['foo', 'bar'];
            const definition = _createProjectDefinition({
                'buildMetadata.container': targets.reduce((result, key) => {
                    result[key] = {
                        repo: 'my-repo',
                        buildFile: 'BuildFile-1',
                        buildArgs: {
                            arg1: 'value1',
                        },
                    };
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            const target = 'bad-target';
            const wrapper = () => project.getContainerDefinition(target);
            const error = `Container target has not been defined (${target})`;

            expect(wrapper).to.throw(error);
        });

        it('should return container details if the container target has been defined', () => {
            const targets = ['foo', 'bar'];
            const containers = targets.reduce((result, key) => {
                result[key] = {
                    repo: 'my-repo',
                    buildFile: 'BuildFile-1',
                    buildArgs: {
                        arg1: 'value1',
                    },
                };
                return result;
            }, {});
            const definition = _createProjectDefinition({
                'buildMetadata.container': containers,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const container = project.getContainerDefinition(target);
                expect(container).to.deep.equal(
                    Object.assign({ name: target }, containers[target])
                );
            });
        });

        it('should return a copy of the definition and not a reference', () => {
            const targets = ['foo', 'bar'];
            const containers = targets.reduce((result, key) => {
                result[key] = {
                    repo: 'my-repo',
                    buildFile: 'BuildFile-1',
                    buildArgs: {
                        arg1: 'value1',
                    },
                };
                return result;
            }, {});
            const definition = _createProjectDefinition({
                'buildMetadata.container': containers,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const oldValue = project.getContainerDefinition(target);
                expect(oldValue).to.deep.equal(
                    Object.assign({ name: target }, containers[target])
                );

                oldValue.foo = 'bar';

                const newValue = project.getContainerDefinition(target);
                expect(newValue).not.to.equal(oldValue);
            });
        });
    });
});
