import { PrismaClient, UserStatus, UomFormulaType } from '@prisma/client';
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
  const uomTypes = [
    { name: 'Numeric (Min)', formulaType: UomFormulaType.MIN },
    { name: 'Numeric (Max)', formulaType: UomFormulaType.MAX },
    { name: 'Timeline', formulaType: UomFormulaType.TIMELINE },
    { name: 'Zero-based', formulaType: UomFormulaType.ZERO },
  ];
  for (const u of uomTypes) {
    await prisma.uomType.upsert({
      where: { name: u.name },
      update: {},
      create: u
    });
  }

  // 6. Thrust Areas
  const thrustAreas = ['Revenue Growth', 'Customer Success', 'Operational Excellence', 'People Development', 'Innovation', 'Compliance & Safety'];
  for (const t of thrustAreas) {
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
