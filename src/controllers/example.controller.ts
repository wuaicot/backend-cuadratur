import { Request, Response } from "express";
import { ExampleService } from "../services/example.service.js";

const service = new ExampleService();

export async function getAll(req: Request, res: Response) {
  const data = await service.list();
  return res.json(data);
}

export async function create(req: Request, res: Response) {
  const data = await service.create(req.body);
  return res.status(201).json(data);
}
