import { prisma } from "../config/prisma.js";
export class ExampleService {
    async list() {
        return prisma.example.findMany();
    }
    async create(data) {
        return prisma.example.create({
            data
        });
    }
}
