import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json(ApiResponse.fail('Route not found'));
}
