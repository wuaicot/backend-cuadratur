// src/data/inventario.ts
export type IngredienteDef = {
  nombre: string;
  cantidad: number;
  unidad?: string;
};
export type MenuDef = {
  codigo: string;
  nombre: string;
  ingredientes: IngredienteDef[];
};
export type BebestibleDef = { codigo: string; nombre: string; unidad?: string };
export type EmpanadaDef = MenuDef;

export const BEBESTIBLES: Record<string, BebestibleDef> = {
  "4221": { codigo: "4221", nombre: "SCHOP QUILMES 500CC", unidad: "unidad" },
  "4224": { codigo: "4224", nombre: "BOTELLIN HEINEKEN", unidad: "unidad" },
  "4230": { codigo: "4230", nombre: "SHOP CRISTAL 500CC", unidad: "unidad" },
  "4239": { codigo: "4239", nombre: "ROYAL LATA 1/2", unidad: "unidad" },
  "4246": { codigo: "4246", nombre: "CORONA BOTELLIN", unidad: "unidad" },
  "4306": { codigo: "4306", nombre: "COCA COLA LATA", unidad: "unidad" },
  "4401": { codigo: "4401", nombre: "COCA COLA 591CC", unidad: "unidad" },
  "4407": { codigo: "4407", nombre: "VITAL SIN GAS", unidad: "unidad" },
  "4428": { codigo: "4428", nombre: "BEBIDA 1 1/5", unidad: "unidad" },
  "4501": { codigo: "4501", nombre: "NECTAR IND", unidad: "unidad" },
  "4602": { codigo: "4602", nombre: "TE GRANDE", unidad: "unidad" },
  "4869": { codigo: "4869", nombre: "PROMO SCHOP 2X1", unidad: "unidad" },
  // agrega más si se requiere...
};

export const EMPANADAS: Record<string, EmpanadaDef> = {
  // Ejemplo:
  // "3601": {
  //   codigo: "3601",
  //   nombre: "EMP CAMARON QUESO FR",
  //   ingredientes: [
  //     { nombre: "Masa empanada", cantidad: 1 },
  //     { nombre: "Camarones", cantidad: 100, unidad: "gr" },
  //     { nombre: "Queso", cantidad: 50, unidad: "gr" },
  //   ],
  // },
};

