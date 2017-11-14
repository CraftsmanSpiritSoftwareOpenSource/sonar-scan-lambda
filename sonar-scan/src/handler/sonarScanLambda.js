const DownloadAndUnzipService = require('../service/downloadAndUnzipService');

const read = require('fs-readdir-recursive');
const AWS = require('aws-sdk');

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
    const downloadService = DownloadAndUnzipService(event,'/tmp');
    downloadService
        .downloadAndUnzip()
        .then(()=>{
            console.log("event = %j", event);
            console.log(read('/tmp'));
            return callback(null, "logged the event");
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

    try {
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

    } catch (err) {
        console.error(err);
        return callback(err, null);
    }
};
