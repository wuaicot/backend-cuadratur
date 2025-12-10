// backend-cuadratur/src/application/config/planilla-config.ts

// This list of known ingredients will be used to match against the OCR output.
// It's important to keep this list as accurate as possible.
export const KNOWN_INGREDIENTS = [
  "Ave Personal",
  "Hamb. Gigante",
  "Hamb. Personal",
  // ... add all other possible ingredients here
];

export const PLANILLA_CONFIG = {
  // Image dimensions from the user's output
  imageWidth: 9000,
  imageHeight: 12000,

  // These are the calibrated values based on the user's input for "Ave Personal".
  // We assume a consistent layout for all ingredients.
  ingredientGridDefinitions: [
    {
      name: "Ave Personal",
      x: 1093,
      y: 7754,
      width: 5192,
      height: 798,
    },
    // The orchestrator will need to be updated to dynamically add more grids based on detected ingredients.
  ],

  // NOTE: Based on the provided coordinates, the Y-axis seems to be inverted
  // (or INIC is at the bottom and FIN is at the top). The following offsets
  // are calculated based on the provided coordinates. If the results are still
  // incorrect, we may need to invert these offsets.
  categoryRowOffsets: {
    // Calculated based on Y_FIN=7854 and Y_INIC=8453, with a grid height of 798.
    // The order is FIN, DEV, ENTR, INIC from top to bottom.
    FIN: 0.125,
    DEV: 0.375,
    ENTR: 0.625,
    INIC: 0.875,
  },

  quantityColumnOffsets: {
    // Recalculated based on X_10=1994 and X_9=6171, with a grid width of 5192.
    // The step between column centers is approximately 232 pixels.
    "10": 0.173,
    "20": 0.218,
    "30": 0.263,
    "40": 0.308,
    "50": 0.353,
    "60": 0.398,
    "70": 0.443,
    "80": 0.488,
    "90": 0.533,
    "100": 0.578,
    "1": 0.623,
    "2": 0.668,
    "3": 0.713,
    "4": 0.758,
    "5": 0.803,
    "6": 0.848,
    "7": 0.893,
    "8": 0.938,
    "9": 0.983,
  },

  // Estimated from user's coordinates.
  cellWidth: 245,
  cellHeight: 200,
};

