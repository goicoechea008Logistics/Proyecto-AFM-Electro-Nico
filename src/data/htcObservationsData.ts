export type ObserverGroupKey = 'gustavo' | 'ana' | 'melina';

export interface IndividualObservation {
  globalId: number; // 1 to 43
  observerKey: ObserverGroupKey;
  observerName: string; // 'Gustavo Leschenko' | 'Ana' | 'Melina'
  localObsNum: number; // 1..13, 1..14, or 1..16
  operatorObserved: string; // 'Nico' | 'Agustina' | 'Franco' | 'Gervin' | 'Facundo' | 'Lautaro' | 'Mostrador'
  productFamily: string;
  targetSectorId: string; // 'sec1' | 'sec2' | 'sec3' | 'sec4' | 'sec5' | 'sec6' | 'sec7'
  stages: [number, number, number, number, number, number, number, number]; // E1..E8 in seconds
  totalSec: number;
  totalMin: number;
  anomalyCode: string; // '—' or 'D4 / D2', 'D3', etc.
  hasAnomaly: boolean;
}

export interface HtcCombinedRow {
  opNum: number;
  code: string;
  description: string;
  leanCategory: string;
  manualVaSec: number;
  autoSec: number;
  waitMudaSec: number;
  walkMudaSec: number;
  totalSec: number;
  startScaleSec: number;
  endScaleSec: number;
  pctOfCycle: number;
}

export interface HtcCombinedSummary {
  rows: HtcCombinedRow[];
  manualVaTotal: number;
  autoTotal: number;
  waitMudaTotal: number;
  walkMudaTotal: number;
  totalCycleSec: number;
  totalCycleMin: number;
  mudaTotalSec: number;
  mudaPct: number;
}

const STAGE_META: Array<{
  opNum: number;
  code: string;
  description: string;
  leanCategory: string;
  bucket: 'manual' | 'auto' | 'wait' | 'walk';
}> = [
  { opNum: 1, code: 'E1', description: 'Recepción de orden en mostrador o lectura de pedido manual en papel', leanCategory: 'MANUAL (NNVA / VA)', bucket: 'manual' },
  { opNum: 2, code: 'E2', description: 'Desplazamiento inicial desde mostrador hacia estantería / dep. contiguo', leanCategory: 'DESPLAZ. (Caminata)', bucket: 'walk' },
  { opNum: 3, code: 'E3', description: 'Búsqueda visual del SKU por memoria humana (alerta > 360 s)', leanCategory: 'ESPERA (Muda)', bucket: 'wait' },
  { opNum: 4, code: 'E4', description: 'Remoción de obstáculos (correr cajas/bultos en pasillo saturado)', leanCategory: 'ESPERA (Muda)', bucket: 'wait' },
  { opNum: 5, code: 'E5', description: 'Picking / Extracción física o corte fraccionado de cable por metro', leanCategory: 'MANUAL (VA Puro)', bucket: 'manual' },
  { opNum: 6, code: 'E6', description: 'Desplazamiento de retorno hacia mesa de armado o mostrador', leanCategory: 'DESPLAZ. (Caminata)', bucket: 'walk' },
  { opNum: 7, code: 'E7', description: 'Verificación visual cruzada, consolidación y empaque del bulto', leanCategory: 'MANUAL (VA Puro)', bucket: 'manual' },
  { opNum: 8, code: 'E8', description: 'Registro en software a medida e impresión de factura (descuento stock)', leanCategory: 'AUTO (Sistema)', bucket: 'auto' },
];

