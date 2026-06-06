import { Request, Response } from "express";
import compression from "compression";

export const shouldCompress = (req: Request, res: Response) => {
  if (req.header("x-no-compression")) {
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
};
