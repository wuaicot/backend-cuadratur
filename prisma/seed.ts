
import { PrismaClient, Ingrediente, Producto } from '@prisma/client';
import { MENUS, BEBESTIBLES, INGREDIENTES_MASTER } from '../src/data/inventario';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clear existing data
  console.log('Deleting existing data...');
  await prisma.receta.deleteMany({});
  await prisma.ingrediente.deleteMany({});
  await prisma.producto.deleteMany({});
  console.log('Existing data deleted.');

  // 2. Seed Ingredientes
  console.log('Seeding ingredients...');
  const ingredientesMap = new Map<string, Ingrediente>();
  for (const key in INGREDIENTES_MASTER) {
    const ingredienteData = INGREDIENTES_MASTER[key];
    const createdIngrediente = await prisma.ingrediente.create({
      data: {
        nombre: ingredienteData.nombre,
        unidad: ingredienteData.unidad || 'unidad', // Default to 'unidad' if not present
      },
    });
    ingredientesMap.set(ingredienteData.nombre, createdIngrediente);
    console.log(`Created ingredient: ${createdIngrediente.nombre}`);
  }
  console.log('Ingredients seeded.');

  // 3. Seed Productos (Bebestibles)
  console.log('Seeding bebestibles (products)...');
  const productosMap = new Map<string, Producto>();
  for (const codigo in BEBESTIBLES) {
    const bebestibleData = BEBESTIBLES[codigo];
    const createdProducto = await prisma.producto.create({
      data: {
        codigoZ: bebestibleData.codigo,
        nombre: bebestibleData.nombre,
      },
    });
    productosMap.set(bebestibleData.codigo, createdProducto);
    console.log(`Created product (bebestible): ${createdProducto.nombre}`);
  }
  console.log('Bebestibles seeded.');

  // 4. Seed Productos (Menus)
  console.log('Seeding menus (products)...');
  for (const codigo in MENUS) {
    const menuData = MENUS[codigo];
    // Handle potential duplicate names from bebestibles if necessary, though codes should be unique
    const createdProducto = await prisma.producto.create({
      data: {
        codigoZ: menuData.codigo,
        nombre: menuData.nombre,
      },
    });
    productosMap.set(menuData.codigo, createdProducto);
    console.log(`Created product (menu): ${createdProducto.nombre}`);
  }
  console.log('Menus seeded.');

  // 5. Seed Recetas
  console.log('Seeding recetas...');
  for (const codigo in MENUS) {
    const menuData = MENUS[codigo];
    const producto = productosMap.get(menuData.codigo);

    if (!producto) {
      console.warn(`Product with code ${menuData.codigo} not found. Skipping recipe.`);
      continue;
    }

    for (const ingredienteDef of menuData.ingredientes) {
      // The 'any' casts and 'quantity' are due to inconsistencies in the source data.
      const nombreIngrediente = ingredienteDef.nombre;
      const cantidad = (ingredienteDef as any).cantidad || (ingredienteDef as any).quantity;
      
      const ingrediente = ingredientesMap.get(nombreIngrediente);

      if (!ingrediente) {
        console.warn(`Ingredient with name "${nombreIngrediente}" not found. Skipping ingredient in recipe for ${menuData.nombre}.`);
        continue;
      }
      
      if (cantidad === undefined) {
        console.warn(`Quantity for ingredient "${nombreIngrediente}" in product "${menuData.nombre}" is undefined. Skipping.`);
        continue;
      }

      await prisma.receta.create({
        data: {
          productoId: producto.id,
          ingredienteId: ingrediente.id,
          cantidad: cantidad,
        },
      });
      console.log(`Created recipe for ${menuData.nombre} with ingredient ${nombreIngrediente}`);
    }
  }
  console.log('Recetas seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