export function buildHtcCombinedSummary(stageValues: number[]): HtcCombinedSummary {
  let cursor = 0;
  let manualVaTotal = 0;
  let autoTotal = 0;
  let waitMudaTotal = 0;
  let walkMudaTotal = 0;

  const totalCycleSec = Number(stageValues.reduce((a, b) => a + b, 0).toFixed(1));

  const rows: HtcCombinedRow[] = STAGE_META.map((meta, idx) => {
    const val = Number((stageValues[idx] ?? 0).toFixed(1));
    const startScaleSec = Number(cursor.toFixed(1));
    const endScaleSec = Number((cursor + val).toFixed(1));
    cursor += val;

    const manualVaSec = meta.bucket === 'manual' ? val : 0;
    const autoSec = meta.bucket === 'auto' ? val : 0;
    const waitMudaSec = meta.bucket === 'wait' ? val : 0;
    const walkMudaSec = meta.bucket === 'walk' ? val : 0;

    manualVaTotal += manualVaSec;
    autoTotal += autoSec;
    waitMudaTotal += waitMudaSec;
    walkMudaTotal += walkMudaSec;

    const pctOfCycle = totalCycleSec > 0 ? Number(((val / totalCycleSec) * 100).toFixed(1)) : 0;

    return {
      opNum: meta.opNum,
      code: meta.code,
      description: meta.description,
      leanCategory: meta.leanCategory,
      manualVaSec,
      autoSec,
      waitMudaSec,
      walkMudaSec,
      totalSec: val,
      startScaleSec,
      endScaleSec,
      pctOfCycle,
    };
  });

  const mudaTotalSec = Number((waitMudaTotal + walkMudaTotal).toFixed(1));
  const mudaPct = totalCycleSec > 0 ? Number(((mudaTotalSec / totalCycleSec) * 100).toFixed(1)) : 0;

  return {
    rows,
    manualVaTotal: Number(manualVaTotal.toFixed(1)),
    autoTotal: Number(autoTotal.toFixed(1)),
    waitMudaTotal: Number(waitMudaTotal.toFixed(1)),
    walkMudaTotal: Number(walkMudaTotal.toFixed(1)),
    totalCycleSec,
    totalCycleMin: Number((totalCycleSec / 60).toFixed(2)),
    mudaTotalSec,
    mudaPct,
  };
}

// 1. RELEVAMIENTO REAL DE GUSTAVO LESCHENKO (13 OBSERVACIONES: Obs #1 a #13)
// Exactamente según archivo adjunto HTC_Consolidada_3_Observadores_AFM_Electro_NICO (Suma = 4.931 s | Prom = 379,3 s)
const GUSTAVO_RAW: Array<{
  localObsNum: number;
  operatorObserved: string;
  productFamily: string;
  targetSectorId: string;
  stages: [number, number, number, number, number, number, number, number];
  anomalyCode: string;
}> = [
  { localObsNum: 1, operatorObserved: 'Nico', productFamily: 'Varios (Asesoramiento + Depósito)', targetSectorId: 'sec3', stages: [652, 120, 0, 0, 0, 30, 140, 50], anomalyCode: 'D4 / D2' },
  { localObsNum: 2, operatorObserved: 'Mostrador', productFamily: 'Gaveta (Térmicas / Tornillería)', targetSectorId: 'sec2', stages: [15, 20, 10, 60, 50, 10, 0, 60], anomalyCode: 'D3' },
  { localObsNum: 3, operatorObserved: 'Mostrador', productFamily: 'Devolución (Búsqueda sin código)', targetSectorId: 'sec3', stages: [20, 20, 120, 0, 0, 20, 15, 0], anomalyCode: 'D2' },
  { localObsNum: 4, operatorObserved: 'Agustina', productFamily: 'Varios (Pasillo obstruido)', targetSectorId: 'sec3', stages: [180, 21, 0, 125, 0, 80, 300, 120], anomalyCode: 'D4' },
  { localObsNum: 5, operatorObserved: 'Mostrador', productFamily: 'Pago Factura (Mostrador PC)', targetSectorId: 'sec2', stages: [25, 0, 0, 0, 0, 0, 0, 35], anomalyCode: '—' },
  { localObsNum: 6, operatorObserved: 'Mostrador', productFamily: 'Varios (Corte y despacho)', targetSectorId: 'sec3', stages: [20, 35, 0, 0, 60, 60, 20, 20], anomalyCode: 'D2' },
  { localObsNum: 7, operatorObserved: 'Agustina', productFamily: 'Gaveta (Obstáculos + Glitch PC)', targetSectorId: 'sec2', stages: [50, 35, 107, 155, 0, 35, 15, 140], anomalyCode: 'Glitch (D5)' },
  { localObsNum: 8, operatorObserved: 'Mostrador', productFamily: 'Gaveta (Quiebre stock aparente)', targetSectorId: 'sec6', stages: [60, 36, 90, 0, 0, 25, 0, 0], anomalyCode: 'D1' },
  { localObsNum: 9, operatorObserved: 'Nico', productFamily: 'Varios (Recorrido largo S4/S7)', targetSectorId: 'sec4', stages: [20, 360, 120, 0, 0, 0, 0, 30], anomalyCode: 'D2 / D4 / D5' },
  { localObsNum: 10, operatorObserved: 'Nico', productFamily: 'Bazar (Radio · Entrepiso S4)', targetSectorId: 'sec4', stages: [0, 120, 47, 0, 0, 50, 0, 0], anomalyCode: 'D2' },
  { localObsNum: 11, operatorObserved: 'Mostrador', productFamily: 'LED Sirio (Show Room / S2)', targetSectorId: 'sec1', stages: [15, 20, 0, 0, 0, 10, 10, 45], anomalyCode: '—' },
  { localObsNum: 12, operatorObserved: 'Mostrador', productFamily: 'Varios ($4528 · Glitch PC 460s)', targetSectorId: 'sec7', stages: [60, 25, 120, 0, 120, 28, 0, 460], anomalyCode: 'D4 / D2 / D3' },
  { localObsNum: 13, operatorObserved: 'Nico', productFamily: 'Cerradura (Inexistente / Stock)', targetSectorId: 'sec2', stages: [10, 0, 0, 0, 0, 0, 0, 0], anomalyCode: '—' },
];

