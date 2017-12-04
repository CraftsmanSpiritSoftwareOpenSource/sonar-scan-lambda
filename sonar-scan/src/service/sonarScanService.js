"use strict";
const exec = require('child_process').execSync;

module.exports = (path)=>{
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
    process.env['SONAR_USER_HOME']=path + '/.sonar';
    console.log(path);
    return {
        scan(callback){
            try {
                console.log("scanning? " + path);

                exec("sonar-scanner-dist/bin/sonar-scanner", [], {
                    cwd: path,
                    stdio:[0,1,2]
                });
                console.log("scan done?");
                callback();
            } catch (err){
                callback(err);
            }
        }
    };
};
