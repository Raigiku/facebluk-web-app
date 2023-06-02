export type Request = {
  page: number;
  pageSize: number;
};

export type Response<T> = {
  hasMoreData: boolean;
  data: T[];
};
