import type { Context, APIGatewayEvent } from 'aws-lambda';

import { test, describe, jest, expect } from '@jest/globals';

import { ShallotAWSRestWrapper } from '../src';
import type { ShallotRawHandler } from '../src/aws';

describe('REST Wrapper', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    invokedFunctionArn: '',
    memoryLimitInMB: '',
    awsRequestId: '',
    logGroupName: '',
    logStreamName: '',
    getRemainingTimeInMillis: () => 0,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
  };

  const mockHandler: ShallotRawHandler = async () => ({
    message: 'hello world',
  });

  test('Smoke test CORS default usage', async () => {
    const wrappedHandler = ShallotAWSRestWrapper(mockHandler);

    const mockEvent = ({
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown) as APIGatewayEvent;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': mockEvent.headers.Origin,
    });
  });
});
