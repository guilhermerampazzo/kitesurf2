# KITE360º — Design System MASTER (v2 "Ocean Marketplace")

> Fonte da verdade para TODAS as páginas. Inspirado na estrutura de
> travel-marketplaces de referência (hero com busca flutuante, cards foto-first,
> trust strip, faixas de conversão, footer navy) — **sem copiar elementos**:
> nada de aviões, globos, hotéis ou "Destinos". A identidade é de esporte aquático.
> Paleta original da plataforma 100% preservada.

## 1. Paleta (intocável — mesma do GitHub)

| Papel | Light | Uso |
|---|---|---|
| Primary | `#001e40` navy profundo | Títulos de seção, rodapé, botões primários |
| Primary container | `#003366` | Gradientes, chips ativos |
| Primary fixed | `#d5e3ff` / dim `#a7c8ff` | Fundos suaves azuis, ícones-em-círculo |
| Accent (tertiary family) | `#ffb690 → #ff8d5c` | **CTA de energia**: Anunciar, Comprar, Gradiente pôr-do-sol, palavra itálica em títulos |
| Accent ink | `#341100` | Texto sobre laranja |
| Background | `#f9f9fe` | Página |
| Surface containers | `#f4f3f8 → #e2e2e7` | Cards, inputs, faixas |
| Error | `#ba1a1a` | Erros / favoritar |
| Star rating | `#fbbf24` amber | Avaliações |

Dark mode: tokens M3 já existentes em `.dark` — nunca usar hex solto em componentes.

## 2. Tipografia

- **Display (h1–h4, preços, botões-chave):** Nunito 800/900, `letter-spacing:-0.015em`
- **Corpo / labels:** Hanken Grotesk 400–700
- Classe `.accent-word` → palavra **itálica laranja** dentro de títulos (DNA visual:
  "Compre e venda **sem vento contra**")
- Escala: `display-lg 48 / headline-lg 32 / headline-md 24 / title-lg 20 / body-lg 16 / body-md 14 / label-md 12`

## 3. Forma &profundidade

- Raio de card: `20px` (`rounded-card`); botões/pills: `rounded-full`; inputs: `rounded-xl`
- Sombras: `--shadow-soft` (repouso) / `--shadow-float` (hover, elevação -4px)
- Gradientes utilitários: `.bg-brand-gradient` (navy→oceano), `.bg-sunset-gradient`,
  `.photo-scrim` (fade navy sobre foto p/ texto branco)
- **Nunca** borda cinza + sombra ao mesmo tempo; card = 1px `outline-variant` OU sombra, não ambos com força total

## 4. Anatomia de página (padrão das referências, adaptado a marketplace)

1. **Hero** — foto real de kitesurf + scrim navy, título display com `accent-word`,
   **cartão de busca flutuante** sobreposto ao hero (search + categoria + cidade → /buscar)
2. **Trust strip** — 4 selos com `.trust-chip-icon`: Compra Segura / Vendedor Verificado /
   Suporte 7 dias / Equipamentos Revisados
3. **Categorias** — tiles com foto + nome (kites, pranchas, asas, trapézios, velas, acessórios)
4. **Destaques / Recém-chegados** — grid `ProductCard` foto-first
5. **Faixa de conversão** — bloco `.bg-brand-gradient` com CTA laranja "Anuncie seu equipamento"
6. **Footer navy** — 4 colunas + newsletter + redes

## 5. Componentes (web/src/components)

- `Button`: variants `primary` (navy pill), `accent` (sunset pill, texto ink), `secondary`, `ghost`, `danger`; tamanhos sm/md/lg; `rounded-full`
- `Badge`: pill `rounded-full` — condition (Novo=accent-soft, Usado=secondary-container),
  `sponsored` (dot âmbar), `verified` (primary-fixed), status
- `ProductCard`: foto 4/3 topo com pills sobrepostas (patrocinado ↑esq, condição ↓sobre scrim)
  + coração ↑dir; corpo: título, cidade, avaliação; rodapé: preço `price-display` navy + vendedor
- `Input/Select/Textarea`: label `label-md` uppercase acima, `rounded-xl`, ícone à esquerda, foco com `--shadow-ring`
- `SectionHeading`: título display + `.section-rule` (barra sunset 56×5px) + link "Ver todos →"
- `EmptyState`: ícone Material em círculo primary-fixed + texto + CTA
- `Modal` / `StatCard`: `rounded-card` + `--shadow-float`

## 6. Ícones & movimento

- Somente **Material Symbols Outlined** (já carregado). Proibido emoji.
- Hover de card: `translateY(-4px)` + shadow (250ms ease). Página: fade-up sutil.
- `prefers-reduced-motion` já neutraliza transições no global.

## 7. Regras de conteúdo

- PT-BR, tom direto e esportivo ("pegue a pipa", "vento a favor") — sem jargão corporativo.
- Preços: `R$ 12.500` via `formatPrice`. Nunca texto placeholder lorem.
- Estados vazios sempre com CTA (ex.: "Você ainda não favoritou nada → Explorar").
