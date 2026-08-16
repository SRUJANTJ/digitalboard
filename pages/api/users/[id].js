import prisma from "../../../lib/prisma";
import { getUserFromReq } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Only admin can manage students" });
  }

  const id = Number(req.query.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== "student") {
    return res.status(404).json({ error: "Student not found" });
  }

  if (req.method === "DELETE") {
    try {
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Delete student error:", err);
      return res.status(500).json({ error: "Failed to delete student" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
