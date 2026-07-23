import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const busi = await prisma.department.upsert({
    where: { departmentCode: "BUSI" },
    update: {},
    create: {
      collegeName: "경영대학",
      departmentCode: "BUSI",
      departmentName: "경영학과",
      officeEmail: "busi@univ.ac.kr",
    },
  });

  const eng = await prisma.department.upsert({
    where: { departmentCode: "COMP" },
    update: {},
    create: {
      collegeName: "공과대학",
      departmentCode: "COMP",
      departmentName: "컴퓨터공학과",
      officeEmail: "comp@univ.ac.kr",
    },
  });

  const design = await prisma.department.upsert({
    where: { departmentCode: "DESN" },
    update: {},
    create: {
      collegeName: "예술대학",
      departmentCode: "DESN",
      departmentName: "디자인학과",
      officeEmail: "desn@univ.ac.kr",
    },
  });

  const studentEnrolled = await prisma.student.upsert({
    where: { studentNo: "202312345" },
    update: {},
    create: {
      studentNo: "202312345",
      name: "김창업",
      departmentId: busi.id,
      studentStatus: "ENROLLED",
      admissionYear: 2023,
      email: "student@univ.ac.kr",
      phone: "010-1111-2222",
      dataSource: "SELF_REPORT",
    },
  });

  const studentGrad = await prisma.student.upsert({
    where: { studentNo: "201911111" },
    update: {},
    create: {
      studentNo: "201911111",
      name: "이졸업",
      departmentId: eng.id,
      studentStatus: "GRADUATED",
      admissionYear: 2019,
      graduationYear: 2025,
      email: "grad@univ.ac.kr",
      dataSource: "SURVEY",
    },
  });

  const studentGrad2 = await prisma.student.upsert({
    where: { studentNo: "202022222" },
    update: {},
    create: {
      studentNo: "202022222",
      name: "박취업",
      departmentId: busi.id,
      studentStatus: "GRADUATED",
      admissionYear: 2020,
      graduationYear: 2025,
      email: "employed@univ.ac.kr",
      dataSource: "SURVEY",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@univ.ac.kr" },
    update: { passwordHash },
    create: {
      loginId: "admin",
      email: "admin@univ.ac.kr",
      name: "시스템관리자",
      roleCode: "ADMIN",
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "center@univ.ac.kr" },
    update: { passwordHash },
    create: {
      loginId: "center",
      email: "center@univ.ac.kr",
      name: "센터담당자",
      roleCode: "CENTER_STAFF",
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "dept@univ.ac.kr" },
    update: { passwordHash, departmentId: busi.id },
    create: {
      loginId: "dept_busi",
      email: "dept@univ.ac.kr",
      name: "경영학과담당",
      roleCode: "DEPT_STAFF",
      departmentId: busi.id,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "student@univ.ac.kr" },
    update: { passwordHash, studentId: studentEnrolled.id },
    create: {
      loginId: "202312345",
      email: "student@univ.ac.kr",
      name: "김창업",
      roleCode: "STUDENT",
      departmentId: busi.id,
      studentId: studentEnrolled.id,
      passwordHash,
    },
  });

  const company = await prisma.company.upsert({
    where: { businessRegistrationNo: "1234567890" },
    update: {},
    create: {
      companyName: "캠퍼스스타트업",
      businessRegistrationNo: "1234567890",
      representativeName: "김창업",
      industry: "정보통신업",
      businessType: "소프트웨어 개발",
      address: "서울시 관악구",
      foundedDate: new Date("2024-05-01"),
      businessStatus: "OPERATING",
      revenue: 50000000,
      capital: 10000000,
      employeeCount: 3,
      completenessScore: 80,
    },
  });

  const center = await prisma.user.findUniqueOrThrow({
    where: { email: "center@univ.ac.kr" },
  });

  await prisma.founderCompany.upsert({
    where: {
      studentId_companyId: {
        studentId: studentEnrolled.id,
        companyId: company.id,
      },
    },
    update: {},
    create: {
      studentId: studentEnrolled.id,
      companyId: company.id,
      founderRole: "CEO",
      pipelineStatus: "INFO_CHECKING",
      verificationStatus: "SUBMITTED",
      registeredByUserId: center.id,
    },
  });

  await prisma.submission.create({
    data: {
      studentId: studentEnrolled.id,
      companyId: company.id,
      channel: "CENTER_INPUT",
      reviewStatus: "SUBMITTED",
      createdByUserId: center.id,
      submittedAt: new Date(),
    },
  });

  const programCount = await prisma.program.count();
  if (programCount === 0) {
    await prisma.program.createMany({
      data: [
        {
          name: "재학생 창업동아리 지원",
          description: "재학생 대상 창업동아리 운영비 지원",
          targetStatuses: "ENROLLED,LEAVE",
          industryKeywords: "전체",
          applyUrl: "https://example.com/club",
          applyStartDate: new Date("2026-01-01"),
          applyEndDate: new Date("2026-12-31"),
          isActive: true,
        },
        {
          name: "IT 창업 멘토링",
          description: "정보통신·SW 업종 멘토링",
          targetStatuses: "ENROLLED,GRADUATED",
          industryKeywords: "정보통신,소프트웨어,IT",
          applyUrl: "https://example.com/it-mentor",
          applyStartDate: new Date("2026-01-01"),
          applyEndDate: new Date("2026-12-31"),
          isActive: true,
        },
        {
          name: "졸업생 후속지원 패키지",
          description: "졸업 후 창업자 대상 공간·컨설팅",
          targetStatuses: "GRADUATED",
          industryKeywords: "전체",
          applyUrl: "https://example.com/alumni",
          applyStartDate: new Date("2026-01-01"),
          applyEndDate: new Date("2026-12-31"),
          isActive: true,
        },
      ],
    });
  }

  const studentMisc = await prisma.student.upsert({
    where: { studentNo: "202033333" },
    update: {},
    create: {
      studentNo: "202033333",
      name: "최미상",
      departmentId: design.id,
      studentStatus: "GRADUATED",
      graduationYear: 2025,
      dataSource: "SURVEY",
    },
  });

  let campaign = await prisma.campaign.findFirst({
    where: { title: "2025학년도 졸업자 창업 조사" },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        title: "2025학년도 졸업자 창업 조사",
        description: "취업률 조사 연계 졸업자 현황",
        status: "OPEN",
        startDate: new Date("2026-01-01"),
        dueDate: new Date("2026-12-31"),
        targets: {
          create: [
            { studentId: studentGrad.id, status: "NOT_STARTED" },
            { studentId: studentGrad2.id, status: "NOT_STARTED" },
            { studentId: studentMisc.id, status: "NOT_STARTED" },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("Accounts (password: password123):");
  console.log("  admin@univ.ac.kr / ADMIN");
  console.log("  center@univ.ac.kr / CENTER_STAFF");
  console.log("  dept@univ.ac.kr / DEPT_STAFF (경영학과)");
  console.log("  student@univ.ac.kr / STUDENT");
  console.log("Campaign:", campaign.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
