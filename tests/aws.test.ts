import type { Context } from 'aws-lambda';

import { test, describe, jest, expect } from '@jest/globals';

import { ShallotAWSRestWrapper } from '../src';
import type { ShallotRawHandler, TShallotHttpEvent } from '../src/aws';

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

  const mockHandler: ShallotRawHandler<
    TShallotHttpEvent<{ test: string }, unknown, { Origin: string }>,
    { username: string }
  > = async () => ({
    message: 'hello world',
    data: {
      username: 'bill',
    },
  });

  test('Smoke test CORS default usage', async () => {
    const wrappedHandler = ShallotAWSRestWrapper(mockHandler);

    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        Origin: 'https://www.example.com',
      },
    } as unknown as TShallotHttpEvent<{ test: string }, unknown, { Origin: string }>;
    const res = await wrappedHandler(mockEvent, mockContext, jest.fn());

    expect(res.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
    });
  });
});
