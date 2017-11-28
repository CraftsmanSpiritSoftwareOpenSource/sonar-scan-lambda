const AWS = require('aws-sdk');


const LambdaFileService = require('./lambdaFileService');

module.exports = (event, path)=>{
    "use strict";

    console.log("clean up path: " + path);
    const lambdaFileService = LambdaFileService(path);
    lambdaFileService.clean();

    console.log("setting up downloads");
    const inputArtifacts = event["CodePipeline.job"].data.inputArtifacts;
    const artifactCredentials = event["CodePipeline.job"].data.artifactCredentials;
    AWS.config.s3 = {
        params:{
            secretAccessKey: artifactCredentials.secretAccessKey,
            sessionToken: artifactCredentials.sessionToken,
            accessKeyId: artifactCredentials.accessKeyId,
            signatureVersion: 's3v4'
        }
    };
    const s3 = new AWS.S3();
    return {
        downloadAndUnzip(){
            let downloads = inputArtifacts.map((artifact)=>{
                return new Promise((resolve, reject)=>{
                    console.log("downloading " +  artifact.name);

                    let params = {
                        Bucket: artifact.location.s3Location.bucketName,
                        Key: artifact.location.s3Location.objectKey
                    };

                    s3.getObject(params, function(err, data){

                        if (err) {
                           console.error(err.code, "-", err.message);
                           return reject(err);
                        }

                        lambdaFileService.extract(artifact.name, data)
                            .on('error', (err)=>{
                                console.log("error downloading " +  artifact.name);
                                reject(err);
                            })
                            .on('close', ()=>{
                                console.log("finished downloading " +  artifact.name);
                                resolve();
                            });
                   });
                });
            });
            return Promise.all(downloads);
        }
    }
};
