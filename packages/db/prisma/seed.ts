import { PrismaClient, UserStatus, UomFormulaType, GoalSheetStatus, GoalStatus, CheckinStatus, QuarterPeriod, NotificationType, AuditEntityType, EscalationStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');
  
  // 1. Roles
  const superAdminRole = await prisma.role.upsert({
    where: { roleName: 'SUPER_ADMIN' },
    update: {},
    create: { roleName: 'SUPER_ADMIN' }
  });
  const adminHrRole = await prisma.role.upsert({
    where: { roleName: 'ADMIN_HR' },
    update: {},
    create: { roleName: 'ADMIN_HR' }
  });
  const managerL1Role = await prisma.role.upsert({
    where: { roleName: 'MANAGER_L1' },
    update: {},
    create: { roleName: 'MANAGER_L1' }
  });
  const employeeRole = await prisma.role.upsert({
    where: { roleName: 'EMPLOYEE' },
    update: {},
    create: { roleName: 'EMPLOYEE' }
  });

  // 2. Permissions (partial list as per specs)
  const permissionsList = [
    'CREATE_GOAL', 'SUBMIT_GOAL', 'APPROVE_GOAL', 'RETURN_GOAL', 'UNLOCK_GOAL', 
    'LOG_CHECKIN', 'VIEW_TEAM_GOALS', 'VIEW_ANALYTICS', 'MANAGE_CYCLES', 
    'PUSH_SHARED_GOAL', 'VIEW_AUDIT_LOGS', 'MANAGE_USERS', 'EXPORT_REPORTS'
  ];
  
  const allPermissions = [];
  for (const p of permissionsList) {
    const permission = await prisma.permission.upsert({
      where: { permissionKey: p },
      update: {},
      create: { permissionKey: p, description: p.replace('_', ' ') }
    });
    allPermissions.push(permission);
  }

  const permissionMap = Object.fromEntries(allPermissions.map((p) => [p.permissionKey, p.id]));
  const rolePermissionAssignments = [
    { roleName: 'EMPLOYEE', keys: ['CREATE_GOAL', 'SUBMIT_GOAL', 'LOG_CHECKIN'] },
    {
      roleName: 'MANAGER_L1',
      keys: [
        'CREATE_GOAL', 'SUBMIT_GOAL', 'APPROVE_GOAL', 'RETURN_GOAL',
        'LOG_CHECKIN', 'VIEW_TEAM_GOALS', 'VIEW_ANALYTICS',
        'PUSH_SHARED_GOAL', 'VIEW_AUDIT_LOGS',
      ],
    },
    {
      roleName: 'ADMIN_HR',
      keys: [
        'CREATE_GOAL', 'SUBMIT_GOAL', 'APPROVE_GOAL', 'RETURN_GOAL',
        'UNLOCK_GOAL', 'LOG_CHECKIN', 'VIEW_TEAM_GOALS', 'VIEW_ANALYTICS',
        'MANAGE_CYCLES', 'PUSH_SHARED_GOAL', 'VIEW_AUDIT_LOGS',
        'MANAGE_USERS', 'EXPORT_REPORTS',
      ],
    },
    { roleName: 'SUPER_ADMIN', keys: Object.keys(permissionMap) },
  ];

  for (const { roleName, keys } of rolePermissionAssignments) {
    const role = await prisma.role.findUnique({ where: { roleName } });
    if (!role) continue;
    await prisma.rolePermission.createMany({
      data: keys
        .filter((key) => permissionMap[key])
        .map((key) => ({ roleId: role.id, permissionId: permissionMap[key] })),
      skipDuplicates: true,
    });
  }

  // 3. Departments
  const engDept = await prisma.department.create({
    data: { name: 'Engineering' }
  });
  const backendDept = await prisma.department.create({
    data: { name: 'Backend', parentDepartmentId: engDept.id }
  });
  const frontendDept = await prisma.department.create({
    data: { name: 'Frontend', parentDepartmentId: engDept.id }
  });

  // 4. Goal Cycle
  const currentYear = new Date().getFullYear();
  const cycle = await prisma.goalCycle.create({
    data: {
      name: `${currentYear} Annual Goals`,
      year: currentYear,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      status: 'OPEN'
    }
  });

  // Check-in windows
  await prisma.checkinWindow.createMany({
    data: [
      { cycleId: cycle.id, quarter: 'Q1', opensAt: new Date(`${currentYear}-03-15`), closesAt: new Date(`${currentYear}-04-15`) },
      { cycleId: cycle.id, quarter: 'Q2', opensAt: new Date(`${currentYear}-06-15`), closesAt: new Date(`${currentYear}-07-15`), isActive: true },
      { cycleId: cycle.id, quarter: 'Q3', opensAt: new Date(`${currentYear}-09-15`), closesAt: new Date(`${currentYear}-10-15`) },
      { cycleId: cycle.id, quarter: 'Q4_ANNUAL', opensAt: new Date(`${currentYear}-12-15`), closesAt: new Date(`${currentYear + 1}-01-15`) },
    ]
  });

  // 5. UOM Types
  const uomTypeSeeds = [
    { name: 'Numeric (Min)', formulaType: UomFormulaType.MIN },
    { name: 'Numeric (Max)', formulaType: UomFormulaType.MAX },
    { name: 'Timeline', formulaType: UomFormulaType.TIMELINE },
    { name: 'Zero-based', formulaType: UomFormulaType.ZERO },
  ];
  for (const u of uomTypeSeeds) {
    await prisma.uomType.upsert({
      where: { name: u.name },
      update: {},
      create: u
    });
  }

  // 6. Thrust Areas
  const thrustAreaSeeds = ['Revenue Growth', 'Customer Success', 'Operational Excellence', 'People Development', 'Innovation', 'Compliance & Safety'];
  for (const t of thrustAreaSeeds) {
    await prisma.thrustArea.create({ data: { name: t } });
  }

  // 7. Users
  // Password for all: AtomPulse@2025 -> you would use bcrypt here for the hash in real app
  // For now using a dummy hash, backend will handle auth
  const dummyHash = '$2b$10$xyz123abc987def456'; 

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atompulse.com' },
    update: {},
    create: {
      employeeCode: 'EMP-001',
      name: 'System Admin',
      email: 'admin@atompulse.com',
      passwordHash: dummyHash,
      departmentId: engDept.id,
      roleId: superAdminRole.id
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@atompulse.com' },
    update: {},
    create: {
      employeeCode: 'EMP-002',
      name: 'Ravi Sharma',
      email: 'manager@atompulse.com',
      passwordHash: dummyHash,
      departmentId: backendDept.id,
      roleId: managerL1Role.id
    }
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@atompulse.com' },
    update: {},
    create: {
      employeeCode: 'EMP-003',
      name: 'Arjun K.',
      email: 'employee@atompulse.com',
      passwordHash: dummyHash,
      departmentId: backendDept.id,
      roleId: employeeRole.id,
      managerId: manager.id
    }
  });

  const salesDept = await prisma.department.findFirst({ where: { name: 'Sales' } }) || await prisma.department.create({ data: { name: 'Sales' } });
  const operationsDept = await prisma.department.findFirst({ where: { name: 'Operations' } }) || await prisma.department.create({ data: { name: 'Operations' } });
  const customerSuccessDept = await prisma.department.findFirst({ where: { name: 'Customer Success' } }) || await prisma.department.create({ data: { name: 'Customer Success' } });
  const financeDept = await prisma.department.findFirst({ where: { name: 'Finance' } }) || await prisma.department.create({ data: { name: 'Finance' } });
  const peopleOpsDept = await prisma.department.findFirst({ where: { name: 'People Operations' } }) || await prisma.department.create({ data: { name: 'People Operations' } });
  const complianceDept = await prisma.department.findFirst({ where: { name: 'Compliance' } }) || await prisma.department.create({ data: { name: 'Compliance' } });

  const ensureUser = async (data: {
    employeeCode: string;
    name: string;
    email: string;
    departmentId: string;
    roleId: string;
    managerId?: string | null;
    avatarUrl?: string | null;
  }) => {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { employeeCode: data.employeeCode }],
      },
    });

    if (existing) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          email: data.email,
          employeeCode: data.employeeCode,
          departmentId: data.departmentId,
          roleId: data.roleId,
          managerId: data.managerId ?? null,
          avatarUrl: data.avatarUrl ?? null,
          passwordHash: dummyHash,
          status: UserStatus.ACTIVE,
        },
      });
    }

    return prisma.user.create({
      data: {
        ...data,
        passwordHash: dummyHash,
        status: UserStatus.ACTIVE,
      },
    });
  };

  const hrAdmin = await ensureUser({
    employeeCode: 'EMP-004',
    name: 'Maya Nair',
    email: 'hr.admin@atompulse.com',
    departmentId: peopleOpsDept.id,
    roleId: adminHrRole.id,
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Maya%20Nair',
  });

  const salesManager = await ensureUser({
    employeeCode: 'EMP-005',
    name: 'Rohan Desai',
    email: 'sales.manager@atompulse.com',
    departmentId: salesDept.id,
    roleId: managerL1Role.id,
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Rohan%20Desai',
  });

  const operationsManager = await ensureUser({
    employeeCode: 'EMP-006',
    name: 'Sana Verma',
    email: 'ops.manager@atompulse.com',
    departmentId: operationsDept.id,
    roleId: managerL1Role.id,
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sana%20Verma',
  });

  const demoEmployees = [
    { employeeCode: 'EMP-007', name: 'Ayesha Khan', email: 'ayesha.khan@atompulse.com', departmentId: salesDept.id, managerId: salesManager.id },
    { employeeCode: 'EMP-008', name: 'Nikhil Rao', email: 'nikhil.rao@atompulse.com', departmentId: salesDept.id, managerId: salesManager.id },
    { employeeCode: 'EMP-009', name: 'Priyanka Sethi', email: 'priyanka.sethi@atompulse.com', departmentId: operationsDept.id, managerId: operationsManager.id },
    { employeeCode: 'EMP-010', name: 'Daniel Brooks', email: 'daniel.brooks@atompulse.com', departmentId: operationsDept.id, managerId: operationsManager.id },
    { employeeCode: 'EMP-011', name: 'Meera Iyer', email: 'meera.iyer@atompulse.com', departmentId: customerSuccessDept.id, managerId: manager.id },
    { employeeCode: 'EMP-012', name: 'Arun Patel', email: 'arun.patel@atompulse.com', departmentId: customerSuccessDept.id, managerId: manager.id },
    { employeeCode: 'EMP-013', name: 'Kavya Menon', email: 'kavya.menon@atompulse.com', departmentId: financeDept.id, managerId: hrAdmin.id },
    { employeeCode: 'EMP-014', name: 'Vikram Singh', email: 'vikram.singh@atompulse.com', departmentId: complianceDept.id, managerId: hrAdmin.id },
    { employeeCode: 'EMP-015', name: 'Elena Shah', email: 'elena.shah@atompulse.com', departmentId: frontendDept.id, managerId: manager.id },
    { employeeCode: 'EMP-016', name: 'Tariq Ahmed', email: 'tariq.ahmed@atompulse.com', departmentId: backendDept.id, managerId: manager.id },
  ];

  const demoUserRecords = [] as Array<typeof employee>;
  for (const person of demoEmployees) {
    const user = await ensureUser({
      ...person,
      roleId: employeeRole.id,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(person.name)}`,
    });
    demoUserRecords.push(user);
  }

  const uomTypeRecords = await prisma.uomType.findMany();
  const uomByName = uomTypeRecords.reduce<Record<string, (typeof uomTypeRecords)[number]>>((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {});
  const thrustAreaRecords = await prisma.thrustArea.findMany();
  const thrustByName = thrustAreaRecords.reduce<Record<string, (typeof thrustAreaRecords)[number]>>((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {});

  const computeProgress = (formulaType: UomFormulaType, target: number, actual: number) => {
    if (!target) return 0;
    if (formulaType === UomFormulaType.MIN) return Math.min((actual / target) * 100, 100);
    if (formulaType === UomFormulaType.MAX) return actual > 0 ? Math.min((target / actual) * 100, 100) : 0;
    if (formulaType === UomFormulaType.ZERO) return actual === 0 ? 100 : 0;
    return Math.min((actual / target) * 100, 100);
  };

  const buildGoals = (department: string, includeShared = false) => {
    const sharedGoal = includeShared
      ? [{ title: 'Enterprise Growth Spotlight', description: 'Organization-wide focus on cross-functional execution and delivery consistency.', thrustArea: 'Revenue Growth', uom: 'Numeric (Max)', targetValue: 120, weightage: 10, isShared: true }]
      : [];

    const templates: Record<string, Array<{ title: string; description: string; thrustArea: string; uom: string; targetValue: number; weightage: number; isShared?: boolean }>> = {
      Sales: [
        { title: 'Qualified Pipeline Value', description: 'Maintain a healthy pipeline for the quarter with disciplined coverage.', thrustArea: 'Revenue Growth', uom: 'Numeric (Max)', targetValue: 125, weightage: includeShared ? 35 : 45 },
        { title: 'Win Rate Improvement', description: 'Lift conversion rates through targeted deal coaching and forecast hygiene.', thrustArea: 'Innovation', uom: 'Numeric (Min)', targetValue: 68, weightage: includeShared ? 30 : 30 },
        { title: 'CRM Hygiene Score', description: 'Keep stage updates, next steps, and close dates current.', thrustArea: 'Operational Excellence', uom: 'Zero-based', targetValue: 0, weightage: includeShared ? 25 : 25 },
        ...sharedGoal,
      ],
      Operations: [
        { title: 'Order Fulfillment SLA', description: 'Hit committed turnaround times across the operational pipeline.', thrustArea: 'Operational Excellence', uom: 'Numeric (Min)', targetValue: 98, weightage: includeShared ? 40 : 50 },
        { title: 'Defect Escape Rate', description: 'Reduce downstream rework and customer-visible defects.', thrustArea: 'Compliance & Safety', uom: 'Numeric (Min)', targetValue: 3, weightage: includeShared ? 25 : 25 },
        { title: 'Process Automation Coverage', description: 'Automate repetitive steps to improve throughput and auditability.', thrustArea: 'Innovation', uom: 'Numeric (Max)', targetValue: 80, weightage: includeShared ? 25 : 25 },
        ...sharedGoal,
      ],
      'Customer Success': [
        { title: 'Renewal Health Score', description: 'Maintain account health across critical renewals and expansion opportunities.', thrustArea: 'Customer Success', uom: 'Numeric (Min)', targetValue: 92, weightage: includeShared ? 40 : 40 },
        { title: 'Escalation Resolution Time', description: 'Close escalations quickly with documented follow-up.', thrustArea: 'Customer Success', uom: 'Numeric (Min)', targetValue: 24, weightage: includeShared ? 30 : 30 },
        { title: 'Quarterly Success Plans', description: 'Keep success plans current for named accounts.', thrustArea: 'Customer Success', uom: 'Timeline', targetValue: 100, weightage: includeShared ? 20 : 20 },
        ...sharedGoal,
      ],
      Finance: [
        { title: 'Month-End Close Timeliness', description: 'Close the books within SLA and with clean reconciliations.', thrustArea: 'Operational Excellence', uom: 'Numeric (Min)', targetValue: 100, weightage: includeShared ? 40 : 45 },
        { title: 'Forecast Variance Control', description: 'Keep operating forecast variance within approved thresholds.', thrustArea: 'Compliance & Safety', uom: 'Numeric (Min)', targetValue: 95, weightage: includeShared ? 30 : 30 },
        { title: 'Control Exception Closure', description: 'Resolve open controls and approvals without aging exceptions.', thrustArea: 'Compliance & Safety', uom: 'Numeric (Max)', targetValue: 12, weightage: includeShared ? 20 : 25 },
        ...sharedGoal,
      ],
      Compliance: [
        { title: 'Policy Review Completion', description: 'Complete scheduled policy review windows on time.', thrustArea: 'Compliance & Safety', uom: 'Numeric (Min)', targetValue: 100, weightage: includeShared ? 40 : 40 },
        { title: 'Open Audit Item Closure', description: 'Reduce open audit observations in a controlled cadence.', thrustArea: 'Compliance & Safety', uom: 'Numeric (Max)', targetValue: 8, weightage: includeShared ? 30 : 30 },
        { title: 'Training Coverage', description: 'Track team-wide compliance training completion.', thrustArea: 'People Development', uom: 'Numeric (Min)', targetValue: 98, weightage: includeShared ? 20 : 30 },
        ...sharedGoal,
      ],
      Engineering: [
        { title: 'Delivery Predictability', description: 'Deliver committed roadmap items with predictable sprint flow.', thrustArea: 'Innovation', uom: 'Numeric (Min)', targetValue: 90, weightage: includeShared ? 35 : 40 },
        { title: 'Production Defect Rate', description: 'Reduce defects and improve stability after releases.', thrustArea: 'Operational Excellence', uom: 'Numeric (Min)', targetValue: 4, weightage: includeShared ? 35 : 35 },
        { title: 'Review Cycle Efficiency', description: 'Keep code review and handoff cycles efficient.', thrustArea: 'People Development', uom: 'Numeric (Max)', targetValue: 18, weightage: includeShared ? 20 : 25 },
        ...sharedGoal,
      ],
      Frontend: [
        { title: 'Feature Delivery Accuracy', description: 'Ship planned UI features with high quality and low churn.', thrustArea: 'Innovation', uom: 'Numeric (Min)', targetValue: 92, weightage: includeShared ? 35 : 40 },
        { title: 'Performance Budget', description: 'Keep client-side performance in line with product standards.', thrustArea: 'Operational Excellence', uom: 'Numeric (Max)', targetValue: 16, weightage: includeShared ? 35 : 35 },
        { title: 'Accessibility Coverage', description: 'Ensure new surfaces include accessible controls and labels.', thrustArea: 'Compliance & Safety', uom: 'Numeric (Min)', targetValue: 96, weightage: includeShared ? 20 : 25 },
        ...sharedGoal,
      ],
      Backend: [
        { title: 'API Reliability', description: 'Maintain stable, low-error backend delivery in the cycle.', thrustArea: 'Operational Excellence', uom: 'Numeric (Min)', targetValue: 99, weightage: includeShared ? 40 : 40 },
        { title: 'Latency Budget', description: 'Keep critical APIs within agreed latency budgets.', thrustArea: 'Operational Excellence', uom: 'Numeric (Max)', targetValue: 220, weightage: includeShared ? 30 : 30 },
        { title: 'Defect Backlog Burn-down', description: 'Reduce escaped defects and close priority bugs.', thrustArea: 'Innovation', uom: 'Numeric (Min)', targetValue: 90, weightage: includeShared ? 20 : 30 },
        ...sharedGoal,
      ],
    };

    return templates[department] || templates['Operations'];
  };

  const demoProfiles = [
    { user: manager, department: 'Backend', status: GoalSheetStatus.APPROVED, managerId: hrAdmin.id, includeShared: true },
    { user: salesManager, department: 'Sales', status: GoalSheetStatus.SUBMITTED, managerId: hrAdmin.id, includeShared: false },
    { user: operationsManager, department: 'Operations', status: GoalSheetStatus.RETURNED, managerId: hrAdmin.id, includeShared: false },
    { user: hrAdmin, department: 'People Operations', status: GoalSheetStatus.DRAFT, managerId: admin.id, includeShared: false },
    { user: employee, department: 'Backend', status: GoalSheetStatus.APPROVED, managerId: manager.id, includeShared: false },
    { user: demoUserRecords[0], department: 'Sales', status: GoalSheetStatus.SUBMITTED, managerId: salesManager.id, includeShared: true },
    { user: demoUserRecords[1], department: 'Sales', status: GoalSheetStatus.DRAFT, managerId: salesManager.id, includeShared: false },
    { user: demoUserRecords[2], department: 'Operations', status: GoalSheetStatus.APPROVED, managerId: operationsManager.id, includeShared: false },
    { user: demoUserRecords[3], department: 'Operations', status: GoalSheetStatus.LOCKED, managerId: operationsManager.id, includeShared: false },
    { user: demoUserRecords[4], department: 'Customer Success', status: GoalSheetStatus.RETURNED, managerId: manager.id, includeShared: false },
    { user: demoUserRecords[5], department: 'Customer Success', status: GoalSheetStatus.SUBMITTED, managerId: manager.id, includeShared: true },
    { user: demoUserRecords[6], department: 'Finance', status: GoalSheetStatus.APPROVED, managerId: hrAdmin.id, includeShared: false },
    { user: demoUserRecords[7], department: 'Compliance', status: GoalSheetStatus.SUBMITTED, managerId: hrAdmin.id, includeShared: false },
    { user: demoUserRecords[8], department: 'Frontend', status: GoalSheetStatus.DRAFT, managerId: manager.id, includeShared: false },
    { user: demoUserRecords[9], department: 'Backend', status: GoalSheetStatus.APPROVED, managerId: manager.id, includeShared: false },
  ];

  const notificationSeeds: any[] = [];
  const auditSeeds: any[] = [];
  const escalationSeeds: any[] = [];

  for (const profile of demoProfiles) {
    const sheet = await prisma.goalSheet.findFirst({ where: { employeeId: profile.user.id, cycleId: cycle.id } }) || await prisma.goalSheet.create({
      data: {
        employeeId: profile.user.id,
        managerId: profile.managerId,
        cycleId: cycle.id,
        status: profile.status,
        submittedAt: profile.status === GoalSheetStatus.DRAFT ? null : new Date(),
        approvedAt: profile.status === GoalSheetStatus.APPROVED || profile.status === GoalSheetStatus.LOCKED ? new Date() : null,
        lockedAt: profile.status === GoalSheetStatus.APPROVED || profile.status === GoalSheetStatus.LOCKED ? new Date() : null,
        returnedAt: profile.status === GoalSheetStatus.RETURNED ? new Date() : null,
        returnReason: profile.status === GoalSheetStatus.RETURNED ? 'Please rebalance the weightage and clarify ownership for the shared goal.' : null,
      }
    });

    const existingGoals = await prisma.goal.count({ where: { goalSheetId: sheet.id } });
    if (existingGoals === 0) {
      const templates = buildGoals(profile.department, profile.includeShared);
      for (const [index, template] of templates.entries()) {
        const thrustArea = thrustByName[template.thrustArea];
        const uomType = uomByName[template.uom];
        const goal = await prisma.goal.create({
          data: {
            goalSheetId: sheet.id,
            title: template.title,
            description: template.description,
            thrustAreaId: thrustArea.id,
            uomTypeId: uomType.id,
            targetValue: template.targetValue,
            weightage: template.weightage,
            isShared: Boolean(template.isShared),
            createdBy: profile.user.id,
            status: profile.status === GoalSheetStatus.DRAFT ? GoalStatus.DRAFT : profile.status === GoalSheetStatus.RETURNED ? GoalStatus.RETURNED : profile.status === GoalSheetStatus.APPROVED || profile.status === GoalSheetStatus.LOCKED ? GoalStatus.LOCKED : GoalStatus.SUBMITTED,
          }
        });

        const q1Actual = Math.round(template.targetValue * (0.82 + index * 0.04));
        const q2Actual = Math.round(template.targetValue * (profile.status === GoalSheetStatus.RETURNED ? 0.72 : profile.status === GoalSheetStatus.DRAFT ? 0.88 : 0.95));

        const q1 = await prisma.checkin.create({
          data: {
            goalId: goal.id,
            quarter: QuarterPeriod.Q1,
            plannedValue: template.targetValue,
            actualValue: q1Actual,
            status: q1Actual >= template.targetValue ? CheckinStatus.COMPLETED : CheckinStatus.ON_TRACK,
            progressScore: Math.round(computeProgress(uomType.formulaType, template.targetValue, q1Actual)),
            submittedAt: new Date(`${currentYear}-04-10`),
          }
        });

        const q2 = await prisma.checkin.create({
          data: {
            goalId: goal.id,
            quarter: QuarterPeriod.Q2,
            plannedValue: Math.round(template.targetValue * 0.95),
            actualValue: q2Actual,
            status: profile.status === GoalSheetStatus.RETURNED ? CheckinStatus.ON_TRACK : CheckinStatus.COMPLETED,
            progressScore: Math.round(computeProgress(uomType.formulaType, template.targetValue, q2Actual)),
            submittedAt: profile.status === GoalSheetStatus.DRAFT ? null : new Date(),
          }
        });

        if ((profile.status === GoalSheetStatus.APPROVED || profile.status === GoalSheetStatus.LOCKED) && sheet.managerId) {
          await prisma.managerFeedback.create({
            data: {
              checkinId: q2.id,
              managerId: sheet.managerId,
              feedback: `Strong delivery on ${template.title.toLowerCase()}. Keep momentum and maintain the review cadence.`,
            }
          });
        }

        auditSeeds.push(
          { entityType: AuditEntityType.GOAL_SHEET, entityId: sheet.id, fieldName: 'status', oldValue: 'DRAFT', newValue: profile.status, changedById: profile.managerId },
          { entityType: AuditEntityType.GOAL, entityId: goal.id, fieldName: 'weightage', oldValue: null, newValue: String(template.weightage), changedById: profile.user.id, goalSheetId: sheet.id, goalId: goal.id },
          { entityType: AuditEntityType.CHECKIN, entityId: q2.id, fieldName: 'progressScore', oldValue: null, newValue: String(Math.round(computeProgress(uomType.formulaType, template.targetValue, q2Actual))), changedById: profile.user.id, goalSheetId: sheet.id, goalId: goal.id },
        );
      }
    }

    notificationSeeds.push(
      { userId: profile.user.id, type: NotificationType.CHECKIN_REMINDER, title: `${profile.department} check-in window active`, message: `Quarterly check-ins are open for ${profile.user.name}. Update your progress before manager review.`, link: '/checkins' },
      { userId: profile.user.id, type: profile.status === GoalSheetStatus.APPROVED ? NotificationType.GOAL_APPROVED : NotificationType.GOAL_SUBMITTED, title: profile.status === GoalSheetStatus.APPROVED ? 'Goal sheet approved' : 'Goal sheet submitted', message: profile.status === GoalSheetStatus.APPROVED ? 'Your goal sheet is locked and approved for the cycle.' : 'Your goals are ready for review.', link: '/goals' },
    );

    if (profile.status === GoalSheetStatus.RETURNED) {
      escalationSeeds.push({ userId: profile.user.id, goalSheetId: sheet.id, escalationLevel: 2, reason: `Manager return required for ${profile.user.name}'s goal sheet`, status: EscalationStatus.PENDING });
    }
  }

  if (notificationSeeds.length) {
    await prisma.notification.createMany({ data: notificationSeeds, skipDuplicates: true });
  }
  if (auditSeeds.length) {
    await prisma.auditLog.createMany({ data: auditSeeds, skipDuplicates: true });
  }
  if (escalationSeeds.length) {
    await prisma.escalation.createMany({ data: escalationSeeds, skipDuplicates: true });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
