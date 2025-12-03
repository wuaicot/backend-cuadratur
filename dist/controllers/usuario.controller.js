import { UsuarioService } from "../services/usuario.service.js";
const service = new UsuarioService();
export async function getAll(req, res) {
    const data = await service.list();
    return res.json(data);
}
export async function create(req, res) {
    const { nombre } = req.body;
    if (!nombre)
        return res.status(400).json({ error: "nombre es requerido" });
    const data = await service.create({ nombre });
    return res.status(201).json(data);
}
export async function getOne(req, res) {
    const id = Number(req.params.id);
    const data = await service.findOne(id);
    if (!data)
        return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(data);
}
export async function remove(req, res) {
    const id = Number(req.params.id);
    await service.remove(id);
    return res.status(204).send();
}
