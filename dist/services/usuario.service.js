import { prisma } from "../config/prisma.js";
export class UsuarioService {
    async list() {
        return prisma.usuario.findMany({
            orderBy: { id: "asc" }
        });
    }
    async create(data) {
        return prisma.usuario.create({ data });
    }
    async findOne(id) {
        return prisma.usuario.findUnique({ where: { id } });
    }
    async remove(id) {
        return prisma.usuario.delete({ where: { id } });
    }
}
