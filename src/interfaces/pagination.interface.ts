export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

export class PaginationHelper {
  static calculateMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

 
  static validateParams(
    page?: number | string,
    limit?: number | string,
    maxLimit = 100
  ): PaginationParams {
    const parsedPage = Math.max(1, parseInt(String(page || 1), 10));
    const parsedLimit = Math.min(
      maxLimit,
      Math.max(1, parseInt(String(limit || 10), 10))
    );

    return {
      page: parsedPage,
      limit: parsedLimit,
    };
  }

 
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}