export type Request = {
  page: number;
  pageSize: number;
};

export type Response<T> = {
  nextPage: number | null;
  data: T[];
};
