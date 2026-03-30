import { PrismaClient, ClientType, UserRole, JobStatus, TrapType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed Hygienix...');

  await prisma.$transaction([
    prisma.productUsage.deleteMany(),
    prisma.trapActivity.deleteMany(),
    prisma.intervention.deleteMany(),
    prisma.trap.deleteMany(),
    prisma.zone.deleteMany(),
    prisma.location.deleteMany(),
    prisma.product.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const salt = await bcrypt.genSalt(12);

  await prisma.user.create({
    data: { 
      email: 'admin@hygienix.it', 
      password: await bcrypt.hash('Admin2026!', salt), 
      firstName: 'Mario', 
      lastName: 'Rossi', 
      role: UserRole.ADMIN 
    },
  });
  
  await prisma.user.create({
    data: { 
      email: 'giuseppe@hygienix.it', 
      password: await bcrypt.hash('Tech2026!', salt), 
      firstName: 'Giuseppe', 
      lastName: 'Bianchi', 
      role: UserRole.TECHNICIAN, 
      phone: '+39 333 1234567' 
    },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Goliath Gel', activePrinciple: 'Fipronil 0.05%', registrationNum: 'Reg. Min. 18586', manufacturer: 'BASF', stock: 500, minStock: 50, unit: 'gr', category: 'Insetticidi', targetPests: ['blatte'] },
      { name: 'Racumin Paste', activePrinciple: 'Cumatetralil 0.0375%', registrationNum: 'Reg. Min. 17234', manufacturer: 'Bayer', stock: 200, minStock: 20, unit: 'kg', category: 'Rodenticidi', targetPests: ['ratti', 'topi'] },
      { name: 'K-Othrine SC 25', activePrinciple: 'Deltametrina 2.5%', registrationNum: 'Reg. Min. 15678', manufacturer: 'Bayer', stock: 5000, minStock: 500, unit: 'ml', category: 'Insetticidi', targetPests: ['zanzare', 'blatte'] },
    ],
  });

  const client = await prisma.client.create({
    data: {
      name: 'Ristorante Da Giovanni',
      type: ClientType.RISTORANTE,
      email: 'info@dagiovanni.it',
      locations: {
        create: {
          name: 'Sede Principale',
          address: 'Via Roma 123, Milano',
          city: 'Milano',
          zones: {
            create: [
              {
                name: 'Cucina',
                traps: {
                  create: [
                    { code: 'DG-C-01', type: TrapType.GLUE_BOARD },
                    { code: 'DG-C-02', type: TrapType.GLUE_BOARD },
                    { code: 'DG-C-03', type: TrapType.UV_LIGHT },
                  ],
                },
              },
              {
                name: 'Magazzino',
                traps: {
                  create: [
                    { code: 'DG-M-01', type: TrapType.RAT_BAIT_STATION },
                    { code: 'DG-M-02', type: TrapType.GLUE_BOARD },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    include: { locations: { include: { zones: { include: { traps: true } } } } },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const technician = await prisma.user.findFirst({ where: { email: 'giuseppe@hygienix.it' } });
  
  await prisma.intervention.create({
    data: {
      locationId: client.locations[0].id,
      technicianId: technician!.id,
      scheduledAt: tomorrow,
      status: JobStatus.PLANNED,
      priority: 1,
      notes: 'Controllo mensile HACCP',
    },
  });

  console.log('✅ Seed completato!');
  console.log('Admin: admin@hygienix.it / Admin2026!');
  console.log('Tech: giuseppe@hygienix.it / Tech2026!');
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });