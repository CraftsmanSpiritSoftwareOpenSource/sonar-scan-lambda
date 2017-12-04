const fs = require('fs');
const fspath = require('path');

const cleanDir = (dirPath, removeSelf) => {
    let files = fs.readdirSync(dirPath);

    files.forEach((file)=>{
        "use strict";
        let filePath = dirPath + '/' + file;
        if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
        }
        else {
            cleanDir(filePath, true);
        }
    });
    if (removeSelf) {
        fs.rmdirSync(dirPath);
    }
};

const createIfNotExists = (output_path) => {
    "use strict";
    if (!fs.existsSync(output_path)){
        fs.mkdirSync(output_path);
    }
};

module.exports = (path) => {
    "use strict";
    return {
        clean (){
            cleanDir(path);
        },
        createPathForArtifact(artifact_name){
            let output_path = fspath.join(path,artifact_name);
            createIfNotExists(output_path);
            return output_path.toString();
        }
    };
};