// 2. RELEVAMIENTO DE ANA (14 OBSERVACIONES: Obs #14 a #27 | Suma = 5.927 s | Prom = 423,4 s / 7,06 min)
// Incluye los picos máximos históricos documentados en Obs 4 de Ana (E4 = 365 s y E5 = 546 s)
const ANA_RAW: Array<{
  localObsNum: number;
  operatorObserved: string;
  productFamily: string;
  targetSectorId: string;
  stages: [number, number, number, number, number, number, number, number];
  anomalyCode: string;
}> = [
  { localObsNum: 1, operatorObserved: 'Agustina', productFamily: 'Cables Diors (Corte bobina S3)', targetSectorId: 'sec3', stages: [110, 40, 80, 0, 130, 15, 0, 85], anomalyCode: 'D4 / D2' },
  { localObsNum: 2, operatorObserved: 'Franco', productFamily: 'Gaveteros (Térmicas y Tomas)', targetSectorId: 'sec2', stages: [85, 30, 45, 0, 65, 10, 0, 60], anomalyCode: 'D7' },
  { localObsNum: 3, operatorObserved: 'Nico', productFamily: 'Iluminación LED Sirio', targetSectorId: 'sec1', stages: [60, 25, 0, 0, 40, 10, 0, 45], anomalyCode: '—' },
  { localObsNum: 4, operatorObserved: 'Agustina', productFamily: 'Cables Diors (Pico E4=365s y E5=546s)', targetSectorId: 'sec7', stages: [140, 65, 140, 365, 546, 22, 10, 110], anomalyCode: 'D3 / D4 / D5' },
  { localObsNum: 5, operatorObserved: 'Gervin', productFamily: 'Módulos y Llaves (Est. G / S3)', targetSectorId: 'sec3', stages: [95, 35, 60, 0, 80, 12, 0, 70], anomalyCode: 'D2' },
  { localObsNum: 6, operatorObserved: 'Franco', productFamily: 'Cables Subterráneos (Bobina Piso)', targetSectorId: 'sec2', stages: [180, 45, 95, 28, 145, 15, 0, 95], anomalyCode: 'D3 / D4 / D7' },
  { localObsNum: 7, operatorObserved: 'Nico', productFamily: 'Tornillería y Fijaciones (S2)', targetSectorId: 'sec2', stages: [45, 20, 0, 0, 35, 8, 0, 40], anomalyCode: '—' },
  { localObsNum: 8, operatorObserved: 'Agustina', productFamily: 'Caños PVC y Conectores (S7)', targetSectorId: 'sec7', stages: [120, 50, 110, 0, 160, 14, 8, 120], anomalyCode: 'D4 / D5' },
  { localObsNum: 9, operatorObserved: 'Gervin', productFamily: 'Luminarias Solares (Show Room)', targetSectorId: 'sec1', stages: [90, 30, 40, 0, 55, 10, 0, 55], anomalyCode: 'D7' },
  { localObsNum: 10, operatorObserved: 'Franco', productFamily: 'Cables Diors + Cajas Pasillo S3', targetSectorId: 'sec3', stages: [160, 55, 120, 20, 124, 16, 0, 105], anomalyCode: 'D3 / D4 / D5' },
  { localObsNum: 11, operatorObserved: 'Nico', productFamily: 'Térmicas bipolares (Gavetero C)', targetSectorId: 'sec2', stages: [52, 25, 0, 0, 30, 9, 0, 50], anomalyCode: '—' },
  { localObsNum: 12, operatorObserved: 'Agustina', productFamily: 'Plafones / Obsoletos (Sector 6)', targetSectorId: 'sec6', stages: [110, 40, 70, 0, 90, 12, 7, 80], anomalyCode: 'D1 / D7' },
  { localObsNum: 13, operatorObserved: 'Gervin', productFamily: 'Material Eléctrico (Entrepiso S4)', targetSectorId: 'sec4', stages: [75, 35, 50, 0, 45, 8, 0, 65], anomalyCode: '—' },
  { localObsNum: 14, operatorObserved: 'Franco', productFamily: 'Lámparas LED Sirio (Mostrador)', targetSectorId: 'sec2', stages: [50, 30, 0, 0, 35, 6, 5, 50], anomalyCode: '—' },
];

