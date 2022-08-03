'use strict';

import _chai from 'chai';
import _sinonChai from 'sinon-chai';
import _chaiAsPromised from 'chai-as-promised';
_chai.use(_sinonChai);
_chai.use(_chaiAsPromised);

const expect = _chai.expect;

import { Directory } from '../../src/directory.js';
import { Directory as ExportedDirectory } from '../../src/index.js';

describe('[index]', () => {
    it('should expose the expected properties', () => {
        expect(ExportedDirectory).to.equal(Directory);
    });
});
