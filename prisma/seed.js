// Run with: npm run seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

async function main() {
  const users = [
    { username: "admin", passwordHash: hash("admin123"), name: "System Admin", role: "admin", department: null, semester: null },
    { username: "student1", passwordHash: hash("student123"), name: "Aditi Rao", role: "student", department: "CSE", semester: 5 },
    { username: "student2", passwordHash: hash("student123"), name: "Rohan Mehta", role: "student", department: "ECE", semester: 3 },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  const admin = await prisma.user.findUnique({ where: { username: "admin" } });

  const noticeCount = await prisma.notice.count();
  if (noticeCount === 0) {
    await prisma.notice.createMany({
      data: [
        {
          title: "Notice Board Launch",
          content: "Welcome to the Digital Notice Board. All-college announcements will be pinned here.",
          department: "ALL",
          semester: null,
          urgency: "high",
          category: "general",
          createdBy: admin.id,
        },
        {
          title: "CSE Sem 5 Lab Maintenance",
          content: "The CSE department computer lab will be closed for maintenance this Saturday from 9 AM to 5 PM.",
          department: "CSE",
          semester: 5,
          urgency: "medium",
          category: "academic",
          createdBy: admin.id,
        },
        {
          title: "ECE Sem 3 Guest Lecture",
          content: "A guest lecture on embedded systems will be held in Seminar Hall B at 3 PM on Friday.",
          department: "ECE",
          semester: 3,
          urgency: "low",
          category: "event",
          createdBy: admin.id,
        },
        {
          title: "Diwali Break Announcement",
          content: "The college will remain closed for Diwali from Monday to Wednesday next week. Classes resume Thursday.",
          department: "ALL",
          semester: null,
          urgency: "medium",
          category: "festive",
          createdBy: admin.id,
        },
        {
          title: "Semester End Exam Schedule",
          content: "End-semester exam timetables have been published on the notice board. Check your department block for exact dates.",
          department: "ALL",
          semester: null,
          urgency: "high",
          category: "exam",
          createdBy: admin.id,
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("");
  console.log("Test accounts:");
  console.log("  admin    / admin123    (role: admin)");
  console.log("  student1 / student123  (role: student, CSE sem 5)");
  console.log("  student2 / student123  (role: student, ECE sem 3)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
