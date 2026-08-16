import prisma from "../../../lib/prisma";
import { getUserFromReq, hashPassword } from "../../../lib/auth";
import { DEPARTMENTS, SEMESTERS } from "../../../lib/constants";

export default async function handler(req, res) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Only admin can manage students" });
  }

  if (req.method === "GET") {
    try {
      const students = await prisma.user.findMany({
        where: { role: "student" },
        orderBy: [{ department: "asc" }, { semester: "asc" }, { name: "asc" }],
        select: {
          id: true,
          username: true,
          name: true,
          department: true,
          semester: true,
          createdAt: true,
        },
      });
      return res.status(200).json({ students });
    } catch (err) {
      console.error("Fetch students error:", err);
      return res.status(500).json({ error: "Failed to fetch students" });
    }
  }

  if (req.method === "POST") {
    try {
      const { username, password, name, department, semester } = req.body || {};

      if (!username || !password || !name || !department || !semester) {
        return res.status(400).json({
          error: "Username, password, name, department and semester are all required",
        });
      }
      if (!DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: "Invalid department" });
      }
      if (!SEMESTERS.includes(Number(semester))) {
        return res.status(400).json({ error: "Invalid semester" });
      }

      const existing = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });
      if (existing) {
        return res.status(409).json({ error: "That username is already taken" });
      }

      const student = await prisma.user.create({
        data: {
          username: username.trim().toLowerCase(),
          passwordHash: hashPassword(password),
          name: name.trim(),
          role: "student",
          department,
          semester: Number(semester),
        },
        select: {
          id: true,
          username: true,
          name: true,
          department: true,
          semester: true,
          createdAt: true,
        },
      });

      return res.status(201).json({ student });
    } catch (err) {
      console.error("Create student error:", err);
      return res.status(500).json({ error: "Failed to create student" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
