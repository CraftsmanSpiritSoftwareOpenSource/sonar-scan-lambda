"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;

describe('unzip service', ()=>{
    const lambdaFileServiceApi = {
        clean: ()=>{},
        createPathForArtifact: (artifact_name)=>{}
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

    describe('#unzip',()=>{
        let serviceInstance;
        beforeEach(()=>{
            serviceInstance = unzipService('testPath');
        });
        describe('error paths', ()=>{
            it('should return an error if createPathForArtifact throws an exception', (done)=>{
                mockFsService.expects('createPathForArtifact').once().throws(new Error('create path error'));
                serviceInstance.unzip([{name: "test", data: undefined}])
                    .then(()=>{
                        done(new Error('should not be called'))
                    }, (err)=>{
                        expect(err).to.be.an('error');
                        expect(err.message).to.equal('create path error');
                        mockFsService.verify();
                        done();
                    });
            });
       });
    });
});
