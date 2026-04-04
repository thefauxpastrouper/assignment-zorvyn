import { prisma } from "../utils/db";
import bcrypt from "bcryptjs";

type RecordSeed = {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
  description?: string;
  deletedAt?: Date | null;
};

const SEED_USERS = [
  { email: "admin@equiledger.com", role: "ADMIN" as const, isActive: true },
  { email: "analyst@equiledger.com", role: "ANALYST" as const, isActive: true },
  { email: "viewer@equiledger.com", role: "VIEWER" as const, isActive: true },
  { email: "inactive@equiledger.com", role: "VIEWER" as const, isActive: false },
];

function monthDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function recordsForAdmin(now: Date): RecordSeed[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const rows: RecordSeed[] = [];

  for (let back = 0; back < 8; back++) {
    const mi = m - back;
    const d = new Date(y, mi, 1);
    const yy = d.getFullYear();
    const mm = d.getMonth();
    rows.push(
      {
        amount: 5200 + back * 50,
        type: "INCOME",
        category: "Salary",
        date: monthDate(yy, mm, 1),
        description: `Salary ${yy}-${String(mm + 1).padStart(2, "0")}`,
      },
      {
        amount: 1180 + (back % 3) * 20,
        type: "EXPENSE",
        category: "Rent",
        date: monthDate(yy, mm, 3),
        description: "Rent",
      },
      {
        amount: 180 + back * 15,
        type: "EXPENSE",
        category: "Groceries",
        date: monthDate(yy, mm, 8),
        description: "Groceries",
      }
    );
    if (back % 2 === 0) {
      rows.push({
        amount: 350 + back * 25,
        type: "EXPENSE",
        category: "Transport",
        date: monthDate(yy, mm, 12),
        description: "Transit / fuel",
      });
    }
    if (back % 3 === 0) {
      rows.push({
        amount: 800 + back * 100,
        type: "INCOME",
        category: "Freelance",
        date: monthDate(yy, mm, 18),
        description: "Side project",
      });
    }
  }

  rows.push(
    {
      amount: 120,
      type: "EXPENSE",
      category: "Healthcare",
      date: monthDate(y, m, 14),
      description: "Pharmacy",
    },
    {
      amount: 89.5,
      type: "EXPENSE",
      category: "Subscriptions",
      date: monthDate(y, m, 2),
      description: "Streaming",
    },
    {
      amount: 2400,
      type: "INCOME",
      category: "Bonus",
      date: monthDate(y, m - 1, 25),
      description: "Quarterly bonus",
    }
  );

  return rows;
}

function recordsForAnalyst(now: Date): RecordSeed[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    {
      amount: 3200,
      type: "INCOME",
      category: "Consulting",
      date: monthDate(y, m, 4),
      description: "Retainer A",
    },
    {
      amount: 1800,
      type: "INCOME",
      category: "Consulting",
      date: monthDate(y, m, 16),
      description: "Workshop delivery",
    },
    {
      amount: 450,
      type: "EXPENSE",
      category: "Software",
      date: monthDate(y, m, 6),
      description: "SaaS licenses",
    },
    {
      amount: 220,
      type: "EXPENSE",
      category: "Travel",
      date: monthDate(y, m - 1, 11),
      description: "Train tickets",
    },
    {
      amount: 95,
      type: "EXPENSE",
      category: "Meals",
      date: monthDate(y, m - 1, 14),
      description: "Client dinner",
    },
    {
      amount: 2750,
      type: "INCOME",
      category: "Consulting",
      date: monthDate(y, m - 2, 5),
      description: "Project milestone",
    },
    {
      amount: 50,
      type: "EXPENSE",
      category: "Office",
      date: monthDate(y, m - 2, 20),
      description: "Supplies",
    },
    {
      amount: 75,
      type: "EXPENSE",
      category: "Voided (soft-delete demo)",
      date: monthDate(y, m, 9),
      description: "Should not appear in dashboard totals",
      deletedAt: new Date(),
    },
  ];
}

function recordsForViewer(now: Date): RecordSeed[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    {
      amount: 2100,
      type: "INCOME",
      category: "Part-time",
      date: monthDate(y, m, 5),
      description: "Campus job",
    },
    {
      amount: 45,
      type: "EXPENSE",
      category: "Food",
      date: monthDate(y, m, 6),
      description: "Coffee",
    },
    {
      amount: 120,
      type: "EXPENSE",
      category: "Books",
      date: monthDate(y, m - 1, 8),
      description: "Textbooks",
    },
  ];
}

async function seed() {
  console.log("🌱 Seeding database (users + records)…");

  const password = process.env.SEED_PASSWORD ?? "Test@1234";
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [];
  for (const u of SEED_USERS) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        isActive: u.isActive,
        password: hashedPassword,
      },
      create: {
        email: u.email,
        password: hashedPassword,
        role: u.role,
        isActive: u.isActive,
      },
      select: { id: true, email: true, role: true, isActive: true },
    });
    users.push(row);
    console.log(`   ✅ User ${row.email} (${row.role}, active=${row.isActive})`);
  }

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u.id])) as Record<
    string,
    string
  >;

  const seedUserIds = users.map((u) => u.id);
  const deleted = await prisma.record.deleteMany({
    where: { userId: { in: seedUserIds } },
  });
  console.log(`🗑️  Removed ${deleted.count} existing records for seed users`);

  const now = new Date();
  const adminId = byEmail["admin@equiledger.com"]!;
  const analystId = byEmail["analyst@equiledger.com"]!;
  const viewerId = byEmail["viewer@equiledger.com"]!;

  const batches: { userId: string; rows: RecordSeed[] }[] = [
    { userId: adminId, rows: recordsForAdmin(now) },
    { userId: analystId, rows: recordsForAnalyst(now) },
    { userId: viewerId, rows: recordsForViewer(now) },
  ];

  let total = 0;
  for (const { userId, rows } of batches) {
    for (const r of rows) {
      const { deletedAt, ...rest } = r;
      await prisma.record.create({
        data: {
          ...rest,
          userId,
          ...(deletedAt !== undefined && deletedAt !== null
            ? { deletedAt }
            : {}),
        },
      });
      total += 1;
    }
  }

  console.log(`✅ Created ${total} records across admin, analyst, and viewer`);
  console.log("\n📊 Seed summary (analysis / demo only):");
  console.log(`   Password for all seed users: ${password}`);
  console.log("   admin@equiledger.com     — ADMIN   — most records, 8 months of trends");
  console.log("   analyst@equiledger.com   — ANALYST — consulting + 1 soft-deleted expense");
  console.log("   viewer@equiledger.com    — VIEWER  — small personal set");
  console.log("   inactive@equiledger.com  — VIEWER  — inactive (cannot use API when enforced)");
  console.log("\n🎉 Seeding complete!");

  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
