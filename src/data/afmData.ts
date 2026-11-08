export type LayoutMode = 'as-is' | 'to-be';
export type ViewDimension = '2d' | '3d';
export type OperatorKey = 'global' | 'gustavo' | 'ana' | 'melina';

export interface StageHTC {
  id: string;
  code: string;
  name: string;
  type: 'Manual' | 'Muda' | 'Manual VA' | 'Auto';
  globalSec: number;
  globalPct: number;
  gustavoSec: number;
  anaSec: number;
  melinaSec: number;
  toBeSec: number;
  peakNote?: string;
  sectorId: string;
  coordsAsIs: { x: number; y: number };
  coordsToBe: { x: number; y: number };
}

export interface SectorBox {
  id: string;
  refNum: number;
  name: string;
  subtitle: string;
  aisleWidth: string;
  cotasPlano: string;
  x: number;
  y: number;
  w: number;
  h: number;
  polygon?: string; // Optional SVG polygon points for angled walls (Sectors 1 & 7)
  badgeX?: number;
  badgeY?: number;
  zHeight: number;
  zBase?: number; // Elevated base for Entrepiso (Sector 4)
  colorAsIs: string;
  colorToBe: string;
  heatLevelAsIs: number;
  heatLevelToBe: number;
  familiesAsIs: string[];
  familiesToBe: string[];
  obsoletePctAsIs: number;
}

export interface ShelfUnit {
  id: string;
  code: string;
  label: string;
  contenido: string;
  cubiculos: number;
  altoM: number;
  largoM: number;
  profM: number;
  notaAltura?: string;
  family: 'diors' | 'sirio' | 'gaveteros' | 'obsoleto' | 'mostrador' | 'canos';
  sectorId: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number; // height in px for 3D extrusion (altoM * 26)
  zBase?: number;
  angleDeg?: number; // For angled shelves C, D, E in Sector 7 / 1
  asIsOnly?: boolean;
  toBeLabel?: string;
  toBeFamily?: 'diors' | 'sirio' | 'gaveteros' | 'mostrador' | 'canos';
}

export interface LayoutOpening {
  id: string;
  code: string;
  name: string;
  widthCm: string;
  connects: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
}

export interface BottleneckItem {
  rank: number;
  code: string;
  title: string;
  events: number;
  pct: number;
  detail: string;
  sectorId: string;
  alertX: number;
  alertY: number;
}

export const FIELD_OBSERVERS = [
  { id: 'nico', name: 'Nico', role: 'Relevamiento Tiempos & Layout', focus: 'Sector 2/3 y Mostrador (Cables Diors)' },
  { id: 'agustina', name: 'Agustina', role: 'Auditoría HTC & Anomalías', focus: 'Sector 2 (Gaveteros A-H pasillo 0,50 m)' },
  { id: 'franco', name: 'Franco', role: 'Recepción Truncada (5 Lotes)', focus: 'Acera Exterior 15 m y Trabajo Diferido (20-30 min)' },
  { id: 'gervin', name: 'Gervin', role: 'Entropía Espacial & ERI', focus: 'Dispersión Sectores 2, 3, 4, 6 y 7 (k=4..5)' },
  { id: 'facundo', name: 'Facundo', role: 'Flujo Informacional & Software', focus: 'Computadora y Mostrador (E1/E8 y D5)' },
  { id: 'lautaro', name: 'Lautaro', role: 'Codificación ABC & To-Be', focus: 'Consolidación ABC (k=1) y Meta ≤ 216,0 s' },
] as const;

export interface OperatorColorTheme {
  name: string;
  operatorName: string;
  main: string;
  hex: string;
  glow: string;
  glowRgba: string;
  badgeBg: string;
  border: string;
  badgeBorder: string;
}

export const OPERATOR_COLORS: Record<string, OperatorColorTheme> = {
  Nico: {
    name: 'Nico',
    operatorName: 'Nico',
    main: '#38bdf8',
    hex: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.28)',
    glowRgba: 'rgba(56, 189, 248, 0.28)',
    badgeBg: '#0369a1',
    border: '#bae6fd',
    badgeBorder: '#bae6fd',
  },
  Agustina: {
    name: 'Agustina',
    operatorName: 'Agustina',
    main: '#f472b6',
    hex: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.28)',
    glowRgba: 'rgba(244, 114, 182, 0.28)',
    badgeBg: '#be185d',
    border: '#fbcfe8',
    badgeBorder: '#fbcfe8',
  },
  Franco: {
    name: 'Franco',
    operatorName: 'Franco',
    main: '#fbbf24',
    hex: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.28)',
    glowRgba: 'rgba(251, 191, 36, 0.28)',
    badgeBg: '#b45309',
    border: '#fde68a',
    badgeBorder: '#fde68a',
  },
  Gervin: {
    name: 'Gervin',
    operatorName: 'Gervin',
    main: '#34d399',
    hex: '#34d399',
    glow: 'rgba(52, 211, 153, 0.28)',
    glowRgba: 'rgba(52, 211, 153, 0.28)',
    badgeBg: '#047857',
    border: '#a7f3d0',
    badgeBorder: '#a7f3d0',
  },
  Facundo: {
    name: 'Facundo',
    operatorName: 'Facundo',
    main: '#a78bfa',
    hex: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.28)',
    glowRgba: 'rgba(167, 139, 250, 0.28)',
    badgeBg: '#6d28d9',
    border: '#ddd6fe',
    badgeBorder: '#ddd6fe',
  },
  Lautaro: {
    name: 'Lautaro',
    operatorName: 'Lautaro',
    main: '#fb923c',
    hex: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.28)',
    glowRgba: 'rgba(251, 146, 60, 0.28)',
    badgeBg: '#c2410c',
    border: '#fed7aa',
    badgeBorder: '#fed7aa',
  },
  Mostrador: {
    name: 'Mostrador',
    operatorName: 'Mostrador',
    main: '#2dd4bf',
    hex: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.28)',
    glowRgba: 'rgba(45, 212, 191, 0.28)',
    badgeBg: '#0f766e',
    border: '#99f6e4',
    badgeBorder: '#99f6e4',
  },
};

export function getOperatorColor(operatorName: string): OperatorColorTheme {
  const key = Object.keys(OPERATOR_COLORS).find(
    (k) => k.toLowerCase() === operatorName.trim().toLowerCase()
  );
  return key ? OPERATOR_COLORS[key] : OPERATOR_COLORS.Nico;
}


export const OPERATOR_PROFILES: Record<OperatorKey, {
  label: string;
  n: number;
  weightedCycleSec: number;
  weightedCycleMin: number;
  activeFrictionSec: number;
  mudaPct: number;
  mudaSec: number;
  summary: string;
}> = {
  global: {
    label: 'Consolidado Global (n=43)',
    n: 43,
    weightedCycleSec: 360.0,
    weightedCycleMin: 6.00,
    activeFrictionSec: 360.0,
    mudaPct: 35.3,
    mudaSec: 127.2,
    summary: 'Ciclo ponderado 360,0 s (6,00 min) con 35,3% de Muda física (127,2 s entre caminata y espera)',
  },
  gustavo: {
    label: 'Gustavo (n=13)',
    n: 13,
    weightedCycleSec: 379.3,
    weightedCycleMin: 6.32,
    activeFrictionSec: 670.2,
    mudaPct: 46.2,
    mudaSec: 162.7,
    summary: 'Ponderado: 379,3 s | Activo con fricción: 670,2 s (46,2% Muda) · Pico máx E8: 460 s (Obs 12)',
  },
  ana: {
    label: 'Ana (n=14)',
    n: 14,
    weightedCycleSec: 423.6,
    weightedCycleMin: 7.06,
    activeFrictionSec: 727.1,
    mudaPct: 43.3,
    mudaSec: 136.8,
    summary: 'Ponderado: 423,6 s | Activo con fricción: 727,1 s (43,3% Muda) · Picos E4: 365 s y E5: 546 s (Obs 4)',
  },
  melina: {
    label: 'Melina (n=16)',
    n: 16,
    weightedCycleSec: 288.6,
    weightedCycleMin: 4.81,
    activeFrictionSec: 427.8,
    mudaPct: 36.8,
    mudaSec: 90.0,
    summary: 'Ponderado: 288,6 s | Activo con fricción: 427,8 s (36,8% Muda) · Mayor agilidad en E1 y E3',
  },
};

