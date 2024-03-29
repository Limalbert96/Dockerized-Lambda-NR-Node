import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand
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
    
    const user = event.user;
    let visit_count = 0;
    
    // Check if user exists
    try{
        const checkUser = new GetCommand({
            TableName: table_name,
            Key: {
                user: user
            }
        });
    
        body = await dynamodb.send(checkUser);

        // If user exists use the existing visit_count value from the table
        if (body.Item) {
            visit_count = body.Item.visit_count;
        }
        
        visit_count++;
        
        // Update the user visitation count
        const updateUser = new PutCommand({
            TableName: table_name,
            Item: {
                user: user,
                visit_count: visit_count
            }
        });
        
        body = await dynamodb.send(updateUser);
        
        // Return message to the console
        const message = `Hello ${user}! You have visited us ${visit_count} times.`;
        console.log(message);
        return message;
    
    }catch (e) {
        console.error(e);
        // if table key input does not match, then throw the error message to the console 
        if (body == undefined) {
          throw e; 
        }
        return e;
    }finally {
        console.log("EVENT: " + JSON.stringify(body));
    }
};

// Wrap the handler with middy
export const handler = middy(lambdaHandler)

// Use the middleware by passing the Tracer instance as a parameter
.use(captureLambdaHandler(tracer));