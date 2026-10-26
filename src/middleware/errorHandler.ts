import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';

// NOTE: intentional vulnerability — see specs/05-intentional-vulnerability-requirements.md (#3).
// Unhandled errors are returned with their raw message and stack trace instead of a generic
// message, which discloses internal implementation and database details.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  const error = err as Error;
  res.status(500).json({
    error: error.message,
    stack: error.stack,
  });
}
