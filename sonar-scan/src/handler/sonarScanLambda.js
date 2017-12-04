const DownloadService = require('../service/downloadService');
const UnzipService = require('../service/unzipService');
const SonarScanService = require('../service/sonarScanService');

const read = require('fs-readdir-recursive');
const AWS = require('aws-sdk');
const os = require('os');

const validateEvent = (event, callback) => {

    if (event === null){
        return callback(new Error('event can not be null'));
    }
    if (event === undefined){
        return callback(new Error('event can not be undefined'));
    }
    if (!event.hasOwnProperty("CodePipeline.job")) {
        return callback(new Error('Trigger event must be a code pipeline event'));
    }
    callback();
};

const handleScan = (event, callback) => {
    "use strict";
    console.log("set up download");

    DownloadService(event)
        .download()
        .then((values)=>{
            const tmpPath = os.tmpdir();
            try{
                UnzipService(tmpPath)
                    .unzip(values)
                    .then((path_for_artifact)=>{
                        console.log("event = %j", event);
                        console.log(read(tmpPath));
                        //todo run the scan
                        SonarScanService(path_for_artifact[0]).scan((err)=>{
                            if (err) {
                                return callback(err, null);
                            }
                            return callback(null, "performed scan");
                        });
                    }, (err)=>{
                        return callback(err, null);
                    });
            } catch (err) {
                return callback(err, null);
            }
        }, (err)=>{
            return callback(err, null);
        });
};

exports.handler = function(event, context, callback) {
    let codepipeline = new AWS.CodePipeline();

    const putJobSuccess = function(jobId, message) {
        console.log("put success: " + jobId + " : " + message);
        const params = {
            jobId: jobId
        };
        codepipeline.putJobSuccessResult(params, function(err, data) {
            if(err) {
                return callback(err, null);
            } else {
                return callback(null, message);
            }
        });
    };

    const putJobFailure = function(jobId, message) {
        console.log("put failure: " + jobId + " : " + message);
        const params = {
            jobId: jobId,
            failureDetails: {
                message: JSON.stringify(message),
                type: 'JobFailed',
                externalExecutionId: context.invokeid
            }
        };
        codepipeline.putJobFailureResult(params, function(err, data) {
            return callback(message, null);
        });
    };


    validateEvent(event, (err)=>{
        "use strict";
        if (err){
            return callback(err, null);
        }
        let jobId = event["CodePipeline.job"].id;
        try {

            handleScan(event, (err, data) => {
                console.log("handle scan finished:");
                if (err) {
                    return putJobFailure(jobId, err);
                }
                return putJobSuccess(jobId, data);
            });
        } catch (err) {
            return putJobFailure(jobId, err);
        }
    });
};
