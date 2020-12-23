import type {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayEvent,
} from 'aws-lambda';

import type { ShallotRESTHandler } from 'shallot/dist/aws';
import type { TShallotHTTPCorsOptions } from '@shallot/http-cors/dist/aws';
import type { TShallotErrorHandlerOptions } from '@shallot/http-error-handler/dist/aws';
import type { TShallotJSONBodyParserOptions } from '@shallot/http-json-body-parser/dist/aws';

import ShallotAWS from 'shallot/dist/aws';
import { ShallotAWSHttpCors } from '@shallot/http-cors';
import { ShallotAWSHttpErrorHandler } from '@shallot/http-error-handler';
import { ShallotAWSHttpJsonBodyParser } from '@shallot/http-json-body-parser';

type ParsedJSON = Record<string | number | symbol, unknown>;
export type RequestDataBase = ParsedJSON | undefined;
export type ResultDataBase = ParsedJSON | Array<ParsedJSON> | undefined;

export type ShallotRawHandler<
  TQueryStringParameters extends RequestDataBase = undefined,
  TPathParameters extends RequestDataBase = undefined,
  THeaders extends RequestDataBase = undefined,
  TBody extends RequestDataBase = undefined,
  TResultData extends ResultDataBase = undefined
> = Handler<
  ShallotHttpEvent<TQueryStringParameters, TPathParameters, THeaders, TBody>,
  HTTPRawResult<TResultData>
>;

export type ShallotHttpEvent<
  TQueryStringParameters extends RequestDataBase = undefined,
  TPathParameters extends RequestDataBase = undefined,
  THeaders extends RequestDataBase = undefined,
  TBody extends RequestDataBase = undefined
> = Omit<
  Omit<Omit<Omit<APIGatewayEvent, 'body'>, 'queryStringParameters'>, 'pathParameters'>,
  'headers'
> & {
  queryStringParameters?: TQueryStringParameters;
  pathParameters?: TPathParameters;
  headers?: THeaders;
  body?: TBody;
};

export interface HTTPRawResult<TResultData extends ResultDataBase = undefined> {
  message: string;
  data?: TResultData;
}

type TShallotRESTWrapper<
  TQueryStringParameters extends RequestDataBase = undefined,
  TPathParameters extends RequestDataBase = undefined,
  THeaders extends RequestDataBase = undefined,
  TBody extends RequestDataBase = undefined,
  TResultData extends ResultDataBase = undefined
> = (
  handler: ShallotRawHandler<
    TQueryStringParameters,
    TPathParameters,
    THeaders,
    TBody,
    TResultData
  >,
  successStatusCode?: number,
  middlewareOpts?: {
    HttpCorsOpts?: TShallotHTTPCorsOptions;
    HttpErrorHandlerOpts?: TShallotErrorHandlerOptions;
    HttpJsonBodyParserOpts?: TShallotJSONBodyParserOptions;
  }
) => ShallotRESTHandler<APIGatewayProxyEvent, APIGatewayProxyResult>;

/** Wraps a Serverless api function handler with middleware from
 * the Middy framework.
 *
 * @param  {Function} handler The original Serverless handler function.
 * @param  {HTTPStatusCodes} successStatusCode Optional. HTTP Status to return on success. Default 200.
 *
 * @return {Function} The Middy-fyed wrapped function handler.
 */
const ShallotRESTWrapper: TShallotRESTWrapper = (
  handler,
  successStatusCode = 200,
  middlewareOpts = {}
) => {
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
