import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config({ path: "./src/.env" });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Servidor OCR corriendo en http://localhost:${PORT}`);
});