// 3. RELEVAMIENTO DE MELINA (16 OBSERVACIONES: Obs #28 a #43 | Suma = 4.621 s | Prom = 288,8 s / 4,81 min)
const MELINA_RAW: Array<{
  localObsNum: number;
  operatorObserved: string;
  productFamily: string;
  targetSectorId: string;
  stages: [number, number, number, number, number, number, number, number];
  anomalyCode: string;
}> = [
  { localObsNum: 1, operatorObserved: 'Facundo', productFamily: 'Cables Diors (Corte rollo S3)', targetSectorId: 'sec3', stages: [45, 60, 35, 0, 80, 25, 45, 95], anomalyCode: 'D5' },
  { localObsNum: 2, operatorObserved: 'Lautaro', productFamily: 'Gaveteros (Tomas y Módulos)', targetSectorId: 'sec2', stages: [30, 45, 0, 0, 35, 18, 30, 65], anomalyCode: '—' },
  { localObsNum: 3, operatorObserved: 'Facundo', productFamily: 'Iluminación LED Sirio (S1/S2)', targetSectorId: 'sec1', stages: [25, 35, 20, 0, 40, 15, 25, 55], anomalyCode: '—' },
  { localObsNum: 4, operatorObserved: 'Lautaro', productFamily: 'Cables Diors + Obstáculo Pasillo', targetSectorId: 'sec3', stages: [40, 55, 40, 25, 125, 24, 50, 110], anomalyCode: 'D3 / D4 / D5' },
  { localObsNum: 5, operatorObserved: 'Nico', productFamily: 'Tornillería y Gramas (Gavetero A)', targetSectorId: 'sec2', stages: [35, 40, 0, 0, 30, 16, 30, 60], anomalyCode: '—' },
  { localObsNum: 6, operatorObserved: 'Facundo', productFamily: 'Bobinas Piso + Pasillo Obstruido', targetSectorId: 'sec7', stages: [50, 70, 55, 36, 130, 30, 55, 125], anomalyCode: 'D3 / D4 / D5' },
  { localObsNum: 7, operatorObserved: 'Lautaro', productFamily: 'Cajas de Paso PVC (Sector 3)', targetSectorId: 'sec3', stages: [20, 30, 0, 0, 25, 14, 20, 50], anomalyCode: '—' },
  { localObsNum: 8, operatorObserved: 'Gervin', productFamily: 'Focos y Tubos LED (Sector 5)', targetSectorId: 'sec5', stages: [30, 45, 25, 0, 45, 20, 35, 75], anomalyCode: '—' },
  { localObsNum: 9, operatorObserved: 'Facundo', productFamily: 'Caños Corrugados (Sector 7)', targetSectorId: 'sec7', stages: [40, 50, 30, 0, 60, 22, 40, 85], anomalyCode: 'D5' },
  { localObsNum: 10, operatorObserved: 'Lautaro', productFamily: 'Fichas y Adaptadores (S2)', targetSectorId: 'sec2', stages: [25, 35, 0, 0, 30, 16, 25, 55], anomalyCode: '—' },
  { localObsNum: 11, operatorObserved: 'Agustina', productFamily: 'Disyuntores Diferenciales (S2)', targetSectorId: 'sec2', stages: [35, 45, 0, 0, 35, 18, 30, 65], anomalyCode: '—' },
  { localObsNum: 12, operatorObserved: 'Facundo', productFamily: 'Cables + Cajas en Pasillo S3/S6', targetSectorId: 'sec6', stages: [45, 65, 44, 30, 92, 28, 53, 112], anomalyCode: 'D3 / D5 / D7' },
  { localObsNum: 13, operatorObserved: 'Lautaro', productFamily: 'Apliques Pared (Show Room S1)', targetSectorId: 'sec1', stages: [30, 40, 0, 0, 25, 18, 35, 70], anomalyCode: '—' },
  { localObsNum: 14, operatorObserved: 'Franco', productFamily: 'conductores Unipolares (S3)', targetSectorId: 'sec3', stages: [34, 52, 30, 0, 30, 22, 40, 85], anomalyCode: 'D5' },
  { localObsNum: 15, operatorObserved: 'Facundo', productFamily: 'Sensores Movimiento (Sector 2)', targetSectorId: 'sec2', stages: [35, 45, 0, 0, 25, 20, 35, 70], anomalyCode: '—' },
  { localObsNum: 16, operatorObserved: 'Lautaro', productFamily: 'Cinta Aisladora y Precintos (S2)', targetSectorId: 'sec2', stages: [25, 35, 0, 0, 20, 17, 25, 60], anomalyCode: '—' },
];

