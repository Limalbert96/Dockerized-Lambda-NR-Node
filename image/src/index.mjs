import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';

const tracer = new Tracer({ serviceName: 'dockerizedNodeLambda' });

// Instrument the AWS SDK client
const client = tracer.captureAWSv3Client(new DynamoDBClient());

//const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const table_name = process.env.TABLE_NAME;

const lambdaHandler = async (event, context) => {
    let body;
    let statusCode = 200;
    
    const user = event.user;
    let visit_count = 0;
    
    try {
        const params = {
            TableName: table_name,
            Key: {
                user: user
            }
        };
        
        body = await dynamodb.send(new GetCommand(params));
        if (body.Item) {
            visit_count = body.Item.visit_count;
        }
        visit_count++;
        
        const putParams = {
            TableName: table_name,
            Item: {
                user: user,
                visit_count: visit_count
            }
        };

        body = await dynamodb.send(new PutCommand(putParams));
    
        const message = `Hello ${user}! You have visited us ${visit_count} times.`;
        console.log(message);
        return {
            message: message
        };
    
    }catch (err) {
        statusCode = 400;
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }
};

// Wrap the handler with middy
export const handler = middy(lambdaHandler)

// Use the middleware by passing the Tracer instance as a parameter
.use(captureLambdaHandler(tracer));