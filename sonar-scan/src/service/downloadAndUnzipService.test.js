"use strict";
const mockery = require('mockery');
const sinon = require('sinon');
const chai = require('chai'), expect = chai.expect;


describe('download and unzip service', () => {
    describe('#construction', ()=>{

        const fsApi = {
            readdirSync: ()=>{}
        };

        let mockFs;

        let downloadAndUnzipService;

        beforeEach(()=>{
            mockery.enable({
                warnOnReplace: true,
                warnOnUnregistered: false,
                useCleanCache: true
            });

            mockFs = sinon.mock(fsApi);
            mockery.registerMock('fs', fsApi);

            downloadAndUnzipService = require('./downloadAndUnzipService');
        });

        describe('with valid event',()=>{
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

            it('cleans up path directory',()=>{
                //todo check recursion and other branches
                mockFs.expects('readdirSync').once().returns([]);
                downloadAndUnzipService(event, 'testPath');
                mockFs.verify();
            });
        });

    });
});
