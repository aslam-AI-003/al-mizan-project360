import { PrismaClient, Role, WorkerType, ProjectStatus, AttendanceStatus, PaymentMode, PaymentStatus, PurchaseStatus, ExpenseCategory, ExpenseStatus, DailyReportStatus, StageStatus, IssuePriority, IssueStatus, MilestoneStatus, InventoryTxnType, ApprovalType, ApprovalStatus, BoqCategory } from "@prisma/client";
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
  const admin = await prisma.user.create({
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

  const clientDefs = [
    { email: "client@almizan.demo", name: "Rajesh Kumar", phone: "+91 98410 33001" },
    { email: "lakshmi.client@almizan.demo", name: "Lakshmi Narayanan", phone: "+91 98410 33002" },
    { email: "venkatesh.client@almizan.demo", name: "Venkatesh Iyer", phone: "+91 98410 33003" },
    { email: "fathima.client@almizan.demo", name: "Fathima Begum", phone: "+91 98410 33004" },
    { email: "anitha.client@almizan.demo", name: "Anitha Raj", phone: "+91 98410 33005" },
  ];
  const clients = [];
  for (const c of clientDefs) {
    clients.push(
      await prisma.user.create({
        data: { ...c, passwordHash, role: Role.CLIENT },
      })
    );
  }
  const [rajesh, lakshmi, venkatesh, fathima, anitha] = clients;

  // ---------- Materials ----------
  const materials = [];
  for (const m of MATERIAL_DEFS) {
    materials.push(await prisma.material.create({ data: m }));
  }
  const [cement, steel, bricks, sand, aggregate, electrical, plumbing, tiles, paint, hardware] = materials;

  // ---------- Suppliers ----------
  const supplierDefs = [
    { name: "ABC Traders", shopName: "ABC Traders", contactPerson: "Mohan Das", mobile: "+91 90031 10001", address: "Anna Salai, Thanjavur", materialsSupplied: "Cement, Steel, Aggregate" },
    { name: "Sri Balaji Hardware Mart", shopName: "Sri Balaji Hardware", contactPerson: "Balaji Raman", mobile: "+91 90031 10002", address: "Big Bazaar Street, Trichy", materialsSupplied: "Hardware, Fasteners, Tools" },
    { name: "Tamil Nadu Cement Agency", shopName: "TN Cement Agency", contactPerson: "Selvaraj K", mobile: "+91 90031 10003", address: "GST Road, Chennai", materialsSupplied: "Cement" },
    { name: "Chennai Steel Corporation", shopName: "Chennai Steel Corp", contactPerson: "Vignesh Rao", mobile: "+91 90031 10004", address: "Ambattur Industrial Estate, Chennai", materialsSupplied: "TMT Steel Bars" },
    { name: "SPB Electricals", shopName: "SPB Electricals", contactPerson: "Prabhu S", mobile: "+91 90031 10005", address: "East Car Street, Madurai", materialsSupplied: "Electrical Wiring & Fittings" },
    { name: "Kaveri Sand Suppliers", shopName: "Kaveri Sand Suppliers", contactPerson: "Muthu Kumar", mobile: "+91 90031 10006", address: "Kaveri Bank Road, Thanjavur", materialsSupplied: "River Sand, Aggregate" },
    { name: "Madurai Tiles & Sanitary", shopName: "Madurai Tiles & Sanitary", contactPerson: "Ravichandran", mobile: "+91 90031 10007", address: "West Masi Street, Madurai", materialsSupplied: "Vitrified Tiles, Sanitaryware" },
    { name: "Coimbatore Paints & Hardware", shopName: "CBE Paints & Hardware", contactPerson: "Kannan V", mobile: "+91 90031 10008", address: "Cross Cut Road, Coimbatore", materialsSupplied: "Paint, Hardware" },
    { name: "Trichy Plumbing Solutions", shopName: "Trichy Plumbing Solutions", contactPerson: "Iqbal Ahmed", mobile: "+91 90031 10009", address: "Thillai Nagar, Trichy", materialsSupplied: "Plumbing Pipes & Fittings" },
    { name: "Anna Nagar Building Materials", shopName: "Anna Nagar Building Materials", contactPerson: "Ganesh Babu", mobile: "+91 90031 10010", address: "Anna Nagar, Chennai", materialsSupplied: "Cement, Bricks, Aggregate" },
  ];
  const suppliers = [];
  for (const s of supplierDefs) {
    suppliers.push(await prisma.supplier.create({ data: s }));
  }

  // ---------- Projects ----------
  const projectDefs = [
    {
      name: "Ayyampettai Residence",
      siteAddress: "Plot 14, Ayyampettai Main Road, Thanjavur District, Tamil Nadu",
      description: "G+1 individual residence with modern elevation for the Kumar family.",
      client: rajesh,
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
      client: lakshmi,
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
      client: venkatesh,
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
      client: fathima,
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
      client: anitha,
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
        clientId: p.client.id,
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
    projects.push({ ...project, supervisor: p.supervisor, client: p.client, overallProgress: p.overallProgress, startDate: p.startDate, expectedCompletionDate: p.expectedCompletionDate });
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

  // ---------- BOQ ----------
  for (const project of projects) {
    const scale = project.budget / 2300000;
    const boqRows: { category: BoqCategory; itemName: string; materialId?: string; estimatedQty: number; estimatedRate: number }[] = [
      { category: BoqCategory.MATERIAL, itemName: "Cement", materialId: cement.id, estimatedQty: Math.round(600 * scale), estimatedRate: 380 },
      { category: BoqCategory.MATERIAL, itemName: "Steel (TMT Bars)", materialId: steel.id, estimatedQty: Math.round(12000 * scale), estimatedRate: 62 },
      { category: BoqCategory.MATERIAL, itemName: "Bricks", materialId: bricks.id, estimatedQty: Math.round(40000 * scale), estimatedRate: 8 },
      { category: BoqCategory.MATERIAL, itemName: "Vitrified Tiles", materialId: tiles.id, estimatedQty: Math.round(4000 * scale), estimatedRate: 55 },
      { category: BoqCategory.LABOUR, itemName: "Mason & Helper Labour", estimatedQty: Math.round(1800 * scale), estimatedRate: 850 },
      { category: BoqCategory.LABOUR, itemName: "Electrical & Plumbing Labour", estimatedQty: Math.round(400 * scale), estimatedRate: 900 },
    ];
    for (const row of boqRows) {
      const estimatedCost = row.estimatedQty * row.estimatedRate;
      const progressFactor = project.overallProgress / 100;
      const actualQty = Math.round(row.estimatedQty * progressFactor * (0.9 + Math.random() * 0.2));
      const actualCost = Math.round(actualQty * row.estimatedRate * (0.95 + Math.random() * 0.15));
      await prisma.boqItem.create({
        data: {
          projectId: project.id,
          category: row.category,
          itemName: row.itemName,
          materialId: row.materialId,
          estimatedQty: row.estimatedQty,
          estimatedRate: row.estimatedRate,
          estimatedCost,
          actualQty,
          actualCost,
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

  // ---------- Purchases ----------
  const purchaseMaterials = [cement, steel, bricks, sand, tiles, paint];
  const purchaseStatuses: PurchaseStatus[] = [
    PurchaseStatus.SUBMITTED, PurchaseStatus.APPROVED, PurchaseStatus.PURCHASED,
    PurchaseStatus.PAID, PurchaseStatus.SUBMITTED, PurchaseStatus.DRAFT,
  ];
  let purchaseSeq = 0;
  const purchases = [];
  for (const project of projects) {
    for (let i = 0; i < 4; i++) {
      purchaseSeq++;
      const material = pick(purchaseMaterials, purchaseSeq);
      const supplier = pick(suppliers, purchaseSeq);
      const rate = material.name === "Cement" ? 380 : material.name === "Steel (TMT Bars)" ? 62 : material.name === "Bricks" ? 8 : 45;
      const quantity = rand(20, 200);
      const status = pick(purchaseStatuses, purchaseSeq);
      const purchase = await prisma.purchase.create({
        data: {
          projectId: project.id,
          supplierId: supplier.id,
          materialId: material.id,
          quantity,
          unit: material.unit,
          rate,
          totalAmount: quantity * rate,
          requiredDate: daysFrom(TODAY, rand(1, 10)),
          billPhotoUrl: status === PurchaseStatus.PURCHASED || status === PurchaseStatus.PAID ? `https://picsum.photos/seed/bill-${purchaseSeq}/600/800` : null,
          status,
          remarks: "Required for ongoing site work.",
          requestedById: project.supervisor.id,
          approvedById: status === PurchaseStatus.DRAFT || status === PurchaseStatus.SUBMITTED ? null : admin.id,
        },
      });
      purchases.push({ ...purchase, project });
    }
  }

  // Pending approvals list should have real teeth: create Approval rows for SUBMITTED purchases
  for (const purchase of purchases.filter((p) => p.status === PurchaseStatus.SUBMITTED)) {
    await prisma.approval.create({
      data: {
        type: ApprovalType.PURCHASE,
        refId: purchase.id,
        refLabel: `Purchase request — ${purchase.quantity} units for ${purchase.project.name}`,
        status: ApprovalStatus.PENDING,
      },
    });
  }

  // ---------- Supplier payments ----------
  let supplierPaySeq = 0;
  for (const purchase of purchases.filter((p) => p.status === PurchaseStatus.PURCHASED || p.status === PurchaseStatus.PAID)) {
    supplierPaySeq++;
    const paidAmount = purchase.status === PurchaseStatus.PAID ? purchase.totalAmount : purchase.totalAmount * 0.6;
    await prisma.supplierPayment.create({
      data: {
        supplierId: purchase.supplierId,
        projectId: purchase.projectId,
        invoiceNumber: `INV-${String(2000 + supplierPaySeq)}`,
        invoiceAmount: purchase.totalAmount,
        paidAmount,
        paymentDate: daysFrom(TODAY, -rand(1, 15)),
        paymentMode: pick(payModes, supplierPaySeq),
        referenceNumber: `REF-${String(3000 + supplierPaySeq)}`,
      },
    });
  }

  // ---------- Expenses ----------
  const expenseCategories = Object.values(ExpenseCategory);
  let expenseSeq = 0;
  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      expenseSeq++;
      const category = pick(expenseCategories, expenseSeq) as ExpenseCategory;
      const amount = rand(300, 8000);
      const status = expenseSeq % 5 === 0 ? ExpenseStatus.SUBMITTED : ExpenseStatus.APPROVED;
      const expense = await prisma.expense.create({
        data: {
          projectId: project.id,
          category,
          amount,
          date: daysFrom(TODAY, -rand(0, 9)),
          description: `${category.replace("_", " ").toLowerCase()} expense at site`,
          paidBy: project.supervisor.name,
          paymentMode: pick(payModes, expenseSeq),
          receiptPhotoUrl: `https://picsum.photos/seed/receipt-${expenseSeq}/600/800`,
          status,
          createdById: project.supervisor.id,
        },
      });
      if (status === ExpenseStatus.SUBMITTED) {
        await prisma.approval.create({
          data: {
            type: ApprovalType.EXPENSE,
            refId: expense.id,
            refLabel: `${category.replace("_", " ")} expense — ${formatAmountLabel(amount)} for ${project.name}`,
            status: ApprovalStatus.PENDING,
          },
        });
      }
    }
  }

  // ---------- Petty cash ----------
  for (const project of projects) {
    await prisma.pettyCash.create({
      data: {
        projectId: project.id,
        supervisorId: project.supervisor.id,
        openingBalance: 50000,
        date: daysFrom(TODAY, -20),
        settled: project.status === ProjectStatus.COMPLETED,
      },
    });
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
      const status = i === reportsForProject - 1 && project.status !== ProjectStatus.COMPLETED
        ? DailyReportStatus.SUBMITTED
        : DailyReportStatus.APPROVED;
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
          status,
          createdById: project.supervisor.id,
          approvedById: status === DailyReportStatus.APPROVED ? admin.id : null,
          approvedAt: status === DailyReportStatus.APPROVED ? date : null,
        },
      });

      if (status === DailyReportStatus.SUBMITTED) {
        await prisma.approval.create({
          data: {
            type: ApprovalType.DAILY_REPORT,
            refId: report.id,
            refLabel: `Daily report — ${project.name} (${date.toDateString()})`,
            status: ApprovalStatus.PENDING,
          },
        });
      }

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

  // ---------- Project documents ----------
  const docTypes = [
    { name: "Signed Agreement", type: "Agreement", visible: true },
    { name: "Cost Estimate", type: "Estimate", visible: true },
    { name: "Approved Building Plan", type: "Approved Plan", visible: true },
    { name: "Internal Site Survey Notes", type: "Other", visible: false },
  ];
  for (const project of projects) {
    for (const doc of docTypes) {
      await prisma.projectDocument.create({
        data: {
          projectId: project.id,
          name: doc.name,
          type: doc.type,
          url: `https://picsum.photos/seed/doc-${project.id}-${doc.type}/800/1100`,
          visibleToClient: doc.visible,
        },
      });
    }
  }

  // ---------- Payment milestones + client payments ----------
  const milestoneNames = ["Foundation", "Structure", "Brickwork", "Finishing", "Handover"];
  for (const project of projects) {
    const perMilestone = project.contractValue / milestoneNames.length;
    const paidMilestoneCount = Math.round((project.overallProgress / 100) * milestoneNames.length);
    for (let i = 0; i < milestoneNames.length; i++) {
      const isPaid = i < paidMilestoneCount;
      const milestone = await prisma.paymentMilestone.create({
        data: {
          projectId: project.id,
          name: milestoneNames[i],
          amount: Math.round(perMilestone),
          dueDate: daysFrom(project.startDate, (i + 1) * 60),
          status: isPaid ? MilestoneStatus.PAID : i === paidMilestoneCount ? MilestoneStatus.DUE : MilestoneStatus.PENDING,
          paidDate: isPaid ? daysFrom(project.startDate, (i + 1) * 55) : null,
          referenceNumber: isPaid ? `MS-${project.id.slice(-4)}-${i}` : null,
          order: i,
        },
      });
      if (isPaid) {
        await prisma.clientPayment.create({
          data: {
            projectId: project.id,
            amount: milestone.amount,
            date: milestone.paidDate!,
            mode: PaymentMode.BANK_TRANSFER,
            referenceNumber: milestone.referenceNumber,
            remarks: `${milestone.name} milestone payment`,
          },
        });
      }
    }
  }

  // ---------- Issues ----------
  const issueSamples = [
    { title: "Water seepage near bathroom wall", priority: IssuePriority.HIGH },
    { title: "Delay in cement delivery", priority: IssuePriority.MEDIUM },
    { title: "Crack observed in compound wall", priority: IssuePriority.CRITICAL },
    { title: "Electrician not available on site", priority: IssuePriority.LOW },
  ];
  for (const project of projects) {
    const issue = pick(issueSamples, projects.indexOf(project));
    await prisma.issue.create({
      data: {
        projectId: project.id,
        title: issue.title,
        description: `${issue.title} reported at ${project.name}. Needs review and resolution plan.`,
        priority: issue.priority,
        photoUrl: `https://picsum.photos/seed/issue-${project.id}/700/500`,
        assignedToId: admin.id,
        reportedById: project.supervisor.id,
        status: project.status === ProjectStatus.COMPLETED ? IssueStatus.RESOLVED : IssueStatus.OPEN,
        resolution: project.status === ProjectStatus.COMPLETED ? "Resolved before handover." : null,
        resolvedAt: project.status === ProjectStatus.COMPLETED ? daysFrom(TODAY, -60) : null,
      },
    });
  }

  // ---------- Notifications ----------
  for (const project of projects) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "DAILY_REPORT",
        title: "New daily report submitted",
        message: `${project.supervisor.name} submitted a daily report for ${project.name}.`,
        link: `/admin/projects/${project.id}?tab=daily-updates`,
        read: false,
      },
    });
    await prisma.notification.create({
      data: {
        userId: project.client.id,
        type: "PROGRESS_UPDATE",
        title: "New progress update",
        message: `New photos and progress update available for ${project.name}.`,
        link: `/client`,
        read: false,
      },
    });
  }

  // ---------- Audit logs ----------
  const auditSamples = [
    { user: abdul, action: "SUBMITTED", description: "Supervisor Abdul Rahman submitted a daily report" },
    { user: admin, action: "APPROVED", description: "Admin Ibrahim Al-Mizan approved a purchase request" },
    { user: admin, action: "RECORDED_PAYMENT", description: "₹2,50,000 supplier payment recorded" },
    { user: admin, action: "UPDATED_PAYMENT", description: "Client payment status updated" },
  ];
  for (const a of auditSamples) {
    await prisma.auditLog.create({
      data: {
        userId: a.user.id,
        action: a.action,
        entityType: "SYSTEM",
        entityId: "seed",
        description: a.description,
        createdAt: daysFrom(TODAY, -rand(1, 8)),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password: Almizan@123):");
  console.log("  Admin:      admin@almizan.demo");
  console.log("  Supervisor: supervisor@almizan.demo (Abdul Rahman — Ayyampettai Residence)");
  console.log("  Client:     client@almizan.demo (Rajesh Kumar — Ayyampettai Residence)");
}

function formatAmountLabel(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
