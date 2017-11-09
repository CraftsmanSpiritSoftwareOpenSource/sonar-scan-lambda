#!/bin/bash
cd sonar-scan && npm install

cd ../

aws cloudformation package \
  --template-file iac_config/template.yaml \
  --s3-bucket met-sonar-scan-lambda-code \
  --output-template-file iac_config/packaged-template.yaml

aws cloudformation deploy \
    --template-file iac_config/packaged-template.yaml \
    --stack-name sonar-scan-lambda-stack \
    --capabilities CAPABILITY_IAM
