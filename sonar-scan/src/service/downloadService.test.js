"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;


describe('download service', () => {
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


    let awsApi;

    const awsS3Api = {
        getObject: (params, callback)=>{}
    };

    let mockS3Api;

    let awsConfig = {
        s3: undefined
    };

    let downloadService;

    beforeEach(()=>{
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        awsApi = {
            S3: sinon.stub().returns(awsS3Api),
            config: awsConfig
        };

        mockS3Api = sinon.mock(awsS3Api);
        mockery.registerMock('aws-sdk', awsApi);

        downloadService = require('./downloadService');
    });

    afterEach(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('#construction', ()=>{
        describe('with valid event',()=>{

            it('sets the aws s3 config', ()=>{
                downloadService(event);
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
    describe('#download',()=>{
        let service;

        beforeEach(()=>{
            service = downloadService(event);
        });
        describe('error paths', () =>{
            // const EventEmitter = require('events');

            it('should return an error if getObject fails',(done)=>{
                mockS3Api.expects('getObject')
                    .twice()
                    .onFirstCall().yields(new Error("s3 get failed"))
                    .onSecondCall().yields(undefined, {Body: undefined});

                service.download().then(
                    ()=>{
                        mockS3Api.verify();
                        done(new Error("should not be called"));
                    },
                    (err)=>{
                        expect(err).to.be.an('error');
                        mockS3Api.verify();
                        done();
                    }
                );
            });
            // it('should return an error if lambdaService extract fails', (done)=>{
            //     mockS3Api.expects('getObject')
            //         .twice()
            //         .yields(undefined, {Body: "hello world"});
            //
            //     const emitter = new EventEmitter();
            //
            //     mockFsService.expects('extract').twice().returns(emitter);
            //     service.downloadAndUnzip().then(
            //         (result)=>{
            //             mockS3Api.verify();
            //             mockFsService.verify();
            //             done(new Error("should fail"));
            //         },
            //         (err)=>{
            //             expect(err).to.be.an('error');
            //             expect(err.message).to.equal("failed write");
            //             mockS3Api.verify();
            //             mockFsService.verify();
            //             done();
            //         }
            //     );
            //     emitter.emit("error", new Error("failed write"));
            // });
            it('should return an error if first download succeeds and second download fails',(done)=>{
                mockS3Api.expects('getObject')
                    .twice()
                    .onFirstCall().yields(undefined, {Body: undefined})
                    .onSecondCall().yields(new Error("s3 get failed"));

                service.download().then(
                    (result)=>{
                        mockS3Api.verify();
                        done(new Error("should not be called"));
                    },
                    (err)=>{
                        expect(err).to.be.an('error');
                        mockS3Api.verify();
                        done();
                    }
                );
            });
        });
        it('should return the download data stream',(done)=>{
            mockS3Api.expects('getObject')
                .twice()
                .onFirstCall().yields(undefined, {Body: "firstCall"})
                .onSecondCall().yields(undefined, {Body: "secondCall"});

            service.download().then(
                (result)=>{
                    expect(result).to.deep.include({name:"ListObjectBuild", data: "firstCall"});
                    expect(result).to.deep.include({name:"Source", data: "secondCall"});
                    mockS3Api.verify();
                    done();
                },
                (err)=>{
                    mockS3Api.verify();
                    done(new Error("should not be called"));
                }
            );
        });
    })
});
