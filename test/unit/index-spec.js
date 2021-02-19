'use strict';

const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));

const expect = _chai.expect;
const _rewire = require('rewire');

const Directory = require('../../src/directory');
let _index = null;

describe('[index]', () => {
    beforeEach(function () {
        this.timeout(10000);
        _index = _rewire('../../src/index');
    });

    it('should expose the expected properties', () => {
        expect(_index.Directory).to.equal(Directory);
    });
});