export const HTC_STAGES: StageHTC[] = [
  {
    id: 'E1',
    code: 'E1',
    name: 'Atención al cliente y recepción orden (Lado Sur Mostrador)',
    type: 'Manual',
    globalSec: 70.8,
    globalPct: 19.7,
    gustavoSec: 86.7,
    anaSec: 98.0,
    melinaSec: 34.0,
    toBeSec: 45.0,
    sectorId: 'sec2',
    coordsAsIs: { x: 245, y: 442 },
    coordsToBe: { x: 245, y: 442 },
  },
  {
    id: 'E2',
    code: 'E2',
    name: 'Caminata inicial a estantería/depósito',
    type: 'Muda',
    globalSec: 48.5,
    globalPct: 13.5,
    gustavoSec: 62.5,
    anaSec: 37.5,
    melinaSec: 46.7,
    toBeSec: 17.0,
    sectorId: 'sec3',
    coordsAsIs: { x: 515, y: 385 },
    coordsToBe: { x: 475, y: 365 },
  },
  {
    id: 'E3',
    code: 'E3',
    name: 'Búsqueda visual por memoria (Sin codificar)',
    type: 'Muda',
    globalSec: 39.6,
    globalPct: 11.0,
    gustavoSec: 47.2,
    anaSec: 57.9,
    melinaSec: 17.4,
    toBeSec: 13.9,
    sectorId: 'sec6',
    coordsAsIs: { x: 565, y: 215 },
    coordsToBe: { x: 500, y: 340 },
  },
  {
    id: 'E4',
    code: 'E4',
    name: 'Remoción de cajas/obstáculos en pasillo',
    type: 'Muda',
    globalSec: 19.6,
    globalPct: 5.5,
    gustavoSec: 26.2,
    anaSec: 29.5,
    melinaSec: 5.7,
    toBeSec: 0.0,
    peakNote: 'Pico máx: 365 s en Obs 4 de Ana',
    sectorId: 'sec3',
    coordsAsIs: { x: 485, y: 445 },
    coordsToBe: { x: 490, y: 355 },
  },
  {
    id: 'E5',
    code: 'E5',
    name: 'Picking / corte fraccionado de cable',
    type: 'Manual VA',
    globalSec: 61.3,
    globalPct: 17.0,
    gustavoSec: 17.7,
    anaSec: 112.9,
    melinaSec: 51.7,
    toBeSec: 42.0,
    peakNote: 'Pico máx: 546 s en Obs 4 de Ana',
    sectorId: 'sec7',
    coordsAsIs: { x: 395, y: 235 },
    coordsToBe: { x: 465, y: 350 },
  },
  {
    id: 'E6',
    code: 'E6',
    name: 'Caminata de retorno a mostrador',
    type: 'Muda',
    globalSec: 19.5,
    globalPct: 5.4,
    gustavoSec: 26.8,
    anaSec: 11.9,
    melinaSec: 20.2,
    toBeSec: 6.8,
    sectorId: 'sec2',
    coordsAsIs: { x: 265, y: 495 },
    coordsToBe: { x: 365, y: 390 },
  },
  {
    id: 'E7',
    code: 'E7',
    name: 'Verificación y empaque (Lado Sur Mostrador)',
    type: 'Manual VA',
    globalSec: 25.6,
    globalPct: 7.1,
    gustavoSec: 38.5,
    anaSec: 2.1,
    melinaSec: 35.8,
    toBeSec: 25.6,
    sectorId: 'sec2',
    coordsAsIs: { x: 310, y: 442 },
    coordsToBe: { x: 310, y: 442 },
  },
  {
    id: 'E8',
    code: 'E8',
    name: 'Facturación y descuento de material en sistema (PC · Lado Sur Mostrador)',
    type: 'Auto',
    globalSec: 75.0,
    globalPct: 20.8,
    gustavoSec: 73.8,
    anaSec: 73.6,
    melinaSec: 77.3,
    toBeSec: 65.7,
    peakNote: 'Pico máx: 460 s en Obs 12 de Gustavo',
    sectorId: 'sec2',
    coordsAsIs: { x: 156, y: 442 },
    coordsToBe: { x: 156, y: 442 },
  },
];

