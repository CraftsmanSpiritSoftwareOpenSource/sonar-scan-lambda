"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;


describe('sonar-scan event handler', () => {

    describe("should should throw an error if the event is not a code pipeline event", () => {
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

    describe('should report job failure if download service fails', () => {
        let pipelineApi = {
            putJobFailureResult: (param,callback)=>{}
        };
        let downloadServiceApi = {
            downloadAndUnzip: () => {}
        };
        let stubServiceConstructor;
        let mockDownloadAndUnzipService;
        let stubAwsCodePipelineConstructor;
        let mockAwsCodePipelineSdk;
        let eventHandler;

        beforeEach(() => {
            mockery.enable({
                warnOnReplace: true,
                warnOnUnregistered: false,
                useCleanCache: true
            });

            mockDownloadAndUnzipService = sinon.mock(downloadServiceApi);
            stubServiceConstructor = sinon.stub();

            mockAwsCodePipelineSdk = sinon.mock(pipelineApi);
            stubAwsCodePipelineConstructor = sinon.stub();

            mockery.registerMock('../service/downloadAndUnzipService',stubServiceConstructor);
            mockery.registerMock('aws-sdk',{
                CodePipeline: stubAwsCodePipelineConstructor
            });
            eventHandler = require('./sonarScanLambda');
        });

        afterEach(() => {
            mockery.deregisterAll();
            mockery.disable();
        });

        it('will report an error when download and zip service construction fails', (done) => {
            let event = {
                "CodePipeline.job": {
                    "id": "10a89910-ef83-473e-a3af-5b232b91fddb"
                }
            };

            stubServiceConstructor.withArgs(event).throws(new Error('Service construction error'));
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

        it('will report an error when download or unzip process fails', (done) =>{
            let event = {
                "CodePipeline.job": {
                    "id": "10a89910-ef83-473e-a3af-5b232b91fddb"
                }
            };

            stubServiceConstructor.withArgs(event).returns(downloadServiceApi);
            stubAwsCodePipelineConstructor.returns(pipelineApi);
            //make this a stub?
            mockDownloadAndUnzipService.expects('downloadAndUnzip').once().returns(
                new Promise((resolve, reject)=>{
                    return reject(new Error('download or unzip error'))
                })
            );
            mockAwsCodePipelineSdk.expects('putJobFailureResult').once().yields(undefined);

            eventHandler.handler(
                event,
                sinon.stub(),
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('download or unzip error');
                    expect(data).to.be.a('null');
                    mockDownloadAndUnzipService.verify();
                    mockAwsCodePipelineSdk.verify();
                    done();
                }
            );
        });
    });

    describe('should report error if sonar scan service fails',()=>{

    })
});