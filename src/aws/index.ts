import type { Handler, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

import type { TShallotHTTPCorsOptions } from '@shallot/http-cors/dist/aws';
import type { TShallotErrorHandlerOptions } from '@shallot/http-error-handler/dist/aws';
import type { TShallotJSONBodyParserOptions } from '@shallot/http-json-body-parser/dist/aws';

import ShallotAWS, { ShallotAWSHandler } from '@shallot/aws';
import { ShallotAWSHttpCors } from '@shallot/http-cors';
import { ShallotAWSHttpErrorHandler } from '@shallot/http-error-handler';
import { ShallotAWSHttpJsonBodyParser } from '@shallot/http-json-body-parser';

type ParsedJSON = Record<string | number | symbol, unknown>;
export type RequestDataBase = ParsedJSON | unknown;
export type ResultDataBase = ParsedJSON | Array<ParsedJSON> | unknown;

export type ShallotRawHandler<
  TEvent extends TShallotHttpEvent = TShallotHttpEvent,
  TResultData extends ResultDataBase = unknown
> = Handler<TEvent, HTTPRawResult<TResultData>>;

export type TShallotHttpEvent<
  TQueryStringParameters extends RequestDataBase = unknown,
  TPathParameters extends RequestDataBase = unknown,
  THeaders extends RequestDataBase = unknown,
  TBody extends RequestDataBase = unknown
> = Omit<
  Omit<Omit<Omit<APIGatewayEvent, 'body'>, 'queryStringParameters'>, 'pathParameters'>,
  'headers'
> & {
  queryStringParameters?: TQueryStringParameters;
  pathParameters?: TPathParameters;
  headers?: THeaders;
  body?: TBody;
};

export interface HTTPRawResult<TResultData extends ResultDataBase = unknown> {
  message: string;
  data?: TResultData;
}

/** Wraps a Serverless api function handler with middleware from
 * the Shallot framework.
 *
 * @param  {Function} handler The original Serverless handler function.
 * @param  {HTTPStatusCodes} successStatusCode Optional. HTTP Status to return on success. Default 200.
 *
 * @return {Function} The shallot-fyed wrapped function handler.
 */
const ShallotRESTWrapper = <TEvent extends TShallotHttpEvent = TShallotHttpEvent>(
  handler: ShallotRawHandler<TEvent>,
  successStatusCode = 200,
  middlewareOpts: {
    HttpCorsOpts?: TShallotHTTPCorsOptions;
    HttpErrorHandlerOpts?: TShallotErrorHandlerOptions;
    HttpJsonBodyParserOpts?: TShallotJSONBodyParserOptions;
  } = {}
): ShallotAWSHandler<TEvent, APIGatewayProxyResult> => {
  const wrappedResponseHandler: Handler = async (...args) => {
    const res = await handler(...args);
    return {
      statusCode: successStatusCode,
      body: JSON.stringify(res),
    };
  };

  return ShallotAWS(wrappedResponseHandler)
    .use(ShallotAWSHttpJsonBodyParser(middlewareOpts.HttpJsonBodyParserOpts))
    .use(ShallotAWSHttpCors(middlewareOpts.HttpCorsOpts))
    .use(ShallotAWSHttpErrorHandler(middlewareOpts.HttpErrorHandlerOpts));
};

export default ShallotRESTWrapper;
