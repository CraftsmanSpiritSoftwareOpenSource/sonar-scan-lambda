"use strict";

const chai = require('chai'), expect = chai.expect;
const os = require('os');
const fs = require('fs');
const fspath = require('path');
const LambdaFileService = require('./lambdaFileService');
const uuid = require('uuid4');


describe('lambda file system access service', () => {
    let tmpPath;
    let lambdaFileService;
    beforeEach(()=>{
        tmpPath = fs.mkdtempSync(fspath.join(os.tmpdir(), 'sonar-scan-test-'));
        lambdaFileService = LambdaFileService(tmpPath);
    });

    describe('#createPathForArtifact', ()=>{
        it('should create the path', ()=>{
            let id = new uuid().toString();
            lambdaFileService.createPathForArtifact(id);
            let path = lambdaFileService.createPathForArtifact(id);
            expect(path).to.equal(fspath.join(tmpPath,id));
            expect(fs.existsSync(path)).to.be.true;
        });
    });

    describe('#clean', ()=>{
        let path;
        let testFilePath;
        beforeEach(()=>{
            let id = new uuid().toString();
            path = lambdaFileService.createPathForArtifact(id);
            testFilePath = fspath.join(path,'test.txt');
            fs.writeFileSync(testFilePath, "test file");
        });
        it('should clean up the directory', ()=>{
            lambdaFileService.clean();
            expect(fs.existsSync(testFilePath)).to.be.false;
            expect(fs.existsSync(path)).to.be.false;
            expect(fs.existsSync(tmpPath)).to.be.true;
        });
    });
});