export const ALL_43_OBSERVATIONS: IndividualObservation[] = [
  ...GUSTAVO_RAW.map((row, i) => {
    const totalSec = row.stages.reduce((a, b) => a + b, 0);
    return {
      globalId: i + 1,
      observerKey: 'gustavo' as const,
      observerName: 'Gustavo Leschenko',
      localObsNum: row.localObsNum,
      operatorObserved: row.operatorObserved,
      productFamily: row.productFamily,
      targetSectorId: row.targetSectorId,
      stages: row.stages,
      totalSec,
      totalMin: Number((totalSec / 60).toFixed(2)),
      anomalyCode: row.anomalyCode,
      hasAnomaly: row.anomalyCode !== '—',
    };
  }),
  ...ANA_RAW.map((row, i) => {
    const totalSec = row.stages.reduce((a, b) => a + b, 0);
    return {
      globalId: 13 + i + 1,
      observerKey: 'ana' as const,
      observerName: 'Ana',
      localObsNum: row.localObsNum,
      operatorObserved: row.operatorObserved,
      productFamily: row.productFamily,
      targetSectorId: row.targetSectorId,
      stages: row.stages,
      totalSec,
      totalMin: Number((totalSec / 60).toFixed(2)),
      anomalyCode: row.anomalyCode,
      hasAnomaly: row.anomalyCode !== '—',
    };
  }),
  ...MELINA_RAW.map((row, i) => {
    const totalSec = row.stages.reduce((a, b) => a + b, 0);
    return {
      globalId: 27 + i + 1,
      observerKey: 'melina' as const,
      observerName: 'Melina',
      localObsNum: row.localObsNum,
      operatorObserved: row.operatorObserved,
      productFamily: row.productFamily,
      targetSectorId: row.targetSectorId,
      stages: row.stages,
      totalSec,
      totalMin: Number((totalSec / 60).toFixed(2)),
      anomalyCode: row.anomalyCode,
      hasAnomaly: row.anomalyCode !== '—',
    };
  }),
];

// Estadísticas Parte 1 de Gustavo Leschenko (13 Obs) exactamente como en el CSV adjunto
export const GUSTAVO_PART1_STATS = [
  { code: 'E1', minActive: 10.0, max: 652.0, weightedAvg: 86.7, activeAvg: 93.9 },
  { code: 'E2', minActive: 20.0, max: 360.0, weightedAvg: 62.5, activeAvg: 73.8 },
  { code: 'E3', minActive: 10.0, max: 120.0, weightedAvg: 47.2, activeAvg: 87.7 },
  { code: 'E4', minActive: 60.0, max: 155.0, weightedAvg: 26.2, activeAvg: 113.3 },
  { code: 'E5', minActive: 50.0, max: 120.0, weightedAvg: 17.7, activeAvg: 76.7 },
  { code: 'E6', minActive: 10.0, max: 80.0, weightedAvg: 26.8, activeAvg: 34.8 },
  { code: 'E7', minActive: 10.0, max: 300.0, weightedAvg: 38.5, activeAvg: 83.3 },
  { code: 'E8', minActive: 20.0, max: 460.0, weightedAvg: 73.8, activeAvg: 106.7 },
];

export const GUSTAVO_HTC_PONDERADO = buildHtcCombinedSummary([86.7, 62.5, 47.2, 26.2, 17.7, 26.8, 38.5, 73.8]);
export const GUSTAVO_HTC_ACTIVO = buildHtcCombinedSummary([93.9, 73.8, 87.7, 113.3, 76.7, 34.8, 83.3, 106.7]);
export const GLOBAL_HTC_PONDERADO = buildHtcCombinedSummary([70.8, 48.5, 39.6, 19.6, 61.3, 19.5, 25.6, 75.0]);
