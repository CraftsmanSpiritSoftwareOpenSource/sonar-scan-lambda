const LambdaFileService = require('./lambdaFileService');
const unzip = require('unzip');
const BufferedStream = require('bufferedstream');

module.exports = (path)=> {
    "use strict";
    console.log("clean up path: " + path);
    const lambdaFileService = LambdaFileService(path);
    lambdaFileService.clean();

    return {
        unzip(values){
            const archives = values.map((archive)=> {
                return new Promise((resolve, reject) => {
                    const path_for_artifact = lambdaFileService.createPathForArtifact(archive.name);
                    new BufferedStream(archive.data)
                        .pipe(unzip.Extract({path: path_for_artifact}))
                        .on('error', (err) => {
                            console.log("error unzipping " + archive.name);
                            reject(err);
                        })
                        .on('close', () => {
                            console.log("finished downloading " + archive.name);
                            resolve();
                        });
                });
            });
            return Promise.all(archives);
        }
    };
};
