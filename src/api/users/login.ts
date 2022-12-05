import { Request, Response } from "express";

export const post = (req: Request, res: Response) => {
  res.json({ url: req.url, method: req.method, page: "Login" });
};
