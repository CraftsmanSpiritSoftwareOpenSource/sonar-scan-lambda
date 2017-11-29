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

    const unzipApi = {
        Extract: ()=>{}
    };

    let mockUnzip;

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

        mockUnzip = sinon.mock(unzipApi);
        mockery.registerMock('unzip', unzipApi);

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
            it('should return an error if there is a write stream error', (done)=>{
                const EventEmitter = require('events');
                const emitter = new EventEmitter();

                mockFsService.expects('createPathForArtifact').once().returns("testPath/test");

                mockUnzip.expects('Extract').withArgs({path: "testPath/test"}).returns(emitter);

                serviceInstance.unzip([{name: "test", data: "string"}])
                    .then(()=>{
                        done(new Error('should not be called'))
                    }, (err)=>{
                        expect(err).to.be.an('error');
                        expect(err.message).to.equal('write stream error');
                        mockUnzip.verify();
                        mockFsService.verify();
                        done();
                    });
                emitter.emit('error', new Error('write stream error'));
            });
        });
        it('should report success if unzip succeeds', (done)=>{
            const EventEmitter = require('events');
            const emitter = new EventEmitter();

            mockFsService.expects('createPathForArtifact').once().returns("testPath/test");
            mockUnzip.expects('Extract').withArgs({path: "testPath/test"}).returns(emitter);

            serviceInstance.unzip([{name: "test", data: "string"}])
                .then(()=>{
                    mockUnzip.verify();
                    mockFsService.verify();
                    done();
                }, (err)=>{
                    console.error(err);
                    done(new Error('should not be called'))
                });
            emitter.emit('close', 'success');
        })
    });
});
