import { Request, Response } from "express";

export const remove = (req: Request, res: Response) => {
  res.json({ url: req.url, method: req.method, params: req.params });
};
