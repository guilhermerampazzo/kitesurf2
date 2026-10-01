import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  // Seller
  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@kite360.com' },
    update: {},
    create: {
      name: 'João Kitesurf',
      email: 'vendedor@kite360.com',
      passwordHash: await argon2.hash('senha123'),
      isVerified: true,
      emailVerifiedAt: new Date(),
      rating: 4.8,
      reviewCount: 12,
    },
  })

  const listings = [
    {
      title: 'Duotone Rebel SLS 10m 2024',
      description: 'Kite em excelente estado, usado apenas uma temporada. Acompanha bar Duotone Click Bar 2024, mochila e manual. Sem rasgos ou remendos.',
      price: 12500,
      category: 'kitesurf',
      brand: 'Duotone',
      model: 'Rebel SLS 10m',
      condition: 'used',
      city: 'Florianópolis',
      state: 'SC',
      isBoosted: true,
      boostExpiresAt: new Date(Date.now() + 30 * 86400000),
      image: '/imagens/kitesurf-card.webp',
    },
    {
      title: 'Core Nexus 3 12m + Bar',
      description: 'Kite Core Nexus 3 12m 2023 em perfeito estado. Acompanha Core Sensor 3 bar. Vendido por motivo de upgrade de equipamento.',
      price: 8900,
      category: 'kitesurf',
      brand: 'Core',
      model: 'Nexus 3 12m',
      condition: 'used',
      city: 'Fortaleza',
      state: 'CE',
      isBoosted: true,
      boostExpiresAt: new Date(Date.now() + 30 * 86400000),
      image: '/imagens/hero-1-card.webp',
    },
    {
      title: 'Wing F-One Strike V3 6m',
      description: 'Wing F-One Strike V3 tamanho 6m, temporada 2023. Ideal para ventos médios. Acompanha bolsa de transporte. Estado impecável.',
      price: 6450,
      category: 'wingfoil',
      brand: 'F-One',
      model: 'Strike V3 6m',
      condition: 'used',
      city: 'Ilhabela',
      state: 'SP',
      isBoosted: true,
      boostExpiresAt: new Date(Date.now() + 30 * 86400000),
      image: '/imagens/wakesurf-card.webp',
    },
    {
      title: 'Cabrinha Switchblade 12m 2024 — NOVO',
      description: 'Kite Cabrinha Switchblade 12m 2024 zero. Na embalagem original, nunca inflado. Comprado e não utilizei por mudança de modalidade.',
      price: 14800,
      category: 'kitesurf',
      brand: 'Cabrinha',
      model: 'Switchblade 12m',
      condition: 'new',
      city: 'Rio de Janeiro',
      state: 'RJ',
      isBoosted: true,
      boostExpiresAt: new Date(Date.now() + 30 * 86400000),
      image: '/imagens/hero-2-card.webp',
    },
    {
      title: 'Prancha Wing Foil Naish Hover 85L',
      description: 'Prancha de wingfoil Naish Hover 85L. Construção em carbono, levíssima. Ideal para iniciantes no foil. Inclui footstraps.',
      price: 4800,
      category: 'wingfoil',
      brand: 'Naish',
      model: 'Hover 85L',
      condition: 'used',
      city: 'Jericoacoara',
      state: 'CE',
      isBoosted: false,
      image: '/imagens/beach-couple-card.webp',
    },
    {
      title: 'Foil Completo Axis Spitfire 2023',
      description: 'Foil Axis Spitfire completo: mast 75cm, fuselagem curta, frente 1099 e estabilizador. Perfeito para kitefoil e wingfoil.',
      price: 7200,
      category: 'kitefoil',
      brand: 'Axis',
      model: 'Spitfire',
      condition: 'used',
      city: 'Cumbuco',
      state: 'CE',
      isBoosted: false,
      image: '/imagens/surfer-card.webp',
    },
    {
      title: 'Trapézio ION Ripper Seat 2024',
      description: 'Trapézio seat ION Ripper 2024 tamanho M. Usado 3 vezes. Muito confortável, excelente para longas sessões.',
      price: 1200,
      category: 'acessorios',
      brand: 'ION',
      model: 'Ripper Seat',
      condition: 'used',
      city: 'Arraial do Cabo',
      state: 'RJ',
      isBoosted: false,
      image: '/imagens/kitesurf-card.webp',
    },
    {
      title: 'North Orbit 9m 2023 + Barra',
      description: 'Kite North Orbit 9m 2023. Kite de performance para ondas e freeride. Acompanha North Click bar 2023. Excelente estado.',
      price: 9500,
      category: 'kitewave',
      brand: 'North',
      model: 'Orbit 9m',
      condition: 'used',
      city: 'Florianópolis',
      state: 'SC',
      isBoosted: false,
      image: '/imagens/hero-1-card.webp',
    },
  ]

  for (const l of listings) {
    const listing = await prisma.listing.create({
      data: {
        title: l.title,
        description: l.description,
        price: l.price,
        category: l.category,
        brand: l.brand,
        model: l.model,
        condition: l.condition,
        status: 'active',
        city: l.city,
        state: l.state,
        isBoosted: l.isBoosted,
        boostExpiresAt: l.boostExpiresAt ?? null,
        sellerId: seller.id,
        viewCount: Math.floor(Math.random() * 200),
        favoriteCount: Math.floor(Math.random() * 30),
      },
    })
    await prisma.listingImage.create({
      data: { listingId: listing.id, url: l.image, thumb: l.image, order: 0 },
    })
  }

  console.log('Seed concluído: 1 vendedor + 8 anúncios criados.')

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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
