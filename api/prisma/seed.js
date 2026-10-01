const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const prisma = new PrismaClient()

const imgs = [
  '/imagens/kitesurf-card.webp',
  '/imagens/hero-1-card.webp',
  '/imagens/wakesurf-card.webp',
  '/imagens/hero-2-card.webp',
  '/imagens/beach-couple-card.webp',
  '/imagens/surfer-card.webp',
]

const listings = [
  { title: 'Duotone Rebel SLS 10m 2024', price: 12500, category: 'kitesurf', brand: 'Duotone', condition: 'used', city: 'Florianópolis', state: 'SC', boosted: true },
  { title: 'Core Nexus 3 12m + Bar', price: 8900, category: 'kitesurf', brand: 'Core', condition: 'used', city: 'Fortaleza', state: 'CE', boosted: true },
  { title: 'Wing F-One Strike V3 6m', price: 6450, category: 'wingfoil', brand: 'F-One', condition: 'used', city: 'Ilhabela', state: 'SP', boosted: true },
  { title: 'Cabrinha Switchblade 12m 2024 — NOVO', price: 14800, category: 'kitesurf', brand: 'Cabrinha', condition: 'new', city: 'Rio de Janeiro', state: 'RJ', boosted: true },
  { title: 'Prancha Wing Foil Naish Hover 85L', price: 4800, category: 'wingfoil', brand: 'Naish', condition: 'used', city: 'Jericoacoara', state: 'CE', boosted: false },
  { title: 'Foil Completo Axis Spitfire 2023', price: 7200, category: 'kitefoil', brand: 'Axis', condition: 'used', city: 'Cumbuco', state: 'CE', boosted: false },
  { title: 'Trapézio ION Ripper Seat 2024', price: 1200, category: 'acessorios', brand: 'ION', condition: 'used', city: 'Arraial do Cabo', state: 'RJ', boosted: false },
  { title: 'North Orbit 9m 2023 + Barra', price: 9500, category: 'kitewave', brand: 'North', condition: 'used', city: 'Florianópolis', state: 'SC', boosted: false },
]

async function main() {
  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@kite360.com' },
    update: {},
    create: {
      name: 'Joao Kitesurf',
      email: 'vendedor@kite360.com',
      passwordHash: await argon2.hash('senha123'),
      isVerified: true,
      emailVerifiedAt: new Date(),
      rating: 4.8,
      reviewCount: 12,
    },
  })

  for (let i = 0; i < listings.length; i++) {
    const d = listings[i]
    const l = await prisma.listing.create({
      data: {
        title: d.title,
        description: 'Equipamento em excelente estado, bem conservado. Sem defeitos.',
        price: d.price,
        category: d.category,
        brand: d.brand,
        model: d.title,
        condition: d.condition,
        status: 'active',
        city: d.city,
        state: d.state,
        isBoosted: d.boosted,
        boostExpiresAt: d.boosted ? new Date(Date.now() + 30 * 86400000) : null,
        sellerId: seller.id,
        viewCount: Math.floor(Math.random() * 200),
        favoriteCount: Math.floor(Math.random() * 30),
      },
    })
    await prisma.listingImage.create({
      data: { listingId: l.id, url: imgs[i % imgs.length], thumb: imgs[i % imgs.length], order: 0 },
    })
    console.log('Criado:', d.title)
  }

  // ── Buber: tarifa + comissão ──
  const existingFare = await prisma.buberFareConfig.findFirst({ where: { isActive: true } })
  if (existingFare) {
    await prisma.buberFareConfig.update({
      where: { id: existingFare.id },
      data: { minFare: 8, pricePerKm: 2.5, pricePerMin: 0.35, cancelFee: 4, isActive: true },
    })
  } else {
    await prisma.buberFareConfig.create({
      data: { minFare: 8, pricePerKm: 2.5, pricePerMin: 0.35, cancelFee: 4, isActive: true },
    })
  }
  await prisma.commissionConfig.upsert({
    where: { module: 'buber' },
    update: { percentage: 15, fixedFee: 0, isActive: true },
    create: { module: 'buber', percentage: 15, fixedFee: 0, isActive: true },
  })
  console.log('Seed Buber: fare config + commissionConfig(buber) garantidos.')
  console.log('Seed concluido!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
