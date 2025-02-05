import { responseFn } from '../common/response';
import { RequestHandler } from 'express';

function transformBytesToGB(bytes: number): string {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

export const healthCheckController: RequestHandler = (req, res) => {
  return responseFn(res, 200, 'OK');
};

export const processMetricCheckController: RequestHandler = async (
  req,
  res,
) => {
  return responseFn(res, 200, {});
};
