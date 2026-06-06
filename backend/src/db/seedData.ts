import bcrypt from "bcryptjs";

import prisma from "../app/lib/prisma";
import { Role } from "../generated/prisma/enums";

// ─────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────

const adminData = {
  name: "Super Admin",
  email: "admin@taskflow.com",
  role: Role.ADMIN,
};

const projectManagerData = {
  name: "Project Manager",
  email: "manager@taskflow.com",
  role: Role.PROJECT_MANAGER,
};

const teamMemberData = {
  name: "Team Member",
  email: "member@taskflow.com",
  role: Role.TEAM_MEMBER,
};

// ─────────────────────────────────────────────

const seedData = async () => {
  const hashedPassword = await bcrypt.hash("123456", 10);

  try {
    // ── ADMIN ──────────────────────────────────
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN, email: adminData.email },
    });

    if (!admin) {
      const newAdmin = await prisma.user.create({
        data: {
          name: adminData.name,
          email: adminData.email,
          passwordHash: hashedPassword,
          role: adminData.role,
          isActive: true,
          validation: {
            create: { isVerified: true, otp: null, expiresAt: null },
          },
        },
      });
      console.log("✅ Admin created:", newAdmin.email);
    } else {
      console.log("ℹ️  Admin already exists.");
    }

    // ── PROJECT MANAGER ────────────────────────
    const manager = await prisma.user.findFirst({
      where: { role: Role.PROJECT_MANAGER, email: projectManagerData.email },
    });

    if (!manager) {
      const newManager = await prisma.user.create({
        data: {
          name: projectManagerData.name,
          email: projectManagerData.email,
          passwordHash: hashedPassword,
          role: projectManagerData.role,
          isActive: true,
          validation: {
            create: { isVerified: true, otp: null, expiresAt: null },
          },
        },
      });
      console.log("✅ Project Manager created:", newManager.email);
    } else {
      console.log("ℹ️  Project Manager already exists.");
    }

    // ── TEAM MEMBER ────────────────────────────
    const member = await prisma.user.findFirst({
      where: { role: Role.TEAM_MEMBER, email: teamMemberData.email },
    });

    if (!member) {
      const newMember = await prisma.user.create({
        data: {
          name: teamMemberData.name,
          email: teamMemberData.email,
          passwordHash: hashedPassword,
          role: teamMemberData.role,
          isActive: true,
          validation: {
            create: { isVerified: true, otp: null, expiresAt: null },
          },
        },
      });
      console.log("✅ Team Member created:", newMember.email);
    } else {
      console.log("ℹ️  Team Member already exists.");
    }

    console.log("\n🎉 Seeding completed successfully!");
    console.log("─────────────────────────────────────");
    console.log("Demo credentials (all passwords: 123456)");
    console.log(`Admin          → ${adminData.email}`);
    console.log(`Project Manager→ ${projectManagerData.email}`);
    console.log(`Team Member    → ${teamMemberData.email}`);
    console.log("─────────────────────────────────────");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw new Error("Seeding failed.");
  } finally {
    await prisma.$disconnect();
  }
};

export default seedData;
