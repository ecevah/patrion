export class SuccessResponse<T = any> {
  status: true = true;
  message: string;
  data?: T;

  constructor(message: string, data?: T) {
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}

export class EmptySuccessResponse {
  status: true = true;
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class ErrorResponse {
  status: false = false;
  message: string;
  error: string;
  error_detail?: any;

  constructor(message: string, error: string, error_detail?: any) {
    this.message = message;
    this.error = error;
    if (error_detail !== undefined) {
      this.error_detail = error_detail;
    }
  }
}

export interface Pagination {
  current_page: number;
  total_page: number;
  total_item: number;
  limit: number;
}

export class ListSuccessResponse<T = any> {
  status: true = true;
  message: string;
  pagination: Pagination;
  data: T[];

  constructor(message: string, pagination: Pagination, data: T[]) {
    this.message = message;
    this.pagination = pagination;
    this.data = data;
  }
} 