// 7 Official Sectors from CAD Reference (Sector 3 and Sector 4 have the exact same width w=230 and h=220 / 412 cm)
export const SECTORS: SectorBox[] = [
  {
    id: 'sec1',
    refNum: 1,
    name: '1- Vidriera Principal / Show Room Luminarias',
    subtitle: 'Exhibición Colgada de Techo, Montada y en Piso',
    aisleWidth: 'Frente diagonal 725 cm · Interior 400,2 × 270,3 cm',
    cotasPlano: '725 cm / 400,2 cm / 270,3 cm / 150 cm · Vidriera 626 × 220 cm',
    x: 45,
    y: 52,
    w: 173,
    h: 253,
    polygon: '45,305 145,52 218,122 146,272 115,305',
    badgeX: 112,
    badgeY: 175,
    zHeight: 75,
    colorAsIs: '#d97706',
    colorToBe: '#059669',
    heatLevelAsIs: 0.62,
    heatLevelToBe: 0.15,
    familiesAsIs: [
      'Productos exhibidos colgados del techo y en piso',
      'Acera exterior a 15 m (Recepción 5 lotes / 13 cajas)',
    ],
    familiesToBe: [
      'Show Room Luminarias despejado de cajas',
      'Recepción programada con carro staging (R4-R5)',
    ],
    obsoletePctAsIs: 15,
  },
  {
    id: 'sec2',
    refNum: 2,
    name: '2- Salón de Ventas (Mostrador, PC y Gaveteros A-H)',
    subtitle: 'Atención, Computadora, Bobinas en Piso y 8 Estanterías',
    aisleWidth: 'Pasillos entre estanterías A-H: 0,50 m (50 cm)',
    cotasPlano: 'Largo salón 836 cm · Pasillo 240 cm · Gaveteros 180 × 30 cm c/50 cm',
    x: 45,
    y: 310,
    w: 395,
    h: 255,
    zHeight: 55,
    colorAsIs: '#e11d48',
    colorToBe: '#0d9488',
    heatLevelAsIs: 0.92,
    heatLevelToBe: 0.25,
    familiesAsIs: [
      'Est. A-H (8 cubículos, 2,00×1,80×0,30 m): Tornillería y gomitas',
      'Bobinas de Cables en Piso (100×240 cm) + 13 cajas R4=0',
      'Lado Sur del Mostrador: Atención al cliente (E1), Empaque (E7), Facturación y descuento de material en PC (E8)',
    ],
    familiesToBe: [
      'Gaveteros A-H codificados Clase A (Térmicas/Tornillería)',
      'Eliminación de bobinas sueltas y cajas frente a mostrador',
    ],
    obsoletePctAsIs: 15,
  },
  {
    id: 'sec3',
    refNum: 3,
    name: '3- Salón Depósito N°1 (Est. A a K y Escalera frente a G)',
    subtitle: 'Mismo ancho de planta que Sector 4 (412 cm) · Escalera frente a Est. G',
    aisleWidth: '0,52 m (52 cm), 0,58 m, 0,696 m y 2 aberturas de 0,77 m (77 cm)',
    cotasPlano: 'Ancho igual a S4 (412 cm / 520 cm) · Aberturas de 77 cm a S2 y S6',
    x: 440,
    y: 310,
    w: 230,
    h: 220,
    zHeight: 78,
    colorAsIs: '#dc2626',
    colorToBe: '#059669',
    heatLevelAsIs: 0.98,
    heatLevelToBe: 0.20,
    familiesAsIs: [
      'Est. G (Eléctrica 2,73m) con Escalera ubicada justo al frente',
      'Est. A (Cables bobina 2,67m), Est. B (Caños PVC 3,00×1,60m)',
      'Est. C, D, H, I (Conectores galv.), Est. E, F (Ilum.), Est. J y K',
    ],
    familiesToBe: [
      'Núcleo ABC Clase A consolidado (k=1 sector)',
      'Pasillos y aberturas de 77 cm liberados (E4 = 0,0 s)',
    ],
    obsoletePctAsIs: 20,
  },
  {
    id: 'sec4',
    refNum: 4,
    name: '4- Entrepiso Depósito N°2 (Nivel Superior A a H)',
    subtitle: 'Mismo ancho que Sector 3 (412 cm) · Conectado por Escalera',
    aisleWidth: 'Pasillos de 0,64 m (64 cm), 0,70 m, 0,72 m y 0,90 m',
    cotasPlano: 'Ancho igual a S3 (412 cm / 481 cm) · Est. B (270×72 cm) · Pasillos 70, 64 y 90 cm',
    x: 690,
    y: 310,
    w: 230,
    h: 220,
    zHeight: 65,
    zBase: 25,
    colorAsIs: '#f59e0b',
    colorToBe: '#0284c7',
    heatLevelAsIs: 0.76,
    heatLevelToBe: 0.15,
    familiesAsIs: [
      'Est. A (Tacos Fischer), Est. B y F (Extractores, LED, Foco jardín)',
      'Est. C (LED, Bobinas cable, Ductos 2,75m), Est. D y E (Lámparas LED)',
      'Est. G (Tableros, Fichas, LED), Est. H (Caños 1,60m)',
    ],
    familiesToBe: [
      'Clase C y stock estacional codificado en Entrepiso',
      'Cero subida/bajada por artículos de alta rotación (Clase A)',
    ],
    obsoletePctAsIs: 20,
  },
  {
    id: 'sec5',
    refNum: 5,
    name: '5- Oficina con Baño Depósito N°3 (Est. A a D)',
    subtitle: 'Sector Posterior Derecho con Abertura de 68 cm y Baño (65 cm)',
    aisleWidth: 'Abertura acceso 0,68 m (68 cm) · Paso Baño 0,65 m (65 × 170 cm)',
    cotasPlano: '244 × 255 cm (168 cm) · Baño 170 × 65 cm · Estante a 0,70 m del piso',
    x: 615,
    y: 120,
    w: 145,
    h: 185,
    zHeight: 64,
    colorAsIs: '#ea580c',
    colorToBe: '#0284c7',
    heatLevelAsIs: 0.75,
    heatLevelToBe: 0.10,
    familiesAsIs: [
      'Est. A (Módulos, Tapas 1,60m), Est. B (Módulos y Tapas 2,44m)',
      'Est. C y D (Plaquetas, LED, Lámpara escritorio · h piso 0,70m)',
    ],
    familiesToBe: [
      'Oficina técnica despejada y módulos organizados',
      'Depuración del 100% de plafones de vidrio obsoletos',
    ],
    obsoletePctAsIs: 18,
  },
  {
    id: 'sec6',
    refNum: 6,
    name: '6- Salón Depósito N°4 (Estanterías A a G · h=3,10 m)',
    subtitle: 'Nodo Central Conectado por 3 Aberturas (77 cm, 84 cm y 68 cm)',
    aisleWidth: 'Aberturas de 77 cm (a S3), 84 cm (a S7), 68 cm (a S5) y pasillo 100 cm',
    cotasPlano: 'Ancho 290 cm · Aberturas 77 cm, 84 cm, 68 cm y pasillo 100 cm',
    x: 480,
    y: 120,
    w: 130,
    h: 185,
    zHeight: 85,
    colorAsIs: '#e11d48',
    colorToBe: '#0d9488',
    heatLevelAsIs: 0.86,
    heatLevelToBe: 0.18,
    familiesAsIs: [
      'Est. A y B (Plafones LED, Curvas PVC, Grampas · 3,10×2,55m)',
      'Est. C (Plaquetas LED), Est. D (Accesorios), Mód. E (Módulos 3,10m)',
      'Est. F (Interruptores unipolar 3,10m), Est. G (Caños galv. 2,60m)',
    ],
    familiesToBe: [
      'Clase B consolidada con pasillo central libre de 1,00 m',
      'Separación neta entre Plafones LED nuevos y obsoletos',
    ],
    obsoletePctAsIs: 20,
  },
  {
    id: 'sec7',
    refNum: 7,
    name: '7- Salón Depósito N°5 (Estanterías A a J · Bobinas y Caños)',
    subtitle: 'Nave Diagonal (3,10 m) · Acceso desde S1 y S2 vía A5 → A6 → A7 (84 cm)',
    aisleWidth: 'Largo base 780 cm · Diagonal 540 cm · Acceso por A7 (84 cm) vía A5 → A6 → A7',
    cotasPlano: '780 cm × 540 cm diagonal · Est. A (230×62 cm) · Sin abertura a S1 (muro cerrado)',
    x: 145,
    y: 16,
    w: 330,
    h: 289,
    polygon: '145,52 168,16 375,120 475,120 475,305 115,305 146,272 218,122',
    badgeX: 274,
    badgeY: 232,
    zHeight: 88,
    colorAsIs: '#dc2626',
    colorToBe: '#059669',
    heatLevelAsIs: 0.94,
    heatLevelToBe: 0.22,
    familiesAsIs: [
      'Est. E, G, H, J (Cables Bobina dispersos · 3,10m alto · D4 ≥ 120s)',
      'Est. C (Caños galv. 5,40m), Est. D (Luminarias LED 18 cub. 3,23m)',
      'Est. A (Cajas ext.), Est. B (Fichas), Mód. F (Bombas), Est. I (Plaquetas)',
    ],
    familiesToBe: [
      'Centro único de bobinas mayoristas y caños de 5,40 m',
      'Estación de medición y corte rápido Diors (E5 ≤ 42,0 s)',
    ],
    obsoletePctAsIs: 18,
  },
];

// Official Architectural Openings (Aberturas / Vanos de Paso) from CAD Blueprint
// Note: There is NO opening (A3) between Sector 1 and Sector 7; reaching Sector 7 from S1/S2 requires A5 -> A6 -> A7.
export const LAYOUT_OPENINGS: LayoutOpening[] = [
  {
    id: 'ab-1',
    code: 'A1',
    name: 'Acceso Principal Exterior (Calle → Salón S2)',
    widthCm: '220 cm',
    connects: 'Acera Exterior ↔ Sector 2 (Pasillo 240 cm)',
    x1: 45,
    y1: 312,
    x2: 45,
    y2: 392,
    labelX: 66,
    labelY: 355,
  },
  {
    id: 'ab-2',
    code: 'A2',
    name: 'Abertura Base Show Room Luminarias (S1 ↔ S2)',
    widthCm: '150 cm',
    connects: 'Base triángulo Show Room (lado 725 cm) ↔ Salón S2',
    x1: 45,
    y1: 305,
    x2: 115,
    y2: 305,
    labelX: 80,
    labelY: 296,
  },
  {
    id: 'ab-4',
    code: 'A4',
    name: 'Paso Lateral Mostrador (Lado Sur Mostrador ↔ Pasillos S2)',
    widthCm: '75 / 100 cm',
    connects: 'Lado Sur del Mostrador (E1/E7/E8) ↔ Pasillo Principal S2 (240 cm)',
    x1: 350,
    y1: 424,
    x2: 382,
    y2: 424,
    labelX: 366,
    labelY: 416,
  },
  {
    id: 'ab-5',
    code: 'A5',
    name: 'Abertura Inferior Salón a Depósito N°1 (S2 ↔ S3)',
    widthCm: '77 cm',
    connects: 'Sector 2 (junto a Est. A) ↔ Sector 3 (bajo Est. J / Est. A)',
    x1: 440,
    y1: 472,
    x2: 440,
    y2: 514,
    labelX: 432,
    labelY: 495,
  },
  {
    id: 'ab-6',
    code: 'A6',
    name: 'Abertura Central Depósito N°1 a Depósito N°4 (S3 ↔ S6)',
    widthCm: '77 cm',
    connects: 'Sector 3 (entre Est. K y Est. G/Escalera) ↔ Sector 6 (Est. A)',
    x1: 492,
    y1: 310,
    x2: 530,
    y2: 310,
    labelX: 511,
    labelY: 306,
  },
  {
    id: 'ab-7',
    code: 'A7',
    name: 'Abertura Depósito N°4 a Depósito N°5 (S6 ↔ S7)',
    widthCm: '84 cm',
    connects: 'Sector 6 (Pasillo 100 cm) ↔ Sector 7 (entre Est. A y Est. J)',
    x1: 478,
    y1: 146,
    x2: 478,
    y2: 178,
    labelX: 478,
    labelY: 164,
  },
  {
    id: 'ab-8',
    code: 'A8',
    name: 'Abertura Depósito N°4 a Oficina Depósito N°3 (S6 ↔ S5)',
    widthCm: '68 cm',
    connects: 'Sector 6 (junto a Est. B) ↔ Sector 5 (Oficina Est. A y B)',
    x1: 615,
    y1: 132,
    x2: 615,
    y2: 160,
    labelX: 615,
    labelY: 148,
  },
  {
    id: 'ab-9',
    code: 'A9',
    name: 'Abertura Puerta de Baño en Sector 5',
    widthCm: '65 cm',
    connects: 'Sector 5 (Oficina bajo Est. D) ↔ Baño (170 × 65 cm)',
    x1: 616,
    y1: 242,
    x2: 658,
    y2: 242,
    labelX: 637,
    labelY: 238,
  },
];

