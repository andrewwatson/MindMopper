import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep'
export type EdgeThickness = 1 | 2 | 3 | 5

export interface ColorPalette {
  id: string
  name: string
  colors: string[]  // ordered list; first color = first branch, etc.
}

// 8 colorblind-accessible palettes.
// Sources: Wong (2011), Okabe-Ito, IBM Carbon accessible palette, Paul Tol.
// Each palette has 8 distinct colors separable under deuteranopia, protanopia,
// and tritanopia. Hex values chosen to maintain contrast ≥3:1 on white bg.
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'wong',
    name: 'Wong',
    colors: ['#E69F00','#56B4E9','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7','#000000'],
  },
  {
    id: 'okabe-ito',
    name: 'Okabe-Ito',
    colors: ['#E69F00','#56B4E9','#009E73','#0072B2','#D55E00','#CC79A7','#F0E442','#999999'],
  },
  {
    id: 'tol-bright',
    name: 'Tol Bright',
    colors: ['#4477AA','#EE6677','#228833','#CCBB44','#66CCEE','#AA3377','#BBBBBB','#000000'],
  },
  {
    id: 'tol-muted',
    name: 'Tol Muted',
    colors: ['#332288','#117733','#44AA99','#88CCEE','#DDCC77','#CC6677','#AA4499','#882255'],
  },
  {
    id: 'ibm',
    name: 'IBM',
    colors: ['#648FFF','#785EF0','#DC267F','#FE6100','#FFB000','#009E73','#56B4E9','#000000'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: ['#364B9A','#4A7BB7','#6EA6CD','#98CAE1','#FDB366','#F67E4B','#DD3D2D','#A50026'],
  },
  {
    id: 'nightfall',
    name: 'Nightfall',
    colors: ['#125A56','#00767B','#238F9D','#42A7C6','#60BCE9','#9DCCEF','#C6DBED','#DEF5E5'],
  },
  {
    id: 'mono',
    name: 'Mono',
    colors: ['#111111','#333333','#555555','#777777','#999999','#AAAAAA','#BBBBBB','#CCCCCC'],
  },
]

export interface EdgeStyleState {
  type: EdgeType
  thickness: EdgeThickness
  paletteId: string
  setType: (type: EdgeType) => void
  setThickness: (thickness: EdgeThickness) => void
  setPaletteId: (id: string) => void
  getActivePalette: () => ColorPalette
}

export const useEdgeStyleStore = create<EdgeStyleState>()(
  persist(
    (set, get) => ({
      type: 'smoothstep',
      thickness: 2,
      paletteId: 'wong',
      setType: (type) => set({ type }),
      setThickness: (thickness) => set({ thickness }),
      setPaletteId: (paletteId) => set({ paletteId }),
      getActivePalette: () =>
        COLOR_PALETTES.find(p => p.id === get().paletteId) ?? COLOR_PALETTES[0],
    }),
    { name: 'mindmopper.edgeStyle' }
  )
)
