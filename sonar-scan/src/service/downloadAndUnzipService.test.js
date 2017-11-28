"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;


describe('download and unzip service', () => {
    const event = {
        "CodePipeline.job": {
            "data": {
                "inputArtifacts": [
                    {
                        "location": {
                            "s3Location": {
                                "bucketName": "gsd-922-spot-forecast-object-service-pipeline-artifacts",
                                "objectKey": "gsd-922-spot-forecas/ListObject/KoVcaKI"
                            },
                            "type": "S3"
                        },
                        "revision": null,
                        "name": "ListObjectBuild"
                    },
                    {
                        "location": {
                            "s3Location": {
                                "bucketName": "gsd-922-spot-forecast-object-service-pipeline-artifacts",
                                "objectKey": "gsd-922-spot-forecas/Source/zjDg40y.zip"
                            },
                            "type": "S3"
                        },
                        "revision": "7f298e55f77d6a693bfc08c15660fd3f71e9b013",
                        "name": "Source"
                    }
                ],
                "artifactCredentials": {
                    "secretAccessKey": "secret key",
                    "sessionToken": "session token",
                    "accessKeyId": "access id"
                }
            }
        }
    };

    const lambdaFileServiceApi = {
        clean: ()=>{},
        extract: (artifact_name)=>{}
    };


    let awsApi;

    const awsS3Api = {
        getObject: (params, callback)=>{}
    };

    let mockFsService;
    let mockS3Api;

    let awsConfig = {
        s3: undefined
    };

    let downloadAndUnzipService;

    beforeEach(()=>{
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        mockFsService = sinon.mock(lambdaFileServiceApi);
        mockery.registerMock('./lambdaFileService', ()=>{
            return lambdaFileServiceApi;
        });

        awsApi = {
            S3: sinon.stub().returns(awsS3Api),
            config: awsConfig
        };

        mockS3Api = sinon.mock(awsS3Api);
        mockery.registerMock('aws-sdk', awsApi);

        downloadAndUnzipService = require('./downloadAndUnzipService');
    });

    describe('#construction', ()=>{
        describe('with valid event',()=>{


            it('cleans up path directory',()=>{
                mockFsService.expects('clean').once();
                downloadAndUnzipService(event, 'testPath');
                mockFsService.verify();
            });

            it('sets the aws s3 config', ()=>{
                downloadAndUnzipService(event, 'testPath');
                expect(awsConfig.s3).to.deep.equal({
                    params:{
                        secretAccessKey: "secret key",
                        sessionToken: "session token",
                        accessKeyId: "access id",
                        signatureVersion: 's3v4'
                    }
                })
            });
        });
    });
    describe('#downloadAndUnzip',()=>{
        describe('error paths', () =>{
            const EventEmitter = require('events');
            let service;

            beforeEach(()=>{
                service = downloadAndUnzipService(event, 'testPath');
            });
            it('should return an error if getObject fails',(done)=>{
                mockS3Api.expects('getObject')
                    .twice()
                    .onFirstCall().yields(new Error("s3 get failed"))
                    .onSecondCall().yields(undefined, {Body: undefined});

                service.downloadAndUnzip().then(
                    (result)=>{
                        mockS3Api.verify();
                        done(new Error("should fail"));
                    },
                    (err)=>{
                        expect(err).to.be.an('error');
                        mockS3Api.verify();
                        done();
                    }
                );
                mockS3Api.verify();
            });
            it('should return an error if lambdaService extract fails', (done)=>{
                mockS3Api.expects('getObject')
                    .twice()
                    .yields(undefined, {Body: "hello world"});

                const emitter = new EventEmitter();

                mockFsService.expects('extract').twice().returns(emitter);
                service.downloadAndUnzip().then(
                    (result)=>{
                        mockS3Api.verify();
                        mockFsService.verify();
                        done(new Error("should fail"));
                    },
                    (err)=>{
                        expect(err).to.be.an('error');
                        expect(err.message).to.equal("failed write");
                        mockS3Api.verify();
                        mockFsService.verify();
                        done();
                    }
                );
                emitter.emit("error", new Error("failed write"));
            });
            it('should return an error if first download succeeds and second download fails',()=>{

            });
        });
        it('should extract the downloaded data',()=>{

        });
    })
});
