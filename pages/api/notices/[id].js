import prisma from "../../../lib/prisma";
import { getUserFromReq } from "../../../lib/auth";
import { CATEGORIES } from "../../../lib/constants";

const VALID_CATEGORIES = CATEGORIES.map((c) => c.value);

export default async function handler(req, res) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = Number(req.query.id);

  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Notice not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ notice: existing });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Only admin can modify notices" });
  }

  if (req.method === "PUT") {
    try {
      const { title, content, department, semester, urgency, category } = req.body || {};

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const validUrgency = ["low", "medium", "high"].includes(urgency) ? urgency : existing.urgency;
      const validCategory = VALID_CATEGORIES.includes(category) ? category : existing.category;

      const updated = await prisma.notice.update({
        where: { id },
        data: {
          title: title.trim(),
          content: content.trim(),
          department: department && department.trim() ? department.trim() : "ALL",
          semester: semester ? Number(semester) : null,
          urgency: validUrgency,
          category: validCategory,
        },
      });

      return res.status(200).json({ notice: updated });
    } catch (err) {
      console.error("Update notice error:", err);
      return res.status(500).json({ error: "Failed to update notice" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.notice.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Delete notice error:", err);
      return res.status(500).json({ error: "Failed to delete notice" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
