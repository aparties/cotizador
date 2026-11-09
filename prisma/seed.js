const { PrismaClient } = require('@prisma/client');
const customersData = require('../src/data/seed-customers.json');
const productsData = require('../src/data/seed-products.json');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando carga masiva a Neon PostgreSQL...');

  const customersCount = await prisma.customer.createMany({
    data: customersData.map((c) => ({
      ruc: c.ruc,
      businessName: c.businessName,
      address: c.address,
      phone: c.phone || null,
      email: c.email || null,
      defaultPaymentTerm: '60 DÍAS',
      defaultCondition: 'CRÉDITO',
    })),
    skipDuplicates: true,
  });
  console.log(`✅ ${customersCount.count} clientes importados.`);

  const productsCount = await prisma.product.createMany({
    data: productsData.map((p) => ({
      internalCode: p.internalCode || crypto.randomUUID(),
      partNumber: p.partNumber,
      description: `${p.category} ${p.brand} ${p.partNumber}`,
      category: p.category,
      brand: p.brand,
      unit: p.unit || 'UNIDADES',
      currency: p.currency,
      basePrice: p.salePrice,
      purchaseCost: p.purchaseCost,
    })),
    skipDuplicates: true,
  });
  console.log(`✅ ${productsCount.count} repuestos industriales importados.`);
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

