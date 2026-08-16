import prisma from "../../../lib/prisma";
import { getUserFromReq } from "../../../lib/auth";
import { CATEGORIES } from "../../../lib/constants";

// Urgency sort order applied in JS so this works identically across
// Postgres/MySQL/SQLite (no dialect-specific CASE/ORDER BY needed).
// Notices are always shown most-urgent-first — high priority notices
// float to the top of the board regardless of when they were posted.
const URGENCY_RANK = { high: 0, medium: 1, low: 2 };
const VALID_CATEGORIES = CATEGORIES.map((c) => c.value);

export default async function handler(req, res) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    try {
      const { department, semester, urgency, category, search } = req.query;

      const where = {};

      // Students only ever see notices for their own department + semester (or dept "ALL")
      if (user.role === "student") {
        where.AND = [
          { OR: [{ department: "ALL" }, { department: user.department }] },
          { OR: [{ semester: null }, { semester: user.semester }] },
        ];
      } else {
        if (department) where.department = department;
        if (semester) where.semester = Number(semester);
      }

      if (urgency) where.urgency = urgency;
      if (category) where.category = category;

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ];
      }

      const notices = await prisma.notice.findMany({
        where,
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });

      const shaped = notices
        .map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          department: n.department,
          semester: n.semester,
          urgency: n.urgency,
          category: n.category,
          created_at: n.createdAt,
          updated_at: n.updatedAt,
          author_name: n.author.name,
        }))
        .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);

      return res.status(200).json({ notices: shaped });
    } catch (err) {
      console.error("Fetch notices error:", err);
      return res.status(500).json({ error: "Failed to fetch notices" });
    }
  }

  if (req.method === "POST") {
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can create notices" });
    }

    try {
      const { title, content, department, semester, urgency, category } = req.body || {};

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const validUrgency = ["low", "medium", "high"].includes(urgency) ? urgency : "medium";
      const validCategory = VALID_CATEGORIES.includes(category) ? category : "general";

      const notice = await prisma.notice.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          department: department && department.trim() ? department.trim() : "ALL",
          semester: semester ? Number(semester) : null,
          urgency: validUrgency,
          category: validCategory,
          createdBy: user.id,
        },
      });

      return res.status(201).json({ notice });
    } catch (err) {
      console.error("Create notice error:", err);
      return res.status(500).json({ error: "Failed to create notice" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
