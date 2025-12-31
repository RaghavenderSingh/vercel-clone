import type { Request, Response, NextFunction } from "express";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('api-server');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body
  });

  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      error: "Database error",
      details: err.message,
    });
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