// Complete Shelf Inventory mapped directly from the CAD Blueprint & Reference Slides
// (Show Room and Vidriera are floor legends only, not shelf blocks)
export const SHELF_UNITS: ShelfUnit[] = [
  // SECTOR 2: Salón de Ventas (8 Gaveteros H..A + Bobinas en piso + Mostrador y PC)
  { id: 's2-bob', code: 'Piso', label: 'Bobinas de Cables en Piso', contenido: 'Bobinas sueltas + 13 cajas recepción truncada R4=0', cubiculos: 4, altoM: 1.00, largoM: 2.40, profM: 1.00, family: 'obsoleto', sectorId: 'sec2', x: 115, y: 318, w: 195, d: 34, h: 28, asIsOnly: true },
  { id: 's2-pc', code: 'PC', label: 'Computadora (Lado Sur Mostrador)', contenido: 'Facturación y descuento de material en el sistema del lado sur del mostrador (E8 / D5)', cubiculos: 2, altoM: 1.10, largoM: 1.40, profM: 0.65, family: 'mostrador', sectorId: 'sec2', x: 120, y: 400, w: 72, d: 24, h: 32 },
  { id: 's2-most1', code: 'Mostrador', label: 'Mostrador Horizontal (Atención Lado Sur)', contenido: 'Atención al cliente (E1) y verificación/empaque (E7) del lado sur del mostrador', cubiculos: 4, altoM: 1.05, largoM: 3.20, profM: 0.65, family: 'mostrador', sectorId: 'sec2', x: 194, y: 400, w: 156, d: 24, h: 32, toBeLabel: 'Mostrador + Corte Rápido' },
  { id: 's2-most2', code: 'Mostrador-V', label: 'Mostrador Vertical (330cm)', contenido: 'Ala vertical mostrador (cota 330 × 40 cm · paso 100 cm)', cubiculos: 3, altoM: 1.05, largoM: 3.30, profM: 0.40, family: 'mostrador', sectorId: 'sec2', x: 332, y: 355, w: 22, d: 68, h: 32 },

  // 8 Estanterías paralelas H, G, F, E, D, C, B, A en Sector 2 (separadas por pasillos de 50 cm)
  { id: 's2-H', code: 'Est. H (S2)', label: 'Est. H (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 122, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-G', code: 'Est. G (S2)', label: 'Est. G (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 158, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-F', code: 'Est. F (S2)', label: 'Est. F (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 194, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-E', code: 'Est. E (S2)', label: 'Est. E (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 230, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-D', code: 'Est. D (S2)', label: 'Est. D (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas (Pasillo 50 cm)', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 266, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-C', code: 'Est. C (S2)', label: 'Est. C (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas (Pasillo 50 cm)', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 302, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-B', code: 'Est. B (S2)', label: 'Est. B (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas (Pasillo 50 cm)', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 338, y: 482, w: 16, d: 72, h: 52 },
  { id: 's2-A', code: 'Est. A (S2)', label: 'Est. A (Salón)', contenido: 'Tornillería, accesorios pequeños, gomitas (Cota 220 cm)', cubiculos: 8, altoM: 2.00, largoM: 1.80, profM: 0.30, family: 'gaveteros', sectorId: 'sec2', x: 374, y: 482, w: 16, d: 72, h: 52 },

  // SECTOR 3: Salón Depósito N°1 (Estanterías A a K + Escalera colocada frente a Estantería G)
  { id: 's3-K', code: 'Est. K (S3)', label: 'Est. K: Insumos y Eléctrica', contenido: 'Insumos y eléctrica (junto a abertura 77 cm)', cubiculos: 3, altoM: 2.22, largoM: 0.66, profM: 1.14, family: 'gaveteros', sectorId: 'sec3', x: 445, y: 315, w: 44, d: 28, h: 58 },
  { id: 's3-I', code: 'Est. I (S3)', label: 'Est. I: Conectores Galv.', contenido: 'Conectores galvanizados', cubiculos: 7, altoM: 1.84, largoM: 0.60, profM: 0.30, family: 'canos', sectorId: 'sec3', x: 445, y: 350, w: 22, d: 34, h: 48 },
  { id: 's3-J', code: 'Est. J (S3)', label: 'Est. J: Tubos LED y Lámparas', contenido: 'Tubos LED y lámparas (sobre abertura 77 cm)', cubiculos: 3, altoM: 3.00, largoM: 1.60, profM: 1.25, family: 'sirio', sectorId: 'sec3', x: 445, y: 392, w: 48, d: 76, h: 78, toBeLabel: 'ABC-A1: Cables Diors' },
  { id: 's3-A', code: 'Est. A (S3)', label: 'Est. A: Cables Bobina', contenido: 'Cables bobina (Pasillo 52 cm y abertura 77 cm)', cubiculos: 6, altoM: 2.67, largoM: 1.43, profM: 0.42, family: 'diors', sectorId: 'sec3', x: 465, y: 502, w: 68, d: 22, h: 70 },
  { id: 's3-G', code: 'Est. G (S3)', label: 'Est. G: Eléctrica (290cm)', contenido: 'Eléctrica (Escalera ubicada justo enfrente)', cubiculos: 5, altoM: 2.73, largoM: 2.50, profM: 0.65, family: 'gaveteros', sectorId: 'sec3', x: 532, y: 315, w: 124, d: 22, h: 71 },
  { id: 's3-C', code: 'Est. C (S3)', label: 'Est. C: Conectores Galv.', contenido: 'Conectores galvanizados (Pasillo 58 cm)', cubiculos: 9, altoM: 2.73, largoM: 0.60, profM: 0.40, family: 'canos', sectorId: 'sec3', x: 526, y: 400, w: 22, d: 28, h: 71 },
  { id: 's3-D', code: 'Est. D (S3)', label: 'Est. D: Conectores Galv.', contenido: 'Conectores galvanizados (Pasillo 58 cm)', cubiculos: 9, altoM: 2.73, largoM: 0.60, profM: 0.40, family: 'canos', sectorId: 'sec3', x: 526, y: 434, w: 22, d: 28, h: 71 },
  { id: 's3-H', code: 'Est. H (S3)', label: 'Est. H: Conectores Galv.', contenido: 'Conectores galvanizados (frente a Est. G / lado Escalera)', cubiculos: 10, altoM: 2.65, largoM: 0.60, profM: 1.25, family: 'canos', sectorId: 'sec3', x: 576, y: 368, w: 24, d: 26, h: 69 },
  { id: 's3-E', code: 'Est. E (S3)', label: 'Est. E: Ilum. y Tornillería', contenido: 'Iluminación y tornillería', cubiculos: 5, altoM: 2.00, largoM: 0.85, profM: 0.30, family: 'sirio', sectorId: 'sec3', x: 602, y: 368, w: 62, d: 22, h: 52 },
  { id: 's3-F', code: 'Est. F (S3)', label: 'Est. F: Ilum. y Tornillería', contenido: 'Iluminación y tornillería (Cota 69,6 cm)', cubiculos: 5, altoM: 2.00, largoM: 0.85, profM: 0.30, family: 'sirio', sectorId: 'sec3', x: 572, y: 422, w: 88, d: 20, h: 52 },
  { id: 's3-B', code: 'Est. B (S3)', label: 'Est. B: Caños PVC Blanco', contenido: 'Caños PVC blanco para cable (520 cm)', cubiculos: 6, altoM: 2.20, largoM: 3.00, profM: 1.60, family: 'canos', sectorId: 'sec3', x: 550, y: 446, w: 114, d: 76, h: 57 },

  // SECTOR 4: Entrepiso Depósito N°2 (Mismo ancho que Sector 3 · Estanterías A a H)
  { id: 's4-A', code: 'Est. A (S4)', label: 'Est. A: Tacos Fischer', contenido: 'Tacos Fischer (junto a desembarco Escalera)', cubiculos: 4, altoM: 1.06, largoM: 0.60, profM: 0.40, family: 'gaveteros', sectorId: 'sec4', x: 734, y: 318, w: 28, d: 24, h: 28, zBase: 25 },
  { id: 's4-B', code: 'Est. B (S4)', label: 'Est. B: Extractores y LED', contenido: 'Extractores, LED, T. Fischer (270×72 cm)', cubiculos: 3, altoM: 2.40, largoM: 2.70, profM: 0.72, family: 'sirio', sectorId: 'sec4', x: 770, y: 318, w: 105, d: 34, h: 62, zBase: 25 },
  { id: 's4-C', code: 'Est. C (S4)', label: 'Est. C: LED, Bobinas, Ductos', contenido: 'LED, Bobinas cable, Ductos (Pasillo 70 cm)', cubiculos: 2, altoM: 0.90, largoM: 2.75, profM: 0.40, family: 'diors', sectorId: 'sec4', x: 696, y: 382, w: 22, d: 110, h: 24, zBase: 25 },
  { id: 's4-D', code: 'Est. D (S4)', label: 'Est. D: Lámparas LED', contenido: 'Lámparas LED', cubiculos: 3, altoM: 2.02, largoM: 0.84, profM: 0.30, family: 'sirio', sectorId: 'sec4', x: 748, y: 398, w: 18, d: 42, h: 53, zBase: 25 },
  { id: 's4-E', code: 'Est. E (S4)', label: 'Est. E: Colillas y LED', contenido: 'Colillas, Lámparas LED (Pasillos 64 y 90 cm)', cubiculos: 2, altoM: 1.92, largoM: 2.00, profM: 0.60, family: 'sirio', sectorId: 'sec4', x: 768, y: 404, w: 80, d: 34, h: 50, zBase: 25 },
  { id: 's4-F', code: 'Est. F (S4)', label: 'Est. F: Extractores y Foco Jardín', contenido: 'Extractores, LED, Foco jardín', cubiculos: 3, altoM: 2.50, largoM: 2.80, profM: 0.65, family: 'obsoleto', sectorId: 'sec4', x: 882, y: 324, w: 30, d: 145, h: 65, zBase: 25, toBeFamily: 'sirio' },
  { id: 's4-G1', code: 'Est. G (S4)', label: 'Est. G: Tableros y Fichas', contenido: 'Tableros, Fichas, LED, Lámparas', cubiculos: 4, altoM: 2.40, largoM: 0.90, profM: 0.60, family: 'gaveteros', sectorId: 'sec4', x: 726, y: 492, w: 48, d: 30, h: 62, zBase: 25 },
  { id: 's4-H', code: 'Est. H (S4)', label: 'Est. H: Caños', contenido: 'Caños', cubiculos: 6, altoM: 1.60, largoM: 0.60, profM: 0.40, family: 'canos', sectorId: 'sec4', x: 795, y: 496, w: 34, d: 26, h: 42, zBase: 25 },
  { id: 's4-G2', code: 'Est. G2 (S4)', label: 'Est. G: Tableros y LED', contenido: 'Tableros, Fichas, LED, Lámparas', cubiculos: 4, altoM: 2.40, largoM: 0.90, profM: 0.60, family: 'gaveteros', sectorId: 'sec4', x: 842, y: 492, w: 56, d: 30, h: 62, zBase: 25 },

  // SECTOR 5: Oficina con Baño Depósito N°3 (Estanterías A a D)
  { id: 's5-B', code: 'Est. B (S5)', label: 'Est. B: Módulos y Tapas', contenido: 'Módulos y tapas (Cota 244 cm · junto a abertura 68 cm)', cubiculos: 6, altoM: 2.44, largoM: 0.84, profM: 0.35, family: 'gaveteros', sectorId: 'sec5', x: 642, y: 126, w: 62, d: 20, h: 63 },
  { id: 's5-C', code: 'Est. C (S5)', label: 'Est. C: Plaquetas y Lámpara', contenido: 'Plaquetas, LED, Lámpara escritorio (Cota 255 cm)', cubiculos: 3, altoM: 2.40, largoM: 1.40, profM: 0.66, family: 'sirio', sectorId: 'sec5', x: 726, y: 142, w: 26, d: 66, h: 62 },
  { id: 's5-A', code: 'Est. A (S5)', label: 'Est. A: Módulos, Tapas', contenido: 'Módulos, tapas (bajo abertura de 68 cm)', cubiculos: 3, altoM: 1.48, largoM: 1.60, profM: 0.35, family: 'gaveteros', sectorId: 'sec5', x: 618, y: 162, w: 20, d: 68, h: 38 },
  { id: 's5-D', code: 'Est. D (S5)', label: 'Est. D: Lámpara Escritorio', contenido: 'Lámpara escritorio, LED (Piso a estante: 0,70 m)', cubiculos: 2, altoM: 1.20, largoM: 1.10, profM: 0.65, notaAltura: '0,70 m del piso', family: 'obsoleto', sectorId: 'sec5', x: 658, y: 202, w: 56, d: 34, h: 32, toBeFamily: 'sirio' },

  // SECTOR 6: Salón Depósito N°4 (Estanterías A a G)
  { id: 's6-B', code: 'Est. B (S6)', label: 'Est. B: Plafones LED y Curvas', contenido: 'Plafones LED, Curvas PVC, Grampas, Conexiones', cubiculos: 3, altoM: 3.10, largoM: 2.55, profM: 0.60, family: 'obsoleto', sectorId: 'sec6', x: 492, y: 126, w: 108, d: 24, h: 80, toBeFamily: 'sirio' },
  { id: 's6-A', code: 'Est. A (S6)', label: 'Est. A: Plafones LED y Curvas', contenido: 'Plafones LED, Curvas PVC, Grampas (Alto 3,10 m)', cubiculos: 3, altoM: 3.10, largoM: 2.55, profM: 0.60, family: 'obsoleto', sectorId: 'sec6', x: 505, y: 184, w: 26, d: 108, h: 80, toBeFamily: 'sirio' },
  { id: 's6-C', code: 'Est. C (S6)', label: 'Est. C: Plaquetas LED', contenido: 'Plaquetas, LED', cubiculos: 5, altoM: 1.34, largoM: 0.60, profM: 0.40, family: 'sirio', sectorId: 'sec6', x: 548, y: 184, w: 22, d: 26, h: 35 },
  { id: 's6-D', code: 'Est. D (S6)', label: 'Est. D: Accesorios Varios', contenido: 'Accesorios varios (Piso a estante: 0,70 m)', cubiculos: 6, altoM: 1.60, largoM: 0.60, profM: 0.40, notaAltura: '0,70 m del piso', family: 'gaveteros', sectorId: 'sec6', x: 548, y: 214, w: 22, d: 26, h: 42 },
  { id: 's6-E', code: 'Mód. E (S6)', label: 'Módulos E: Placas y Ciegos', contenido: 'Módulos ciegos, exterior, placas (Alto 3,10 m)', cubiculos: 3, altoM: 3.10, largoM: 2.45, profM: 0.60, family: 'gaveteros', sectorId: 'sec6', x: 576, y: 184, w: 26, d: 108, h: 80 },
  { id: 's6-F', code: 'Est. F (S6)', label: 'Est. F: Interruptores Unipolar', contenido: 'Interruptores unipolar (Cota 290 cm)', cubiculos: 3, altoM: 3.10, largoM: 1.00, profM: 0.60, family: 'gaveteros', sectorId: 'sec6', x: 534, y: 266, w: 40, d: 26, h: 80 },

  // SECTOR 7: Salón Depósito N°5 (Estanterías A a J alineadas al polígono real sin invadir Sector 1)
  { id: 's7-C', code: 'Est. C (S7)', label: 'Est. C: Caños Galv. (5,40m)', contenido: 'Caños galvanizados y curvas (Cota diagonal 540 cm)', cubiculos: 5, altoM: 3.10, largoM: 5.40, profM: 0.30, family: 'canos', sectorId: 'sec7', x: 182, y: 62, w: 168, d: 15, h: 80, angleDeg: 27 },
  { id: 's7-D', code: 'Est. D (S7)', label: 'Est. D: Luminarias LED (18 cub.)', contenido: 'Luminarias LED (18 cubículos · Cota 270,3 cm)', cubiculos: 18, altoM: 3.10, largoM: 3.23, profM: 0.35, family: 'sirio', sectorId: 'sec7', x: 152, y: 72, w: 82, d: 15, h: 80, angleDeg: 44 },
  { id: 's7-B', code: 'Est. B (S7)', label: 'Est. B: Fichas Enchufe', contenido: 'Fichas enchufe', cubiculos: 4, altoM: 2.60, largoM: 0.84, profM: 0.30, family: 'gaveteros', sectorId: 'sec7', x: 344, y: 104, w: 26, d: 16, h: 68, angleDeg: 27 },
  { id: 's7-A', code: 'Est. A (S7)', label: 'Est. A: Cajas Exteriores', contenido: 'Cajas exteriores, módulos (Cota 230 × 62 cm · junto a abertura 84 cm)', cubiculos: 5, altoM: 3.10, largoM: 2.40, profM: 0.45, family: 'gaveteros', sectorId: 'sec7', x: 375, y: 124, w: 94, d: 22, h: 80 },
  { id: 's7-E', code: 'Est. E (S7)', label: 'Est. E: Cable Bobina y Corrugado', contenido: 'Cable bobina, caño corrugado (3,05 × 1,50 m)', cubiculos: 2, altoM: 3.10, largoM: 3.05, profM: 1.50, family: 'diors', sectorId: 'sec7', x: 174, y: 184, w: 102, d: 36, h: 80, angleDeg: -63 },
  { id: 's7-I', code: 'Est. I (S7)', label: 'Est. I: Plaquetas e Interrup.', contenido: 'Plaquetas e interruptores', cubiculos: 5, altoM: 2.00, largoM: 0.85, profM: 0.30, family: 'gaveteros', sectorId: 'sec7', x: 306, y: 180, w: 18, d: 40, h: 52 },
  { id: 's7-J', code: 'Est. J (S7)', label: 'Est. J: Cable Bobina y Tableros', contenido: 'Cable bobina, tableros, caja (3,40 × 0,96 m · junto a abertura 84 cm)', cubiculos: 7, altoM: 3.10, largoM: 3.40, profM: 0.96, family: 'diors', sectorId: 'sec7', x: 326, y: 176, w: 142, d: 44, h: 80 },
  { id: 's7-H', code: 'Est. H (S7)', label: 'Est. H: Cable Bobina', contenido: 'Cable bobina (3,10 m alto)', cubiculos: 3, altoM: 3.10, largoM: 0.80, profM: 0.80, family: 'diors', sectorId: 'sec7', x: 432, y: 224, w: 36, d: 34, h: 80 },
  { id: 's7-G', code: 'Est. G (S7)', label: 'Est. G: Tubos LED y Cable Bobina', contenido: 'Tubos LED, cable bobina (5,20 × 0,80 m · Cota 780 cm)', cubiculos: 6, altoM: 3.10, largoM: 5.20, profM: 0.80, family: 'diors', sectorId: 'sec7', x: 282, y: 264, w: 186, d: 34, h: 80 },
  { id: 's7-F', code: 'Mód. F (S7)', label: 'Mód. F: Bomba Presurizadora', contenido: 'Bomba presurizadora, herramientas (2,60 m)', cubiculos: 6, altoM: 1.20, largoM: 2.60, profM: 0.20, family: 'gaveteros', sectorId: 'sec7', x: 125, y: 284, w: 135, d: 16, h: 32 },
];

export const PARETO_BOTTLENECKS: BottleneckItem[] = [
  {
    rank: 1,
    code: 'D3 / E4',
    title: 'Pasillo obstruido y remoción de cajas en el suelo',
    events: 11,
    pct: 28.2,
    detail: '11 eventos (28,2%) · Pasillos de 50 cm (Sector 2) y 52 a 77 cm (Sector 3) más Bobinas en Piso; pico máx 365 s (Obs 4 Ana).',
    sectorId: 'sec3',
    alertX: 495,
    alertY: 472,
  },
  {
    rank: 2,
    code: 'D5',
    title: 'Caída, lentitud o glitch en software a medida / PC ocupada',
    events: 10,
    pct: 25.6,
    detail: '10 casos (25,6%) · Lado Sur del Mostrador (PC Facturación y descuento de stock en Sector 2): E8 promedia 75,0 s con pico máx de 460 s en Obs 12 de Gustavo.',
    sectorId: 'sec2',
    alertX: 156,
    alertY: 432,
  },
  {
    rank: 3,
    code: 'D2',
    title: 'Consulta verbal por falta de señalización y memoria',
    events: 7,
    pct: 17.9,
    detail: '7 casos (17,9%) · Gaveteros A-H (Sector 2) y Sector 3 sin codificación; búsqueda E3 toma 39,6 s global (57,9 s en Ana).',
    sectorId: 'sec2',
    alertX: 250,
    alertY: 515,
  },
  {
    rank: 4,
    code: 'D7',
    title: 'Asesoramiento técnico prolongado en mostrador',
    events: 5,
    pct: 12.8,
    detail: '5 casos (12,8%) · Lado Sur del Mostrador (Atención al cliente en Sector 2): E1 toma 70,8 s global (98,0 s en Ana; 86,7 s en Gustavo).',
    sectorId: 'sec2',
    alertX: 245,
    alertY: 432,
  },
  {
    rank: 5,
    code: 'D4',
    title: 'Demora en medición y corte fraccionado de cable Diors',
    events: 4,
    pct: 10.3,
    detail: '4 códigos / 11 pedidos con E5 ≥ 120 s (10,3%) · Bobinas dispersas en Piso (S2), Est. A (S3), Est. C (S4) y Est. E/G/H/J (S7); pico 546 s.',
    sectorId: 'sec7',
    alertX: 385,
    alertY: 205,
  },
  {
    rank: 6,
    code: 'D1',
    title: 'Quiebre de stock aparente e inexistentes/obsoletos',
    events: 2,
    pct: 14.0,
    detail: '+3 a 5 min de búsqueda infructuosa: 2 casos directos y 14,0% real (6/43 pedidos) entre Sector 6 (Plafones) y Sector 4 (Entrepiso).',
    sectorId: 'sec6',
    alertX: 545,
    alertY: 155,
  },
];

export const RECEPTION_METRICS = {
  lotsCount: 5,
  totalBoxes: 13,
  doorTimeSec: 96.22,
  doorTimeMin: 1.60,
  r4LocationSec: 0.00,
  r5PutawaySec: 0.00,
  truncatedPct: 100,
  deferredMinRange: '20 a 30 min',
  deferredSecRange: '1.200 a 1.800 s',
  observer: 'Franco',
  distanceMeters: 15,
};

export const SHANNON_METRICS = {
  cycle: {
    title: 'Entropía del Ciclo (H_ciclo)',
    formula: 'H(P) = -Σ p_i · log₂(p_i)',
    actualBits: 1.876,
    actualPctMax: 93.8,
    hMaxBits: 2.000,
    targetBits: 1.350,
    targetPctMax: 67.5,
    dklBits: 0.1451,
  },
  spatial: {
    title: 'Entropía Espacial del Layout (H_esp)',
    formula: 'H_esp = log₂(k)',
    actualMinBits: 2.000,
    actualMaxBits: 2.322,
    kAsIs: '4 a 5 sectores',
    targetBits: 0.000,
    kToBe: '1 sector ABC',
    dklMinBits: 2.4487,
    dklMaxBits: 2.7504,
  },
  stockEri: {
    title: 'Entropía Binaria de Stock (H_b sobre ERI)',
    formula: 'H_b(p) = -p·log₂(p) - (1-p)·log₂(1-p)',
    baselineEriPct: 88,
    baselineFailPct: 12,
    baselineBits: 0.5294,
    baselineDklBits: 0.1735,
    empiricalEriPct: 86,
    empiricalFailPct: 14,
    empiricalBits: 0.5842,
    empiricalDklBits: 0.2310,
    isoTargetEriPct: 98,
    isoTargetFailPct: 2,
    isoTargetBits: 0.1414,
  },
  negentropy: {
    title: 'Neguentropía Inyectada (ΔH)',
    formula: 'ΔH = H_meta - H_empírico',
    deltaHBits: -0.4428,
    reductionPct: 75.80,
  },
  anomalies: {
    title: 'Frecuencia de Anomalías (D1-D9)',
    formula: 'D_KL(P||Q) = Σ p_i · log₂(p_i / q_i)',
    actualFailPct: 58.1,
    ordersWithFail: '25/43 pedidos (39 eventos)',
    targetFailPct: 10.0,
    hpBits: 0.9808,
    dklBits: 1.0142,
  },
};

export function calculateBinaryEntropy(pSuccess: number): number {
  if (pSuccess <= 0 || pSuccess >= 1) return 0;
  const q = 1 - pSuccess;
  const h = -pSuccess * Math.log2(pSuccess) - q * Math.log2(q);
  return Number(h.toFixed(4));
}

export function calculateKLDivergenceBinary(pActual: number, qTarget: number): number {
  if (pActual <= 0 || pActual >= 1 || qTarget <= 0 || qTarget >= 1) return 0;
  if (Math.abs(pActual - 0.88) < 1e-6 && Math.abs(qTarget - 0.98) < 1e-6) return 0.1735;
  const pFail = 1 - pActual;
  const qFail = 1 - qTarget;
  const dkl = pActual * Math.log2(pActual / qTarget) + pFail * Math.log2(pFail / qFail);
  return Number(dkl.toFixed(4));
}

export function calculateSpatialEntropy(kSectors: number): number {
  if (kSectors <= 1) return 0;
  return Number(Math.log2(kSectors).toFixed(3));
}

export function getOperatorStageTime(stage: StageHTC, op: OperatorKey, mode: LayoutMode): number {
  if (mode === 'to-be') return stage.toBeSec;
  switch (op) {
    case 'gustavo':
      return stage.gustavoSec;
    case 'ana':
      return stage.anaSec;
    case 'melina':
      return stage.melinaSec;
    default:
      return stage.globalSec;
  }
}

export function computeCycleSummary(op: OperatorKey, mode: LayoutMode) {
  const stages = HTC_STAGES.map((st) => ({
    ...st,
    seconds: getOperatorStageTime(st, op, mode),
  }));
  const totalSec = Number(stages.reduce((acc, s) => acc + s.seconds, 0).toFixed(1));
  const walkSec = Number(
    stages
      .filter((s) => s.id === 'E2' || s.id === 'E6')
      .reduce((acc, s) => acc + s.seconds, 0)
      .toFixed(1)
  );
  const searchSec = Number((stages.find((s) => s.id === 'E3')?.seconds ?? 0).toFixed(1));
  const obstacleSec = Number((stages.find((s) => s.id === 'E4')?.seconds ?? 0).toFixed(1));
  const mudaSec = Number((walkSec + searchSec + obstacleSec).toFixed(1));
  const mudaPct = totalSec > 0 ? Number(((mudaSec / totalSec) * 100).toFixed(1)) : 0;

  return {
    totalSec,
    totalMin: Number((totalSec / 60).toFixed(2)),
    walkSec,
    searchSec,
    obstacleSec,
    mudaSec,
    mudaPct,
  };
}

export interface KpiItem {
  id: string;
  code: string;
  category: 'operativo' | 'logistica' | 'entropia';
  categoryLabel: string;
  name: string;
  formulaOrBase: string;
  asIsValue: string;
  toBeTarget: string;
  deltaLabel: string;
  progressPctAsIs: number;
  progressPctToBe: number;
  unit: string;
}

export const KPI_SCORECARD_ITEMS: KpiItem[] = [
  {
    id: 'kpi-1',
    code: 'KPI-01',
    category: 'operativo',
    categoryLabel: 'Operativo / HTC',
    name: 'Tiempo de Ciclo Total Ponderado (n = 43)',
    formulaOrBase: 'Σ E1..E8 (Gustavo 379,3 s | Ana 423,6 s | Melina 288,6 s)',
    asIsValue: '360,0 s (6,00 min)',
    toBeTarget: '≤ 216,0 s (3,60 min)',
    deltaLabel: '-40,0% (-144,0 s)',
    progressPctAsIs: 42,
    progressPctToBe: 95,
    unit: 'segundos',
  },
  {
    id: 'kpi-2',
    code: 'KPI-02',
    category: 'operativo',
    categoryLabel: 'Lean / Muda Física',
    name: 'Proporción de Muda Física en el Ciclo',
    formulaOrBase: '(E2 + E3 + E4 + E6) / Ciclo Total',
    asIsValue: '35,3% (127,2 s)',
    toBeTarget: '≤ 17,5% (≤ 37,7 s)',
    deltaLabel: '-70,4% (-89,5 s)',
    progressPctAsIs: 35,
    progressPctToBe: 92,
    unit: '% ciclo',
  },
  {
    id: 'kpi-3',
    code: 'KPI-03',
    category: 'operativo',
    categoryLabel: 'Recorrido y Búsqueda',
    name: 'Caminata (E2+E6) y Búsqueda por Memoria (E3)',
    formulaOrBase: 'E2 (48,5 s) + E6 (19,5 s) | E3 (39,6 s)',
    asIsValue: '68,0 s cam. | 39,6 s búsq.',
    toBeTarget: '≤ 23,8 s cam. | ≤ 13,9 s búsq.',
    deltaLabel: '-65,0% en ambos',
    progressPctAsIs: 38,
    progressPctToBe: 94,
    unit: 'segundos',
  },
  {
    id: 'kpi-4',
    code: 'KPI-04',
    category: 'logistica',
    categoryLabel: 'Flujo / Pasillos',
    name: 'Obstrucción de Pasillos y Remoción Cajas (E4 / D3)',
    formulaOrBase: 'Pasillos 50 a 77 cm (S2 y S3) · Pico máx 365 s (Obs 4 Ana)',
    asIsValue: '19,6 s prom. (11 casos / 28,2%)',
    toBeTarget: '0,0 s (0 casos · Pasillos ≥ 90 cm)',
    deltaLabel: '-100% obstrucción',
    progressPctAsIs: 20,
    progressPctToBe: 100,
    unit: 'segundos / eventos',
  },
  {
    id: 'kpi-5',
    code: 'KPI-05',
    category: 'logistica',
    categoryLabel: 'Recepción (5 Lotes)',
    name: 'Recepción Truncada en Puerta y Trabajo Diferido',
    formulaOrBase: 'R1-R3 (96,22 s) vs R4 Ubicación + R5 Guardado (13 cajas)',
    asIsValue: 'R4/R5 = 0,00 s (100% truncado · 20-30 min dif.)',
    toBeTarget: '100% guardado directo con staging',
    deltaLabel: '-100% cajas en suelo',
    progressPctAsIs: 15,
    progressPctToBe: 100,
    unit: '% completitud',
  },
  {
    id: 'kpi-6',
    code: 'KPI-06',
    category: 'operativo',
    categoryLabel: 'Calidad / Pareto',
    name: 'Frecuencia de Pedidos con Anomalías (D1–D9)',
    formulaOrBase: 'Pedidos con falla / n = 43 (39 eventos registrados)',
    asIsValue: '58,1% (25/43 pedidos)',
    toBeTarget: '≤ 10,0% pedidos con falla',
    deltaLabel: '-48,1 pts (-82,8%)',
    progressPctAsIs: 30,
    progressPctToBe: 90,
    unit: '% pedidos',
  },
  {
    id: 'kpi-7',
    code: 'KPI-07',
    category: 'entropia',
    categoryLabel: 'Control Stock / ISO',
    name: 'Exactitud de Registro de Inventario (ERI) y Quiebres (D1)',
    formulaOrBase: 'Línea base 88% (falla 12%) | Empírico n=43: 86% (6/43 pedidos)',
    asIsValue: '86,0% empírico (88,0% base)',
    toBeTarget: '≥ 98,0% (Meta ISO 9001)',
    deltaLabel: '+12,0 pts ERI (-85,7% falla)',
    progressPctAsIs: 55,
    progressPctToBe: 98,
    unit: '% exactitud',
  },
  {
    id: 'kpi-8',
    code: 'KPI-08',
    category: 'entropia',
    categoryLabel: 'Shannon Ciclo',
    name: 'Entropía del Ciclo Operativo (H_ciclo)',
    formulaOrBase: 'H(P) = -Σ p_i · log₂(p_i) sobre H_max = 2,000 bits',
    asIsValue: '1,876 bits (93,8% H_max)',
    toBeTarget: '≤ 1,350 bits (≤ 67,5% H_max)',
    deltaLabel: '-28,0% (D_KL = 0,1451 b)',
    progressPctAsIs: 28,
    progressPctToBe: 88,
    unit: 'bits',
  },
  {
    id: 'kpi-9',
    code: 'KPI-09',
    category: 'entropia',
    categoryLabel: 'Shannon Espacial',
    name: 'Entropía Espacial del Layout (H_esp) y Obsoletos',
    formulaOrBase: 'H_esp = log₂(k) (k = 4 a 5 sectores) + % Plafones obsoletos',
    asIsValue: '2,000 a 2,322 bits (15-20% obs.)',
    toBeTarget: '0,000 bits (k = 1 ABC · 0% obs.)',
    deltaLabel: '-100% dispersión (D_KL ≤ 2,7504)',
    progressPctAsIs: 18,
    progressPctToBe: 100,
    unit: 'bits',
  },
  {
    id: 'kpi-10',
    code: 'KPI-10',
    category: 'entropia',
    categoryLabel: 'Neguentropía Stock',
    name: 'Entropía Binaria de Stock (H_b) y Neguentropía (ΔH)',
    formulaOrBase: 'H_b(p) = -p·log₂(p) - (1-p)·log₂(1-p) | ΔH = H_meta - H_emp',
    asIsValue: '0,5842 bits (D_KL = 0,2310 b)',
    toBeTarget: '0,1414 bits (ΔH = -0,4428 b)',
    deltaLabel: '-75,80% desorden stock',
    progressPctAsIs: 32,
    progressPctToBe: 96,
    unit: 'bits',
  },
];

export interface FamilyDispersionItem {
  id: string;
  family: string;
  kAsIs: number;
  kToBe: number;
  sectorsAsIs: string;
  sectorsToBe: string;
  hEspAsIs: number;
  hEspToBe: number;
  dispersionFactorAsIs: number; // k / k_opt
  normalizedDispersionPct: number; // (k - 1) / (5 - 1) * 100
}

export const FAMILY_DISPERSION_ITEMS: FamilyDispersionItem[] = [
  {
    id: 'disp-diors',
    family: 'Cables Diors (Bobinas y Corte)',
    kAsIs: 5,
    kToBe: 1,
    sectorsAsIs: 'S2 (Piso/Most.), S3 (Est. A), S4 (Est. C), S7 (Est. E/G/H/J)',
    sectorsToBe: 'S3 / S7 Núcleo ABC Clase A consolidado',
    hEspAsIs: 2.322,
    hEspToBe: 0.0,
    dispersionFactorAsIs: 5.0,
    normalizedDispersionPct: 100.0,
  },
  {
    id: 'disp-sirio',
    family: 'Iluminación LED Sirio / Luminarias',
    kAsIs: 5,
    kToBe: 1,
    sectorsAsIs: 'S1 (Show), S3 (E/F/J), S4 (B/D/E), S5 (C), S6 (A/B/C), S7 (D)',
    sectorsToBe: 'S1 Show Room + S6 Clase B LED codificado',
    hEspAsIs: 2.322,
    hEspToBe: 0.0,
    dispersionFactorAsIs: 5.0,
    normalizedDispersionPct: 100.0,
  },
  {
    id: 'disp-gav',
    family: 'Gaveteros (Térmicas, Tornillería, Módulos)',
    kAsIs: 4,
    kToBe: 1,
    sectorsAsIs: 'S2 (Est. A-H), S3 (Est. G/K), S5 (Est. A/B), S6 (Est. D/E/F)',
    sectorsToBe: 'S2 Gaveteros A-H Clase A + S3 Est. G',
    hEspAsIs: 2.0,
    hEspToBe: 0.0,
    dispersionFactorAsIs: 4.0,
    normalizedDispersionPct: 75.0,
  },
  {
    id: 'disp-canos',
    family: 'Caños PVC / Galvanizados y Conectores',
    kAsIs: 4,
    kToBe: 1,
    sectorsAsIs: 'S3 (Est. B/C/D/H/I), S4 (Est. H), S6 (Est. B), S7 (Est. C)',
    sectorsToBe: 'S7 Nave Caños 5,40 m + S3 Conectores',
    hEspAsIs: 2.0,
    hEspToBe: 0.0,
    dispersionFactorAsIs: 4.0,
    normalizedDispersionPct: 75.0,
  },
];

/**
 * Computes spatial and temporal dispersion factors for a given kSectors and sample totals.
 * - spatialFactor (FD_esp) = k / k_opt (where k_opt = 1)
 * - normalizedSpatialPct (ID_esp) = ((k - 1) / (5 - 1)) * 100
 * - temporalCvPct = (stdDev / mean) * 100 across the n=43 observations
 * - frictionAmplification = activeFrictionMean / weightedMean
 */
export function calculateDispersionMetrics(kSectors: number, cycleTimesSec: number[] = []) {
  const kClamped = Math.max(1, Math.min(7, kSectors));
  const spatialFactor = Number((kClamped / 1).toFixed(2));
  const normalizedSpatialPct = Number((((kClamped - 1) / 4) * 100).toFixed(1));
  const hEspBits = calculateSpatialEntropy(kClamped);

  let meanSec = 360.0;
  let stdDevSec = 259.4;
  let minSec = 49;
  let maxSec = 1296;

  if (cycleTimesSec.length > 1) {
    const n = cycleTimesSec.length;
    meanSec = cycleTimesSec.reduce((a, b) => a + b, 0) / n;
    const variance =
      cycleTimesSec.reduce((acc, val) => acc + Math.pow(val - meanSec, 2), 0) / (n - 1);
    stdDevSec = Math.sqrt(variance);
    minSec = Math.min(...cycleTimesSec);
    maxSec = Math.max(...cycleTimesSec);
  }

  const temporalCvPct = meanSec > 0 ? Number(((stdDevSec / meanSec) * 100).toFixed(1)) : 0;
  const maxToMeanRatio = meanSec > 0 ? Number((maxSec / meanSec).toFixed(2)) : 1;

  return {
    kSectors: kClamped,
    spatialFactor,
    normalizedSpatialPct,
    hEspBits,
    meanSec: Number(meanSec.toFixed(1)),
    stdDevSec: Number(stdDevSec.toFixed(1)),
    temporalCvPct,
    minSec,
    maxSec,
    maxToMeanRatio,
  };
}

export function projectIso3D(
  x: number,
  y: number,
  z: number,
  angleDeg: number,
  zoom: number,
  centerX: number,
  centerY: number
): { sx: number; sy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = 470;
  const cy = 310;
  const dx = x - cx;
  const dy = y - cy;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  const isoX = (rx - ry) * 0.64 * zoom + centerX;
  const isoY = (rx + ry) * 0.32 * zoom - z * 0.82 * zoom + centerY;
  return { sx: isoX, sy: isoY };
}

