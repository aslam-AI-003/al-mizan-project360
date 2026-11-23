import { PrismaClient, Role, WorkerType, ProjectStatus, AttendanceStatus, PaymentMode, ExpenseCategory, StageStatus, InventoryTxnType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Anchor "today" to the environment's current date so dashboard widgets
// (today's labour cost, today's purchases, etc.) show live-looking numbers.
const TODAY = new Date("2026-08-13T00:00:00.000Z");

function daysFrom(base: Date, offset: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

const PASSWORD = "Almizan@123";

const STAGE_NAMES = [
  "Planning",
  "Site Preparation",
  "Foundation",
  "Structure",
  "Brickwork",
  "Electrical",
  "Plumbing",
  "Plastering",
  "Flooring",
  "Painting",
  "Finishing",
  "Handover",
];

const WORK_CATEGORIES = [
  "Structural Work",
  "Brickwork",
  "Electrical Work",
  "Plumbing Work",
  "Plastering",
  "Flooring",
  "Painting",
  "Finishing Work",
  "Site Preparation",
];

const FIRST_NAMES = [
  "Suresh", "Ramesh", "Karthik", "Vijay", "Senthil", "Murugan", "Saravanan", "Prakash",
  "Gopal", "Anand", "Balaji", "Chandran", "Dinesh", "Elumalai", "Ganesan", "Hari",
  "Ilango", "Jayaraman", "Kannan", "Loganathan", "Manikandan", "Natarajan", "Palani",
  "Rajendran", "Selvam", "Thangaraj", "Velu", "Yogesh", "Arun", "Bhaskar",
];
const LAST_NAMES = [
  "Kumar", "Raj", "Subramanian", "Pillai", "Nair", "Gounder", "Naidu", "Iyer",
  "Chettiar", "Mudaliar", "Reddy", "Rajan", "Moorthy", "Sundaram", "Krishnan",
];

const MATERIAL_DEFS: { name: string; unit: string; category: string }[] = [
  { name: "Cement", unit: "bags", category: "Structural" },
  { name: "Steel (TMT Bars)", unit: "kg", category: "Structural" },
  { name: "Bricks", unit: "units", category: "Structural" },
  { name: "River Sand", unit: "units", category: "Structural" },
  { name: "Aggregate", unit: "units", category: "Structural" },
  { name: "Electrical Wiring & Fittings", unit: "sets", category: "Electrical" },
  { name: "Plumbing Pipes & Fittings", unit: "sets", category: "Plumbing" },
  { name: "Vitrified Tiles", unit: "boxes", category: "Finishing" },
  { name: "Emulsion Paint", unit: "litres", category: "Finishing" },
  { name: "Hardware & Fasteners", unit: "sets", category: "Finishing" },
];

async function main() {
  console.log("Seeding Al-Mizan Project360 demo data...");

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---------- Users ----------
  const owner = await prisma.user.create({
    data: {
      email: "admin@almizan.demo",
      passwordHash,
      name: "Ibrahim Al-Mizan",
      phone: "+91 98400 11001",
      role: Role.ADMIN,
    },
  });

  const supervisorDefs = [
    { email: "supervisor@almizan.demo", name: "Abdul Rahman", phone: "+91 98400 22001" },
    { email: "yasin.supervisor@almizan.demo", name: "Mohammed Yasin", phone: "+91 98400 22002" },
    { email: "karthik.supervisor@almizan.demo", name: "Karthik Subramanian", phone: "+91 98400 22003" },
    { email: "suresh.supervisor@almizan.demo", name: "Suresh Kumar", phone: "+91 98400 22004" },
  ];
  const supervisors = [];
  for (const s of supervisorDefs) {
    supervisors.push(
      await prisma.user.create({
        data: { ...s, passwordHash, role: Role.SUPERVISOR },
      })
    );
  }
  const [abdul, yasin, karthik, sureshSup] = supervisors;

  // ---------- Materials ----------
  const materials = [];
  for (const m of MATERIAL_DEFS) {
    materials.push(await prisma.material.create({ data: m }));
  }
  const [cement, steel, bricks, sand, , , , tiles, paint] = materials;

  // ---------- Projects ----------
  const projectDefs = [
    {
      name: "Ayyampettai Residence",
      siteAddress: "Plot 14, Ayyampettai Main Road, Thanjavur District, Tamil Nadu",
      description: "G+1 individual residence with modern elevation for the Kumar family.",
      clientName: "Rajesh Kumar",
      supervisor: abdul,
      budget: 2300000,
      contractValue: 2500000,
      startDate: daysFrom(TODAY, -190),
      expectedCompletionDate: daysFrom(TODAY, 125),
      status: ProjectStatus.IN_PROGRESS,
      overallProgress: 65,
    },
    {
      name: "Green Valley Apartments",
      siteAddress: "Survey No. 212, Mount Poonamallee Road, Porur, Chennai",
      description: "18-unit G+4 residential apartment complex with covered parking.",
      clientName: "Lakshmi Narayanan",
      supervisor: yasin,
      budget: 18000000,
      contractValue: 19500000,
      startDate: daysFrom(TODAY, -285),
      expectedCompletionDate: daysFrom(TODAY, 290),
      status: ProjectStatus.IN_PROGRESS,
      overallProgress: 40,
    },
    {
      name: "Sri Ranga Commercial Complex",
      siteAddress: "Bharathidasan Salai, Srirangam, Trichy",
      description: "3-floor commercial complex with 12 retail units and rooftop signage.",
      clientName: "Venkatesh Iyer",
      supervisor: karthik,
      budget: 9500000,
      contractValue: 10200000,
      startDate: daysFrom(TODAY, -80),
      expectedCompletionDate: daysFrom(TODAY, 320),
      status: ProjectStatus.STARTED,
      overallProgress: 15,
    },
    {
      name: "Meenakshi Enclave Villas",
      siteAddress: "Alagar Koil Road, Madurai",
      description: "Gated community of 6 independent villas, phase 1.",
      clientName: "Fathima Begum",
      supervisor: sureshSup,
      budget: 7000000,
      contractValue: 7500000,
      startDate: daysFrom(TODAY, -370),
      expectedCompletionDate: daysFrom(TODAY, -13),
      status: ProjectStatus.DELAYED,
      overallProgress: 55,
    },
    {
      name: "Coimbatore Tech Park Annex",
      siteAddress: "Avinashi Road, Coimbatore",
      description: "Annex block for an existing IT park campus — completed and handed over.",
      clientName: "Anitha Raj",
      supervisor: abdul,
      budget: 4200000,
      contractValue: 4500000,
      startDate: daysFrom(TODAY, -580),
      expectedCompletionDate: daysFrom(TODAY, -45),
      status: ProjectStatus.COMPLETED,
      overallProgress: 100,
    },
  ];

  const projects = [];
  for (const p of projectDefs) {
    const project = await prisma.project.create({
      data: {
        name: p.name,
        siteAddress: p.siteAddress,
        description: p.description,
        clientName: p.clientName,
        projectManager: "Ibrahim Al-Mizan",
        budget: p.budget,
        contractValue: p.contractValue,
        startDate: p.startDate,
        expectedCompletionDate: p.expectedCompletionDate,
        status: p.status,
        overallProgress: p.overallProgress,
      },
    });
    await prisma.projectSupervisor.create({
      data: { projectId: project.id, supervisorId: p.supervisor.id },
    });
    projects.push({ ...project, supervisor: p.supervisor, overallProgress: p.overallProgress, startDate: p.startDate, expectedCompletionDate: p.expectedCompletionDate });
  }

  // ---------- Progress stages per project ----------
  for (const project of projects) {
    const totalSpanDays = Math.max(
      1,
      Math.round((project.expectedCompletionDate.getTime() - project.startDate.getTime()) / 86400000)
    );
    const perStage = Math.floor(totalSpanDays / STAGE_NAMES.length);
    const completedStageCount = Math.round((project.overallProgress / 100) * STAGE_NAMES.length);

    for (let i = 0; i < STAGE_NAMES.length; i++) {
      const plannedStart = daysFrom(project.startDate, i * perStage);
      const plannedEnd = daysFrom(project.startDate, (i + 1) * perStage);
      let status: StageStatus = StageStatus.NOT_STARTED;
      let progressPercentage = 0;
      let actualStart: Date | null = null;
      let actualEnd: Date | null = null;

      if (i < completedStageCount) {
        status = StageStatus.COMPLETED;
        progressPercentage = 100;
        actualStart = plannedStart;
        actualEnd = project.status === ProjectStatus.DELAYED ? daysFrom(plannedEnd, rand(3, 10)) : plannedEnd;
      } else if (i === completedStageCount) {
        status = project.status === ProjectStatus.DELAYED ? StageStatus.DELAYED : StageStatus.IN_PROGRESS;
        progressPercentage = rand(20, 70);
        actualStart = plannedStart;
      }

      await prisma.progressStage.create({
        data: {
          projectId: project.id,
          name: STAGE_NAMES[i],
          order: i + 1,
          plannedStart,
          plannedEnd,
          actualStart,
          actualEnd,
          progressPercentage,
          status,
          remarks: status === StageStatus.IN_PROGRESS ? "Work in progress as per schedule." : null,
        },
      });
    }
  }

  // ---------- Inventory per project ----------
  const inventoryByProjectMaterial = new Map<string, string>(); // key `${projectId}:${materialId}` -> inventoryId
  for (const project of projects) {
    for (const material of materials) {
      const currentStock = rand(5, 150);
      const inv = await prisma.inventory.create({
        data: {
          projectId: project.id,
          materialId: material.id,
          currentStock,
          lowStockAt: 20,
        },
      });
      inventoryByProjectMaterial.set(`${project.id}:${material.id}`, inv.id);
      await prisma.inventoryTransaction.create({
        data: {
          projectId: project.id,
          materialId: material.id,
          type: InventoryTxnType.OPENING,
          quantity: currentStock,
          date: project.startDate,
          notes: "Opening stock",
        },
      });
    }
  }

  // ---------- Workers ----------
  const workerTypes = Object.values(WorkerType);
  const wageByType: Record<string, number> = {
    MASON: 900, HELPER: 600, CARPENTER: 850, ELECTRICIAN: 950,
    PLUMBER: 900, PAINTER: 750, WELDER: 900, OTHER: 650,
  };
  const workers = [];
  let workerSeq = 1;
  for (let p = 0; p < projects.length; p++) {
    const project = projects[p];
    const countForProject = 6;
    for (let i = 0; i < countForProject; i++) {
      const idx = workerSeq - 1;
      const type = pick(workerTypes, idx) as WorkerType;
      const name = `${pick(FIRST_NAMES, idx)} ${pick(LAST_NAMES, idx + 3)}`;
      const worker = await prisma.worker.create({
        data: {
          workerCode: `WRK-${String(workerSeq).padStart(3, "0")}`,
          name,
          mobile: `+91 91${String(500000 + workerSeq * 7).slice(0, 8)}`,
          workerType: type,
          dailyWage: wageByType[type],
          status: "ACTIVE",
          joiningDate: daysFrom(project.startDate, rand(0, 20)),
          projectId: project.id,
        },
      });
      workers.push({ ...worker, project });
      workerSeq++;
    }
  }

  // ---------- Attendance (last 10 days per worker) ----------
  const statusCycle: AttendanceStatus[] = [
    AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY, AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT, AttendanceStatus.OVERTIME, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
  ];
  for (const worker of workers) {
    for (let d = 9; d >= 0; d--) {
      const date = daysFrom(TODAY, -d);
      // Skip attendance for completed project after its completion date
      if (worker.project.status === ProjectStatus.COMPLETED && d < 5) continue;
      const status = pick(statusCycle, d + workerSeq);
      let wageAmount = 0;
      let overtimeHours = 0;
      if (status === AttendanceStatus.PRESENT) wageAmount = worker.dailyWage;
      else if (status === AttendanceStatus.HALF_DAY) wageAmount = worker.dailyWage / 2;
      else if (status === AttendanceStatus.OVERTIME) {
        overtimeHours = 2;
        wageAmount = worker.dailyWage + (worker.dailyWage / 8) * 2;
      } else wageAmount = 0;

      await prisma.workerAttendance.create({
        data: {
          workerId: worker.id,
          projectId: worker.projectId,
          date,
          status,
          overtimeHours,
          wageAmount,
        },
      });
    }
  }

  // ---------- Daily labour totals (what the Owner sees; no worker names) ----------
  const attendanceByDay = await prisma.workerAttendance.groupBy({
    by: ["projectId", "date"],
    where: { status: { not: AttendanceStatus.ABSENT } },
    _sum: { wageAmount: true },
    _count: true,
  });
  for (const row of attendanceByDay) {
    if (!row._sum.wageAmount) continue;
    await prisma.labourEntry.create({
      data: { projectId: row.projectId, date: row.date, workers: row._count, amount: row._sum.wageAmount, note: "Site labour" },
    });
  }

  // ---------- Worker payments (monthly, some paid/pending/partial) ----------
  const payModes: PaymentMode[] = [PaymentMode.CASH, PaymentMode.UPI, PaymentMode.BANK_TRANSFER];
  let paySeq = 0;
  for (const worker of workers) {
    const monthlyEarned = worker.dailyWage * 22;
    paySeq++;
    const paidFraction = pick([1, 1, 0.5, 0], paySeq);
    if (paidFraction > 0) {
      await prisma.workerPayment.create({
        data: {
          workerId: worker.id,
          projectId: worker.projectId,
          amount: Math.round(monthlyEarned * paidFraction),
          paymentDate: daysFrom(TODAY, -rand(2, 8)),
          mode: pick(payModes, paySeq),
          referenceNumber: `PAY-${String(1000 + paySeq)}`,
          remarks: paidFraction === 1 ? "Full month settlement" : "Partial advance settlement",
        },
      });
    }
  }

  // ---------- Material purchases (recorded directly by the supervisor) ----------
  const purchaseMaterials = [cement, steel, bricks, sand, tiles, paint];
  const vendorNames = ["ABC Traders", "TN Cement Agency", "Chennai Steel Corp", "Kaveri Sand Suppliers", "Madurai Tiles & Sanitary", "CBE Paints & Hardware"];
  const suppliers = [];
  for (const [i, name] of vendorNames.entries()) {
    suppliers.push(await prisma.supplier.create({ data: { name, phone: `+91 90031 1000${i + 1}` } }));
  }
  let purchaseSeq = 0;
  for (const project of projects) {
    for (let i = 0; i < 4; i++) {
      purchaseSeq++;
      const material = pick(purchaseMaterials, purchaseSeq);
      const rate = material.name === "Cement" ? 380 : material.name === "Steel (TMT Bars)" ? 62 : material.name === "Bricks" ? 8 : 45;
      const quantity = rand(20, 200);
      // Completed project: purchases fall before its last attendance day; others: within the last 10 days.
      const date = daysFrom(TODAY, project.status === ProjectStatus.COMPLETED ? -rand(5, 9) : -rand(0, 9));
      await prisma.purchase.create({
        data: {
          projectId: project.id,
          materialId: material.id,
          quantity,
          unit: material.unit,
          rate,
          totalAmount: quantity * rate,
          date,
          supplierId: pick(suppliers, purchaseSeq).id,
          billPhotoUrl: `https://picsum.photos/seed/bill-${purchaseSeq}/600/800`,
          remarks: "Required for ongoing site work.",
          createdById: owner.id,
        },
      });
      await prisma.inventory.update({
        where: { projectId_materialId: { projectId: project.id, materialId: material.id } },
        data: { currentStock: { increment: quantity } },
      });
      await prisma.inventoryTransaction.create({
        data: { projectId: project.id, materialId: material.id, type: InventoryTxnType.PURCHASE, quantity, date, notes: `Bought by ${project.supervisor.name}` },
      });
    }
  }

  // ---------- Supplier payments (some paid in full, some partly, some not at all) ----------
  for (const [i, supplier] of suppliers.entries()) {
    const bought = await prisma.purchase.aggregate({ where: { supplierId: supplier.id }, _sum: { totalAmount: true } });
    const total = bought._sum.totalAmount ?? 0;
    const fraction = [1, 0.5, 0, 0.75, 1, 0.3][i % 6];
    if (total > 0 && fraction > 0) {
      await prisma.supplierPayment.create({
        data: { supplierId: supplier.id, amount: Math.round(total * fraction), date: daysFrom(TODAY, -rand(0, 5)), mode: PaymentMode.UPI, note: "Seed payment" },
      });
    }
  }

  // ---------- Expenses ----------
  const expenseCategories = Object.values(ExpenseCategory);
  let expenseSeq = 0;
  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      expenseSeq++;
      const category = pick(expenseCategories, expenseSeq) as ExpenseCategory;
      const amount = rand(300, 8000);
      await prisma.expense.create({
        data: {
          projectId: project.id,
          category,
          amount,
          date: daysFrom(TODAY, project.status === ProjectStatus.COMPLETED ? -rand(5, 9) : -rand(0, 9)),
          description: `${category.replace("_", " ").toLowerCase()} expense at site`,
          paidBy: project.supervisor.name,
          paymentMode: pick(payModes, expenseSeq),
          receiptPhotoUrl: `https://picsum.photos/seed/receipt-${expenseSeq}/600/800`,
          createdById: project.supervisor.id,
        },
      });
    }
  }

  // ---------- Daily reports + photos ----------
  let reportSeq = 0;
  const workCompletedSamples = [
    "Ground floor column reinforcement completed.",
    "Roof slab shuttering work in progress.",
    "First floor brickwork completed on the east wing.",
    "Electrical conduit laying completed for ground floor.",
    "Plumbing rough-in completed for two bathrooms.",
    "External plastering completed for the front elevation.",
    "Flooring tiles laid in the living room and kitchen.",
    "Interior painting — first coat completed.",
    "Compound wall foundation excavation completed.",
    "Staircase casting completed and cured.",
  ];
  const tomorrowPlanSamples = [
    "Ground floor slab preparation.",
    "Continue brickwork on the west wing.",
    "Start electrical wiring for first floor.",
    "Begin plumbing fixture installation.",
    "Start interior plastering.",
    "Continue flooring work in bedrooms.",
    "Second coat of painting.",
    "Compound wall brickwork.",
  ];

  for (const project of projects) {
    const reportsForProject = project.status === ProjectStatus.COMPLETED ? 6 : 11;
    for (let i = 0; i < reportsForProject; i++) {
      reportSeq++;
      const date = daysFrom(TODAY, -(reportsForProject - i));
      const workersCount = rand(6, 16);
      const report = await prisma.dailyReport.create({
        data: {
          projectId: project.id,
          date,
          workCompleted: pick(workCompletedSamples, reportSeq),
          workCategory: pick(WORK_CATEGORIES, reportSeq),
          progressPercentage: Math.min(100, Math.round((project.overallProgress * (i + 1)) / reportsForProject)),
          workersCount,
          materialsUsed: JSON.stringify([
            { material: "Cement", quantity: rand(10, 30), unit: "bags" },
            { material: "Steel (TMT Bars)", quantity: rand(100, 400), unit: "kg" },
          ]),
          issues: reportSeq % 7 === 0 ? "Minor delay due to rain in the morning." : null,
          tomorrowPlan: pick(tomorrowPlanSamples, reportSeq),
          remarks: "Work progressing as per schedule.",
          createdById: project.supervisor.id,
        },
      });

      const photoCount = rand(2, 3);
      for (let ph = 0; ph < photoCount; ph++) {
        await prisma.projectPhoto.create({
          data: {
            projectId: project.id,
            dailyReportId: report.id,
            url: `https://picsum.photos/seed/almizan-${reportSeq}-${ph}/900/700`,
            caption: pick(workCompletedSamples, reportSeq + ph),
            workCategory: pick(WORK_CATEGORIES, reportSeq + ph),
            uploadedById: project.supervisor.id,
            createdAt: date,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password: Almizan@123):");
  console.log("  Owner: admin@almizan.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