export const MENUS: Record<string, MenuDef> = {
  "0101": {
    codigo: "0101",
    nombre: "COM ITALIANO PERSONA",
    ingredientes: [
      { nombre: "Pan mesa Personal", cantidad: 1, unidad: "un" },
      { nombre: "Vienesas personal", cantidad: 1, unidad: "un" as any },
    ],
  },
  "0102": {
    codigo: "0102",
    nombre: "COM COMPLETO PERSONA",
    ingredientes: [
      { nombre: "Pan mesa Personal", cantidad: 1 },
      { nombre: "Vienesas personal", cantidad: 1 },
    ],
  },
  "0103": {
    codigo: "0103",
    nombre: "COM CATALANA PERSONA",
    ingredientes: [
      { nombre: "Pan mesa Personal", cantidad: 1 },
      { nombre: "Vienesas personal", quantity: 1 } as any,
    ],
  },

  "0301": {
    codigo: "0301",
    nombre: "COM ITALIANO GIGANTE",
    ingredientes: [
      { nombre: "Pan mesa Gigante", cantidad: 1 },
      { nombre: "Vienesa doggi", cantidad: 1 },
    ],
  },
  "0302": {
    codigo: "0302",
    nombre: "COM COMPLETO GIGANTE",
    ingredientes: [
      { nombre: "Pan mesa Gigante", cantidad: 1 },
      { nombre: "Vienesa doggi", cantidad: 1 },
    ],
  },
  "0303": {
    codigo: "0303",
    nombre: "COM CATALANA GIGANTE",
    ingredientes: [
      { nombre: "Pan mesa Gigante", cantidad: 1 },
      { nombre: "Vienesa doggi", cantidad: 1 },
    ],
  },
  "0502": {
    codigo: "0502",
    nombre: "COM COMPLETO SUPER",
    ingredientes: [
      { nombre: "Pan mesa súper Gigan.", cantidad: 1 },
      { nombre: "Vienesas personal", cantidad: 2 },
    ],
  },
  "0508": {
    codigo: "0508",
    nombre: "COM ITALIANO SUPER",
    ingredientes: [
      { nombre: "Pan mesa súper Gigan.", cantidad: 1 },
      { nombre: "Vienesas personal", cantidad: 2 },
    ],
  },
  "0901": {
    codigo: "0901",
    nombre: "CHUR ITA GIG",
    ingredientes: [
      { nombre: "Pan hallullon", cantidad: 1 },
      { nombre: "carne churrasco gig", cantidad: 2 },
    ],
  },
  "0902": {
    codigo: "0902",
    nombre: "CHUR COMP GIG",
    ingredientes: [
      { nombre: "Pan hallullon", cantidad: 1 },
      { nombre: "carne churrasco gig", cantidad: 2 },
    ],
  },
  "0903": {
    codigo: "0903",
    nombre: "CHUR COMP GIG",
    ingredientes: [
      { nombre: "Pan hallullon", cantidad: 1 },
      { nombre: "carne churrasco gig", cantidad: 2 },
    ],
  },
  "0911": {
    codigo: "0911",
    nombre: "CHUR MEXICANO GIG",
    ingredientes: [
      { nombre: "Pan hallullon", cantidad: 1 },
      { nombre: "carne churrasco gig", cantidad: 2 },
    ],
  },
  "1502": {
    codigo: "1502",
    nombre: "LOMO COMPLETO PER",
    ingredientes: [
      { nombre: "Pan fricas", cantidad: 1 },
      { nombre: "Carne lomo pers.", cantidad: 2 },
    ],
  },
  "1503": {
    codigo: "1503",
    nombre: "LOMO CHACARE PER",
    ingredientes: [
      { nombre: "Pan fricas", cantidad: 1 },
      { nombre: "Carne lomo pers.", cantidad: 1 },
    ],
  },
  "1901": {
    codigo: "1901",
    nombre: "POLLO ITALIANO PER",
    ingredientes: [
      { nombre: "Pan fricas", cantidad: 1 },
      { nombre: "Carne Ave Personal", cantidad: 1 },
    ],
  },
  "1903": {
    codigo: "1903",
    nombre: "POLLO CHACARE PER",
    ingredientes: [
      { nombre: "Pan fricas", cantidad: 1 },
      { nombre: "Carne Ave Personal", cantidad: 1 },
    ],
  },
  "1908": {
    codigo: "1908",
    nombre: "POLLO OBELISCO PER",
    ingredientes: [
      { nombre: "Pan fricas", cantidad: 1 },
      { nombre: "Carne Ave Personal", cantidad: 1 },
    ],
  },

  "2305": {
    codigo: "2305",
    nombre: "HAMBURG LUCO CHAMP P",
    ingredientes: [
      { nombre: "Pan Brioche 12", cantidad: 1 },
      { nombre: "Carne Hamburg. Porc.", cantidad: 1 },
      { nombre: "Queso laminado", cantidad: 3 },
    ],
  },
  "2801": {
    codigo: "2801",
    nombre: "CHURRASCO ITALIANO PE",
    ingredientes: [
      { nombre: "Pan FRICAS", cantidad: 1 },
      { nombre: "Carne churrasco pers.", cantidad: 1 },
    ],
  },
  "2803": {
    codigo: "2803",
    nombre: "CHURRASCO CHACARRERO",
    ingredientes: [
      { nombre: "Pan FRICAS", cantidad: 1 },
      { nombre: "Carne churrasco pers.", cantidad: 1 },
    ],
  },
  "2812": {
    codigo: "2812",
    nombre: "CHURRASCO AMERICANO PER",
    ingredientes: [
      { nombre: "Pan FRICAS", cantidad: 1 },
      { nombre: "Carne churrasco pers.", cantidad: 1 },
    ],
  },
  "3704": {
    codigo: "3704",
    nombre: "ENSALADA AVE",
    ingredientes: [
      { nombre: "Carne Ave .Gigante", cantidad: 1 },      
    ],
  },
  "3901": {
    codigo: "3901",
    nombre: "PAPAS FRITAS GRANDES",
    ingredientes: [{ nombre: "Papas grandes 700gr", cantidad: 1 }],
  },
  "3902": {
    codigo: "3902",
    nombre: "PAPAS FRITAS PERSONA",
    ingredientes: [{ nombre: "Papas personal 350gr", cantidad: 1 }],
  },
  "3903": {
    codigo: "3903",
    nombre: "CHORRILLANA GRANDE",
    ingredientes: [
      { nombre: "Papas grandes 700gr", cantidad: 1 },
      { nombre: "Carne churrasco gig", cantidad: 1 },
      { nombre: "Vienesas doggi", cantidad: 1 },
      { nombre: "Chorizo", cantidad: 2 },
    ],
  },
  "4023": {
    codigo: "4023",
    nombre: "CARNE MECHADA C ARRO",
    ingredientes: [{ nombre: "Menú 3 Carne Mechada", cantidad: 1 }],
  },
  "4024": {
    codigo: "4024",
    nombre: "CARNE MECHADA C PAPA",
    ingredientes: [{ nombre: "Menú 3 Carne Mechada", cantidad: 1 }],
  },
  "4029": {
    codigo: "4029",
    nombre: "PESCADO/ESCALO/ARROZ",
    ingredientes: [{ nombre: "Menú 2 Pangasius", cantidad: 1 }],
  },
  "4030": {
    codigo: "4030",
    nombre: "PESCA/ESCALO/ENSALAD",
    ingredientes: [{ nombre: "Menú 2 Pangasius", cantidad: 1 }],
  },
  "4031": {
    codigo: "4031",
    nombre: "PESCA/ESCALO/PAPAS",
    ingredientes: [{ nombre: "Menú 2 Pangasius", cantidad: 1 }],
  },
  "4871": {
    codigo: "4871",
    nombre: "COM PER+PAPAS",
    ingredientes: [{ nombre: "Pan mesa Personal", cantidad: 1 },
        { nombre: "Vienesas personal", cantidad: 1 },
    ],
  },
  "4896": {
    codigo: "4896",
    nombre: "LOMO PERSONAL ITALIA",
    ingredientes: [{ nombre: "Pan mesa Personal", cantidad: 1 },
        { nombre: "Carne lomo pers.", cantidad: 1 },
    ],
  },
  
};

