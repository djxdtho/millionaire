export interface PrizeTier {
  level: number
  amount: number
  label: string
  safeHaven: boolean
}

export const PRIZE_LADDER: PrizeTier[] = [
  { level: 1,  amount: 100,      label: '$100',       safeHaven: false },
  { level: 2,  amount: 200,      label: '$200',       safeHaven: false },
  { level: 3,  amount: 300,      label: '$300',       safeHaven: false },
  { level: 4,  amount: 500,      label: '$500',       safeHaven: false },
  { level: 5,  amount: 1_000,    label: '$1,000',     safeHaven: true  },
  { level: 6,  amount: 2_000,    label: '$2,000',     safeHaven: false },
  { level: 7,  amount: 4_000,    label: '$4,000',     safeHaven: false },
  { level: 8,  amount: 8_000,    label: '$8,000',     safeHaven: false },
  { level: 9,  amount: 16_000,   label: '$16,000',    safeHaven: false },
  { level: 10, amount: 32_000,   label: '$32,000',    safeHaven: true  },
  { level: 11, amount: 125_000,  label: '$125,000',   safeHaven: false },
  { level: 12, amount: 250_000,  label: '$250,000',   safeHaven: false },
  { level: 13, amount: 500_000,  label: '$500,000',   safeHaven: false },
  { level: 14, amount: 750_000,  label: '$750,000',   safeHaven: false },
  { level: 15, amount: 1_000_000, label: '$1,000,000', safeHaven: false },
]

export function getPrize(level: number): PrizeTier | undefined {
  return PRIZE_LADDER.find(t => t.level === level)
}

export function getGuaranteedAmount(currentLevel: number): number {
  const safeHavens = PRIZE_LADDER.filter(t => t.safeHaven && t.level <= currentLevel)
  if (safeHavens.length === 0) return 0
  return safeHavens[safeHavens.length - 1].amount
}
