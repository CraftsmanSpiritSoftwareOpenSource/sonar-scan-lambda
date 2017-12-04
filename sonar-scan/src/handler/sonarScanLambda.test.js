"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;
const os = require('os');


describe('sonar-scan event handler', () => {

    describe("input event errors", () => {
        let eventHandler;

        beforeEach(() => {
            eventHandler = require('./sonarScanLambda');
        });


        it("will set error on callback if json event is not correct", () => {

            eventHandler.handler(
                {"blah": "blah blah"},
                undefined,
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('Trigger event must be a code pipeline event');
                    expect(data).to.be.a('null');
                }
            );
        });

        it("will set error on callback if event is null", () => {
            eventHandler.handler(
                null,
                undefined,
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('event can not be null');
                    expect(data).to.be.a('null');
                }
            );
        });

        it("will set error on callback if event is undefined", () => {
            eventHandler.handler(
                undefined,
                undefined,
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('event can not be undefined');
                    expect(data).to.be.a('null');
                }
            );
        });

    });

    describe('services', ()=>{
        const pipelineApi = {
            putJobFailureResult: (param,callback)=>{},
            putJobSuccessResult: (param,callback)=>{}
        };
        const downloadServiceApi = {
            download: () => {}
        };
        const unzipServiceApi = {
            unzip: ()=>{}
        };
        const event = {
            "CodePipeline.job": {
                "id": "10a89910-ef83-473e-a3af-5b232b91fddb"
            }
        };

        let stubDownloadServiceConstructor;
        let mockDownloadService;
        let stubUnzipServiceConstructor;
        let mockUnzipService;
        let stubAwsCodePipelineConstructor;
        let mockAwsCodePipelineSdk;
        let eventHandler;

        beforeEach(() => {
            mockery.enable({
                warnOnReplace: true,
                warnOnUnregistered: false,
                useCleanCache: true
            });

            mockDownloadService = sinon.mock(downloadServiceApi);
            stubDownloadServiceConstructor = sinon.stub();
            mockery.registerMock('../service/downloadService',stubDownloadServiceConstructor);

            mockAwsCodePipelineSdk = sinon.mock(pipelineApi);
            stubAwsCodePipelineConstructor = sinon.stub();
            mockery.registerMock('aws-sdk',{
                CodePipeline: stubAwsCodePipelineConstructor
            });

            mockUnzipService = sinon.mock(unzipServiceApi);
            stubUnzipServiceConstructor = sinon.stub();
            mockery.registerMock('../service/unzipService',stubUnzipServiceConstructor);

            eventHandler = require('./sonarScanLambda');
        });

        afterEach(() => {
            mockery.deregisterAll();
            mockery.disable();
        });

        describe('download', () => {
            describe('errors', ()=>{
                it('will report an error when service construction fails', (done) => {

                    stubDownloadServiceConstructor.withArgs(event).throws(new Error('Service construction error'));
                    stubAwsCodePipelineConstructor.returns(pipelineApi);
                    mockAwsCodePipelineSdk.expects('putJobFailureResult').once().yields(undefined);

                    eventHandler.handler(
                        event,
                        sinon.stub(),
                        (err, data)=>{
                            expect(err).to.be.an('error');
                            expect(err.message).to.equal('Service construction error');
                            expect(data).to.be.a('null');
                            mockAwsCodePipelineSdk.verify();
                            done();
                        }
                    );
                });

                it('will report an error when download process fails', (done) =>{

                    stubDownloadServiceConstructor.withArgs(event).returns(downloadServiceApi);
                    stubAwsCodePipelineConstructor.returns(pipelineApi);
                    //make this a stub?
                    mockDownloadService.expects('download').once().returns(
                        new Promise((resolve, reject)=>{
                            return reject(new Error('download error'))
                        })
                    );
                    mockAwsCodePipelineSdk.expects('putJobFailureResult').once().yields(undefined);

                    eventHandler.handler(
                        event,
                        sinon.stub(),
                        (err, data)=>{
                            expect(err).to.be.an('error');
                            expect(err.message).to.equal('download error');
                            expect(data).to.be.a('null');
                            mockDownloadService.verify();
                            mockAwsCodePipelineSdk.verify();
                            done();
                        }
                    );
                });
            });
        });

        describe('unzip',()=>{
            beforeEach(()=>{
                stubDownloadServiceConstructor.withArgs(event).returns(downloadServiceApi);
                stubAwsCodePipelineConstructor.returns(pipelineApi);
                //make this a stub?
                mockDownloadService.expects('download').once().returns(
                    new Promise((resolve)=>{
                        return resolve([{name: "testArtifact", data: "test content"}]);
                    })
                );
                mockAwsCodePipelineSdk.expects('putJobFailureResult').once().yields(undefined);
            });

            afterEach(()=>{
                mockAwsCodePipelineSdk.verify();
                mockDownloadService.verify();
            });
            describe('errors',()=>{
                it('will report an error when service construction fails', (done) => {
                    stubUnzipServiceConstructor.withArgs(os.tmpdir()).throws(new Error('Service construction error'));
                    eventHandler.handler(
                        event,
                        sinon.stub(),
                        (err, data)=>{
                            expect(err).to.be.an('error');
                            expect(err.message).to.equal('Service construction error');
                            expect(data).to.be.a('null');
                            done();
                        }
                    );
                });

                it('will report an error when the unzip process fails', ()=>{
                    stubUnzipServiceConstructor.withArgs(os.tmpdir()).returns(unzipServiceApi);
                    mockUnzipService.expects('unzip').once().withArgs([{name: "testArtifact", data: "test content"}]).returns(
                        new Promise((resolve, reject)=>{
                            return reject(new Error('unzip error'));
                        })
                    );
                    eventHandler.handler(
                        event,
                        sinon.stub(),
                        (err, data)=>{
                            expect(err).to.be.an('error');
                            expect(err.message).to.equal('unzip error');
                            expect(data).to.be.a('null');
                            mockUnzipService.verify();
                            done();
                        }
                    );
                });
            });
        });
        describe('success',()=>{
            beforeEach(()=>{
                stubDownloadServiceConstructor.withArgs(event).returns(downloadServiceApi);
                stubAwsCodePipelineConstructor.returns(pipelineApi);
                //make this a stub?
                mockDownloadService.expects('download').once().returns(
                    new Promise((resolve)=>{
                        return resolve([{name: "testArtifact", data: "test content"}]);
                    })
                );
                stubUnzipServiceConstructor.withArgs(os.tmpdir()).returns(unzipServiceApi);
                mockUnzipService.expects('unzip').once().withArgs([{name: "testArtifact", data: "test content"}]).returns(
                    new Promise((resolve)=>{
                        return resolve("testPath/testArtifact");
                    })
                );
            });
            afterEach(()=>{

                mockDownloadService.verify();
                mockUnzipService.verify();
            });
            it('should report failure if put success fails',()=>{
                mockAwsCodePipelineSdk.expects('putJobSuccessResult').once().yields(new Error('put success failed'));
                eventHandler.handler(
                    event,
                    sinon.stub(),
                    (err, data)=>{
                        expect(err).to.be.an('error');
                        expect(err.message).to.equal('put success failed');
                        expect(data).to.be.a('null');
                        mockAwsCodePipelineSdk.verify();
                        done();
                    }
                );
            });
            it('should report success',(done)=>{

                mockAwsCodePipelineSdk.expects('putJobSuccessResult').once().yields(undefined);
                eventHandler.handler(
                    event,
                    sinon.stub(),
                    (err, data)=>{
                        expect(err).to.be.a('null');
                        expect(data).to.equal('logged the event');
                        mockAwsCodePipelineSdk.verify();
                        done();
                    }
                );
            });
        });
    });
});