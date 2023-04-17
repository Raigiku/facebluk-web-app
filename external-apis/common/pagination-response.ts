export type PaginationResponse<T> = {
  readonly totalPages: number;
  readonly data: T[];
};
