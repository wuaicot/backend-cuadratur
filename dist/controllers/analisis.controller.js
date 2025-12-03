import { AnalisisService } from "../services/analisis.service";
const svc = new AnalisisService();
export async function procesarAnalisis(req, res) {
    const { planillaCaja, planillaCocina, reporteZ } = req.body;
    if (!reporteZ)
        return res.status(400).json({ error: "reporteZ requerido" });
    const result = svc.analyze(planillaCaja ?? null, planillaCocina ?? null, reporteZ);
    // opcional: guardar en BD con prisma
    // await prisma.analisis.create({ data: { ... } });
    return res.json(result);
}
