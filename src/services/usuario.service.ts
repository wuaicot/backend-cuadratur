import { prisma } from "../config/prisma.js";

export class UsuarioService {
  async list() {
    return prisma.usuario.findMany({
      orderBy: { id: "asc" }
    });
  }

  async create(data: { nombre: string }) {
    return prisma.usuario.create({ data });
  }

  async findOne(id: number) {
    return prisma.usuario.findUnique({ where: { id } });
  }

  async remove(id: number) {
    return prisma.usuario.delete({ where: { id } });
  }
}