export const INGREDIENTES_MASTER: Record<
  string,
  { nombre: string; unidad?: string }
> = {
  "Menú 2 Pangasius": { nombre: "Menú 2 Pangasius", unidad: "un" },
  "Menú 3 Carne Mechada": { nombre: "Menú 3 Carne Mechada", unidad: "un" },
  "Chorizo": { nombre: "Chorizo", unidad: "un" },
  "Vienesas personal": { nombre: "Vienesas personal", unidad: "un" },
  "Vienesas doggi": { nombre: "Vienesas doggi", unidad: "un" },
  "Pan mesa súper Gigan.": { nombre: "Pan mesa súper Gigan.", unidad: "un" },
  "Pan mesa Gigante": { nombre: "Pan mesa Gigante", unidad: "un" },
  "Pan Brioche 12": { nombre: "Pan Brioche 12", unidad: "un" },
  "Pan hallulon": { nombre: "Pan hallullon", unidad: "un" },
  "Papas grandes 700gr": { nombre: "Papas grandes 700gr", unidad: "unidad" },
  "Papas personal 350gr": { nombre: "Papas personal 350gr", unidad: "unidad" },
  "Carne Hamburg. Porc.": { nombre: "Carne Hamburg. Porc.", unidad: "un" },
  "Carne churrasco gig": { nombre: "Carne churrasco gig", unidad: "un" },
  "Carne churrasco pers.": { nombre: "Carne churrasco gig", unidad: "un" },
  "Carne lomo pers.": { nombre: "Carne lomo pers.", unidad: "un" },
  "Carne Ave Personal": { nombre: "Carne Ave Personal", unidad: "un" },
  "Carne Ave .Gigante": { nombre: "Carne Ave .Gigante", unidad: "un" },
  "Queso laminado": { nombre: "Queso laminado", unidad: "un" },
  
};
