"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;

describe('unzip service', ()=>{
    const lambdaFileServiceApi = {
        clean: ()=>{},
    };

    let mockFsService;

    let unzipService;
    beforeEach(()=>{
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        mockFsService = sinon.mock(lambdaFileServiceApi);
        mockery.registerMock('./lambdaFileService', ()=>{
            return lambdaFileServiceApi;
        });

        unzipService = require('./unzipService');
    });

    afterEach(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('#construction', ()=>{
        it('cleans up path directory',()=>{
            mockFsService.expects('clean').once();
            unzipService('testPath');
            mockFsService.verify();
        });
    });
});
