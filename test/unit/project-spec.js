'use strict';

// const _sinon = require('sinon');
const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));

const expect = _chai.expect;
// const _path = require('path');
// const _process = require('process');
const _rewire = require('rewire');

let Project = null;

describe('[Project]', () => {
    beforeEach(() => {
        Project = _rewire('../../src/project');
    });

    describe('ctor()', () => {
        it('should throw an error if invoked without a valid package config', () => {
            const error = 'Invalid packageConfig (arg #1)';
            const inputs = [null, undefined, 123, true, 'test', [], () => {}];

            inputs.forEach((tree) => {
                const wrapper = () => new Project();
                expect(wrapper).to.throw(error);
            });
        });
    });
});
