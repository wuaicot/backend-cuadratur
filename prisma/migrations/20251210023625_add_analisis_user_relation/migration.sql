/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioId` to the `Analisis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analisis" ADD COLUMN     "usuarioId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombre_key" ON "Usuario"("nombre");

-- AddForeignKey
ALTER TABLE "Analisis" ADD CONSTRAINT "Analisis_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
