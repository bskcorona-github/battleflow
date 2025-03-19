import { NextApiRequest, NextApiResponse } from "next";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode: number;
}

export type ApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
}
