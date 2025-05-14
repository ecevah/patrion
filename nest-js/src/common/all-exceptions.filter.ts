import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from './response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Bilinmeyen bir hata oluştu';
    let errorCode = 'Internal Server Error';
    let errorDetail: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        const exceptionObj = exceptionResponse as any;
        message = exceptionObj.message || exception.message;
        errorCode = exceptionObj.error || HttpStatus[status];
        if (exceptionObj.errorDetail) {
          errorDetail = exceptionObj.errorDetail;
        }
      } else {
        message = exception.message;
        errorCode = HttpStatus[status];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetail = exception.stack;
    }

    // ErrorResponse formatında dön
    const errorResponse = new ErrorResponse(
      message, 
      errorCode,
      errorDetail
    );

    // Log exception
    console.error(`Exception caught at ${request.method} ${request.url}:`, exception);

    response
      .status(status)
      .json(errorResponse);
  }
} 