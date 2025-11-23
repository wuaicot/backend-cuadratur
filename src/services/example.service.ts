import { prisma } from "../config/prisma.js";

export class ExampleService {
  async list() {
    return (prisma as any).example.findMany();
  }

  async create(data: { name: string }) {
    return (prisma as any).example.create({
      data
    });
  }
}
