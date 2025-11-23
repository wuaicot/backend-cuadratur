import { Request, Response } from "express";
import { UsuarioService } from "../services/usuario.service.js";

const service = new UsuarioService();

export async function getAll(req: Request, res: Response) {
  const data = await service.list();
  return res.json(data);
}

export async function create(req: Request, res: Response) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "nombre es requerido" });

  const data = await service.create({ nombre });
  return res.status(201).json(data);
}

export async function getOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = await service.findOne(id);
  if (!data) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(data);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await service.remove(id);
  return res.status(204).send();
}
