import { Request, Response } from "express";

export const post = (req: Request, res: Response) => {
  console.log("in handler");
  res.json({ url: req.url, method: req.method, test: "users post" });
};
