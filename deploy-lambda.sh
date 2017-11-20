#!/bin/bash

USAGE_STRING="Usage ./deploy-lambda.sh <s3-bucket-name>"

if [[ $# != 1 ]] ; then
    echo $USAGE_STRING
    exit 1
fi

s3_bucket_name=$1

cd sonar-scan && npm install

cd ../

aws cloudformation package \
  --template-file iac_config/template.yaml \
  --s3-bucket ${s3_bucket_name} \
  --output-template-file iac_config/packaged-template.yaml

aws cloudformation deploy \
    --template-file iac_config/packaged-template.yaml \
    --stack-name sonar-scan-lambda-stack \
    --capabilities CAPABILITY_IAM
