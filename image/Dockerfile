# Add New Relic Extension & AWS Python Base Image
FROM public.ecr.aws/x6n7b2o2/newrelic-lambda-layers-nodejs:18-arm64 AS Extension
FROM public.ecr.aws/lambda/nodejs:18 AS base

# Extension code
WORKDIR /opt
COPY --from=Extension /opt/ .
COPY src/* ${LAMBDA_TASK_ROOT}

COPY package*.json ${LAMBDA_TASK_ROOT}
RUN cd /var/task && npm install

# Set the CMD to your handler.
CMD [ "index.handler" ]
