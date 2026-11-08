import {
  HTC_STAGES,
  KPI_SCORECARD_ITEMS,
  LayoutMode,
  OPERATOR_PROFILES,
  OperatorKey,
  PARETO_BOTTLENECKS,
  SHANNON_METRICS,
  calculateBinaryEntropy,
  calculateDispersionMetrics,
  calculateKLDivergenceBinary,
  calculateSpatialEntropy,
} from '../data/afmData';
import { findCorridorPath, getStageTargetNodeId } from '../data/corridorPathfinding';
import { ALL_43_OBSERVATIONS, IndividualObservation } from '../data/htcObservationsData';

export interface PdfExportPayload {
  layoutMode: LayoutMode;
  selectedOp: OperatorKey;
  activeStageIdx: number;
  activeIndividualObs: IndividualObservation | null;
  simEriPct: number;
  simKSectors: number;
  selectedSectorId: string;
  generatedAt?: string;
}

/**
 * Replaces Unicode mathematical symbols with clean WinAnsi-compatible equivalents
 * and encodes characters into single-byte Latin-1 / WinAnsi octal escapes for PDF strings.
 */
export function sanitizePdfText(input: string): string {
  return input
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/Δ/g, 'Delta ')
    .replace(/Σ/g, 'Sigma ')
    .replace(/₂/g, '2')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/↔/g, '<->')
    .replace(/→/g, '->')
    .replace(/•/g, '-')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '...');
}

function encodePdfString(raw: string): string {
  const clean = sanitizePdfText(raw);
  let out = '(';
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    if (code === 0x28 || code === 0x29 || code === 0x5c) {
      out += '\\' + String.fromCharCode(code);
    } else if (code >= 32 && code <= 126) {
      out += String.fromCharCode(code);
    } else if (code >= 160 && code <= 255) {
      out += '\\' + code.toString(8).padStart(3, '0');
    } else {
      out += '?';
    }
  }
  out += ')';
  return out;
}

class PdfPageBuilder {
  private ops: string[] = [];

  rectFill(x: number, yTop: number, w: number, h: number, r: number, g: number, b: number) {
    const yPdf = 842 - yTop - h;
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    this.ops.push(`${x.toFixed(1)} ${yPdf.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
  }

  rectStroke(x: number, yTop: number, w: number, h: number, r: number, g: number, b: number, lineWidth = 0.6) {
    const yPdf = 842 - yTop - h;
    this.ops.push(`${lineWidth.toFixed(2)} w`);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.ops.push(`${x.toFixed(1)} ${yPdf.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);
  }

  line(x1: number, y1Top: number, x2: number, y2Top: number, r: number, g: number, b: number, lineWidth = 0.5) {
    const y1 = 842 - y1Top;
    const y2 = 842 - y2Top;
    this.ops.push(`${lineWidth.toFixed(2)} w`);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.ops.push(`${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);
  }

  text(
    str: string,
    x: number,
    yTop: number,
    size = 9,
    bold = false,
    r = 0.08,
    g = 0.11,
    b = 0.18
  ) {
    const yPdf = 842 - yTop;
    const font = bold ? '/F2' : '/F1';
    this.ops.push('BT');
    this.ops.push(`${font} ${size.toFixed(1)} Tf`);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    this.ops.push(`${x.toFixed(1)} ${yPdf.toFixed(1)} Td`);
    this.ops.push(`${encodePdfString(str)} Tj`);
    this.ops.push('ET');
  }

  getContent(): string {
    return this.ops.join('\n');
  }
}

/**
 * Generates a valid, self-contained 2-page A4 PDF (Uint8Array) summarizing:
 * Page 1: Current Simulator Results, Active Observation (#1-#43), Corridor Path, HTC Table (n=43), Dispersion Factor & Shannon Entropy.
 * Page 2: Master KPI Scorecard (KPI-01 to KPI-10) comparing As-Is vs To-Be and Mathematical Formulas applied in the AFM model.
 */
export function buildProjectSummaryPdfBytes(payload: PdfExportPayload): Uint8Array {
  const {
    layoutMode,
    selectedOp,
    activeStageIdx,
    activeIndividualObs,
    simEriPct,
    simKSectors,
    generatedAt = new Date().toLocaleString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  } = payload;

  const simHb = calculateBinaryEntropy(simEriPct / 100);
  const simDkl = calculateKLDivergenceBinary(simEriPct / 100, 0.98);
  const simHesp = calculateSpatialEntropy(simKSectors);
  const dispMetrics = calculateDispersionMetrics(
    simKSectors,
    ALL_43_OBSERVATIONS.map((o) => o.totalSec)
  );

  const stageObj = HTC_STAGES[activeStageIdx] ?? HTC_STAGES[0];
  const startNode = getStageTargetNodeId(0, layoutMode, activeIndividualObs);
  const targetNode = getStageTargetNodeId(activeStageIdx, layoutMode, activeIndividualObs);
  const corridorWaypoints = findCorridorPath(startNode, targetNode);
  const routeSummary = corridorWaypoints
    .map((w) => (w.openingCode ? `Vano ${w.openingCode}` : w.label.split('(')[0].trim()))
    .join(' -> ');

  const opLabelMap: Record<OperatorKey, string> = {
    global: 'Global Ponderado (n = 43 pedidos · 15.479 s)',
    gustavo: 'Estrato Gustavo Leschenko (n = 13 · 4.931 s)',
    ana: 'Estrato Ana (n = 14 · 5.927 s)',
    melina: 'Estrato Melina (n = 16 · 4.621 s)',
  };

  // ==================== PAGE 1: SIMULATOR, DISPERSION & HTC CONSOLIDATED ====================
  const p1 = new PdfPageBuilder();

  // Header Banner
  p1.rectFill(28, 24, 539, 54, 0.059, 0.09, 0.165);
  p1.text('PROYECTO AFM - ELECTRO NICO (GRUPO TB4 - UTU)', 40, 42, 13, true, 1, 1, 1);
  p1.text(
    'Informe Técnico de Simulación Operativa 2D/3D (n = 43), Factor de Dispersión, Entropía y KPIs',
    40,
    56,
    8.5,
    false,
    0.75,
    0.82,
    0.92
  );
  const modeBadgeText =
    layoutMode === 'as-is'
      ? 'MODO ACTIVO: ESTADO ACTUAL (AS-IS: CAÓTICO)'
      : 'MODO ACTIVO: PROPUESTA AFM (TO-BE: LAYOUT ABC)';
  p1.text(`${modeBadgeText}   |   Exportado: ${generatedAt}`, 40, 70, 8, true, 0.22, 0.85, 0.62);

  // Section 1: Snapshot of Active Simulator State
  p1.rectFill(28, 88, 539, 18, 0.91, 0.94, 0.98);
  p1.text('1. ESTADO ACTUAL DEL SIMULADOR DE OPERARIOS Y RECORRIDO POR PASILLOS / ABERTURAS CAD', 35, 100, 9, true, 0.06, 0.1, 0.2);

  p1.rectStroke(28, 106, 539, 90, 0.78, 0.83, 0.89, 0.7);
  p1.text(`Estrato HTC Seleccionado: ${opLabelMap[selectedOp]}`, 36, 120, 8.5, true, 0.1, 0.15, 0.25);
  p1.text(
    `Etapa Activa del Ciclo: ${stageObj.code} - ${stageObj.name} (${stageObj.type}) | Global: ${stageObj.globalSec.toFixed(1).replace('.', ',')} s (${stageObj.globalPct.toFixed(1).replace('.', ',')}%)`,
    36,
    133,
    8,
    false,
    0.15,
    0.2,
    0.3
  );

  if (activeIndividualObs) {
    const obsStageSec = activeIndividualObs.stages[activeStageIdx] ?? 0;
    p1.text(
      `Medición Individual Activa: Obs #${activeIndividualObs.globalId}/43 (${activeIndividualObs.observerName} Obs #${activeIndividualObs.localObsNum}) · Operario: ${activeIndividualObs.operatorObserved}`,
      36,
      147,
      8.5,
      true,
      0.04,
      0.38,
      0.58
    );
    p1.text(
      `Familia / Sector: ${activeIndividualObs.productFamily} (${activeIndividualObs.targetSectorId.toUpperCase()}) · Tiempo Pedido: ${activeIndividualObs.totalSec} s (${activeIndividualObs.totalMin.toFixed(2).replace('.', ',')} min) · Etapa ${stageObj.code}: ${obsStageSec} s · Falla: ${activeIndividualObs.anomalyCode}`,
      36,
      160,
      7.8,
      false,
      0.15,
      0.2,
      0.3
    );
    p1.text(
      `Desglose E1..E8 (Obs #${activeIndividualObs.globalId}): E1=${activeIndividualObs.stages[0]}s | E2=${activeIndividualObs.stages[1]}s | E3=${activeIndividualObs.stages[2]}s | E4=${activeIndividualObs.stages[3]}s | E5=${activeIndividualObs.stages[4]}s | E6=${activeIndividualObs.stages[5]}s | E7=${activeIndividualObs.stages[6]}s | E8=${activeIndividualObs.stages[7]}s`,
      36,
      173,
      7.5,
      false,
      0.25,
      0.3,
      0.4
    );
  } else {
    p1.text(
      'Modo Simulación: Promedios Ponderados por Estrato (Muestra completa n = 43 pedidos · 15.479 s / 258,0 min)',
      36,
      152,
      8.5,
      true,
      0.04,
      0.38,
      0.58
    );
  }

  p1.text(`Ruta Continua por Pasillos y Vanos CAD: ${routeSummary.slice(0, 108)}`, 36, 188, 7.6, true, 0.55, 0.32, 0.04);

  // Section 2: Consolidated HTC Table (n = 43)
  p1.rectFill(28, 206, 539, 18, 0.91, 0.94, 0.98);
  p1.text('2. HOJA DE TRABAJO COMBINADO CONSOLIDADA (HTC · n = 43 PEDIDOS · 15.479 s / 258,0 min)', 35, 218, 9, true, 0.06, 0.1, 0.2);

  const htcTop = 226;
  p1.rectFill(28, htcTop, 539, 16, 0.12, 0.16, 0.24);
  p1.text('Etapa', 33, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Descripción Operativa del Ciclo', 64, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Clasif.', 228, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Global (43)', 276, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('% Ciclo', 328, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Gustavo(13)', 366, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Ana (14)', 420, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Melina (16)', 462, htcTop + 11, 7.5, true, 1, 1, 1);
  p1.text('Meta To-Be', 515, htcTop + 11, 7.5, true, 0.4, 0.95, 0.7);

  let rowY = htcTop + 16;
  HTC_STAGES.forEach((st, idx) => {
    const isCurrentStage = idx === activeStageIdx;
    if (isCurrentStage) {
      p1.rectFill(28, rowY, 539, 16, 0.88, 0.95, 1.0);
    } else if (idx % 2 === 1) {
      p1.rectFill(28, rowY, 539, 16, 0.97, 0.98, 0.99);
    }
    p1.rectStroke(28, rowY, 539, 16, 0.84, 0.87, 0.91, 0.4);

    p1.text(st.code, 33, rowY + 11, 7.5, true, 0.05, 0.25, 0.48);
    p1.text(st.name.slice(0, 36), 64, rowY + 11, 7.5, isCurrentStage, 0.1, 0.14, 0.22);
    p1.text(st.type, 228, rowY + 11, 7.2, true, st.type === 'Muda' ? 0.75 : 0.08, st.type === 'Muda' ? 0.15 : 0.45, 0.2);
    p1.text(`${st.globalSec.toFixed(1).replace('.', ',')} s`, 276, rowY + 11, 7.5, true, 0.1, 0.14, 0.22);
    p1.text(`${st.globalPct.toFixed(1).replace('.', ',')}%`, 328, rowY + 11, 7.5, false, 0.25, 0.3, 0.4);
    p1.text(`${st.gustavoSec.toFixed(1).replace('.', ',')} s`, 366, rowY + 11, 7.5, false, 0.2, 0.25, 0.35);
    p1.text(`${st.anaSec.toFixed(1).replace('.', ',')} s`, 420, rowY + 11, 7.5, false, 0.2, 0.25, 0.35);
    p1.text(`${st.melinaSec.toFixed(1).replace('.', ',')} s`, 462, rowY + 11, 7.5, false, 0.2, 0.25, 0.35);
    p1.text(`${st.toBeSec.toFixed(1).replace('.', ',')} s`, 515, rowY + 11, 7.5, true, 0.04, 0.48, 0.32);
    rowY += 16;
  });

  // Totals Row
  p1.rectFill(28, rowY, 539, 18, 0.12, 0.16, 0.24);
  p1.text('TOTAL', 33, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text('Ciclo Total Ponderado (35,3% Muda = 127,2 s)', 64, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text('100%', 228, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text(`${OPERATOR_PROFILES.global.weightedCycleSec.toFixed(1).replace('.', ',')} s`, 276, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text('6,00 m', 328, rowY + 12, 7.5, true, 0.8, 0.86, 0.95);
  p1.text(`${OPERATOR_PROFILES.gustavo.weightedCycleSec.toFixed(1).replace('.', ',')} s`, 366, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text(`${OPERATOR_PROFILES.ana.weightedCycleSec.toFixed(1).replace('.', ',')} s`, 420, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text(`${OPERATOR_PROFILES.melina.weightedCycleSec.toFixed(1).replace('.', ',')} s`, 462, rowY + 12, 7.5, true, 1, 1, 1);
  p1.text('<= 216,0 s', 512, rowY + 12, 7.5, true, 0.4, 0.95, 0.7);

  // Section 3: Dispersion Factor & Shannon Entropy
  const shTop = rowY + 26;
  p1.rectFill(28, shTop, 539, 18, 0.91, 0.94, 0.98);
  p1.text('3. FACTOR DE DISPERSIÓN ESPACIAL/TEMPORAL Y MODELO ENTRÓPICO DE SHANNON (H, Delta H, D_KL)', 35, shTop + 12, 9, true, 0.06, 0.1, 0.2);

  p1.rectStroke(28, shTop + 18, 539, 98, 0.78, 0.83, 0.89, 0.7);
  p1.text(
    `Factor de Dispersión Espacial Simulado (FD_esp = k / k_opt): ${dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}x (k = ${simKSectors} sectores) | Índice ID_esp = ${dispMetrics.normalizedSpatialPct.toFixed(1).replace('.', ',')}%`,
    36,
    shTop + 32,
    8.2,
    true,
    0.04,
    0.38,
    0.58
  );
  p1.text(
    `Factor de Dispersión Temporal Muestral (n=43): Media = ${dispMetrics.meanSec.toFixed(1).replace('.', ',')} s | Desv. Est. (sigma) = ${dispMetrics.stdDevSec.toFixed(1).replace('.', ',')} s | Coef. Variación CV = ${dispMetrics.temporalCvPct.toFixed(1).replace('.', ',')}% (Rango: ${dispMetrics.minSec}s a ${dispMetrics.maxSec}s)`,
    36,
    shTop + 45,
    7.8,
    false,
    0.15,
    0.2,
    0.3
  );
  p1.text(
    `• Entropía Binaria de Stock H_b(ERI=${simEriPct}%): ${simHb.toFixed(4).replace('.', ',')} bits | Divergencia D_KL vs Meta ISO 9001 (98%): ${simDkl.toFixed(4).replace('.', ',')} bits`,
    36,
    shTop + 59,
    8,
    false,
    0.15,
    0.2,
    0.3
  );
  p1.text(
    `• Entropía Espacial H_esp = log2(${simKSectors}): ${simHesp.toFixed(3).replace('.', ',')} bits (As-Is: 2,000 a 2,322 bits en k=4..5 -> Meta To-Be: 0,000 bits en k=1)`,
    36,
    shTop + 72,
    8,
    false,
    0.15,
    0.2,
    0.3
  );
  p1.text(
    `• Entropía del Ciclo Operativo H_ciclo: ${SHANNON_METRICS.cycle.actualBits.toFixed(3).replace('.', ',')} bits (${SHANNON_METRICS.cycle.actualPctMax.toFixed(1).replace('.', ',')}% de H_max=2,000 b) -> Meta To-Be <= 1,350 bits (D_KL = 0,1451 b)`,
    36,
    shTop + 85,
    8,
    false,
    0.15,
    0.2,
    0.3
  );
  p1.text(
    `• Neguentropía Inyectada (Delta H): -0,4428 bits (-75,80% reducción del desorden informacional del inventario al pasar de ERI 86% a >= 98%)`,
    36,
    shTop + 98,
    8,
    true,
    0.04,
    0.48,
    0.32
  );
  p1.text(
    `• Frecuencia de Anomalías (D1-D9): 58,1% actual (25/43 pedidos con falla; H(P)=0,9808 b) -> Meta To-Be <= 10,0% (D_KL = 1,0142 bits)`,
    36,
    shTop + 110,
    8,
    false,
    0.65,
    0.15,
    0.2
  );

  // Section 4: Pareto Bottlenecks Summary on Page 1
  const parTop = shTop + 124;
  p1.rectFill(28, parTop, 539, 18, 0.91, 0.94, 0.98);
  p1.text('4. PARETO DE CUELLOS DE BOTELLA (39 EVENTOS EN 25/43 PEDIDOS = 58,1%) Y RECEPCIÓN TRUNCADA (5 LOTES)', 35, parTop + 12, 9, true, 0.06, 0.1, 0.2);

  let py = parTop + 21;
  PARETO_BOTTLENECKS.forEach((b) => {
    p1.rectStroke(28, py, 539, 16, 0.85, 0.88, 0.92, 0.4);
    p1.text(`${b.rank}.° ${b.code} - ${b.title}`, 34, py + 11, 7.5, true, 0.1, 0.15, 0.25);
    p1.text(`${b.events} casos (${b.pct.toFixed(1).replace('.', ',')}%)`, 300, py + 11, 7.5, true, 0.72, 0.12, 0.18);
    p1.text(b.detail.slice(0, 52) + '...', 375, py + 11, 6.9, false, 0.3, 0.35, 0.45);
    py += 16;
  });

  p1.text(
    'Recepción en Puerta (Franco): 5 lotes (13 cajas) promedian 96,22 s en R1-R3 y 0,00 s en R4/R5 (100% truncado · 20-30 min trabajo diferido).',
    32,
    py + 12,
    7.8,
    true,
    0.55,
    0.3,
    0.05
  );

  // Footer Page 1
  p1.line(28, 808, 567, 808, 0.75, 0.8, 0.86, 0.6);
  p1.text('Proyecto AFM - Electro NICO (Grupo TB4 - UTU) · Relevamiento Gustavo (n=13), Ana (n=14) y Melina (n=16)', 28, 822, 7.5, false, 0.4, 0.45, 0.52);
  p1.text('Página 1 de 2', 515, 822, 7.5, true, 0.3, 0.35, 0.45);

  // ==================== PAGE 2: MASTER KPI SCORECARD (10 KPIs) & MATH FORMULAS ====================
  const p2 = new PdfPageBuilder();

  p2.rectFill(28, 24, 539, 48, 0.059, 0.09, 0.165);
  p2.text('CUADRO MAESTRO DE KPIs DEL PANEL AFM Y FÓRMULAS MATEMÁTICAS DEL MODELO', 40, 42, 11.5, true, 1, 1, 1);
  p2.text(
    `Consolidado de los 10 Indicadores Clave de Desempeño (n = 43 pedidos · 15.479 s y 5 lotes de recepción) | Vista: ${layoutMode.toUpperCase()}`,
    40,
    58,
    8.2,
    false,
    0.75,
    0.82,
    0.92
  );

  // Executive KPI Cards Strip
  const cards = [
    { label: 'Reducción Ciclo Total', val: '-40,0% (<= 216,0 s)', sub: 'Desde 360,0 s (6,00 min)' },
    { label: 'Factor Dispersión (FD)', val: `${dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}x -> 1,0x ABC`, sub: `CV Temporal: ${dispMetrics.temporalCvPct.toFixed(1).replace('.', ',')}%` },
    { label: 'Exactitud ERI y Stock', val: '86% -> >= 98% ERI', sub: 'Delta H = -0,4428 b (-75,8%)' },
    { label: 'Eliminación Obstrucción', val: 'E4 = 0,0 s · <= 10% Fallas', sub: 'Desde 58,1% pedidos c/ falla' },
  ];
  cards.forEach((c, idx) => {
    const cx = 28 + idx * 136;
    p2.rectFill(cx, 82, 130, 40, 0.95, 0.97, 0.99);
    p2.rectStroke(cx, 82, 130, 40, 0.78, 0.83, 0.89, 0.6);
    p2.text(c.label, cx + 6, 94, 7.2, true, 0.3, 0.36, 0.45);
    p2.text(c.val, cx + 6, 106, 8.6, true, 0.04, 0.45, 0.32);
    p2.text(c.sub, cx + 6, 117, 6.8, false, 0.35, 0.4, 0.48);
  });

  // Table Header for 10 KPIs
  const kpiTop = 132;
  p2.rectFill(28, kpiTop, 539, 17, 0.12, 0.16, 0.24);
  p2.text('Código', 32, kpiTop + 11.5, 7.5, true, 1, 1, 1);
  p2.text('Indicador Clave de Desempeño (KPI) y Fórmula Base', 84, kpiTop + 11.5, 7.5, true, 1, 1, 1);
  p2.text('Estado Actual (As-Is)', 276, kpiTop + 11.5, 7.5, true, 0.98, 0.65, 0.65);
  p2.text('Meta Propuesta (To-Be)', 394, kpiTop + 11.5, 7.5, true, 0.55, 0.95, 0.75);
  p2.text('Impacto / Avance', 492, kpiTop + 11.5, 7.5, true, 1, 1, 1);

  let ky = kpiTop + 17;
  KPI_SCORECARD_ITEMS.forEach((kpi, idx) => {
    const rowH = 38;
    if (idx % 2 === 1) {
      p2.rectFill(28, ky, 539, rowH, 0.97, 0.98, 0.99);
    }
    p2.rectStroke(28, ky, 539, rowH, 0.84, 0.87, 0.91, 0.45);

    p2.text(kpi.code, 32, ky + 14, 7.8, true, 0.04, 0.38, 0.58);
    p2.text(kpi.categoryLabel.slice(0, 14), 32, ky + 25, 6.0, false, 0.35, 0.4, 0.5);

    p2.text(kpi.name.slice(0, 44), 84, ky + 13, 7.6, true, 0.08, 0.12, 0.2);
    p2.text(`Base: ${kpi.formulaOrBase.slice(0, 46)}`, 84, ky + 25, 6.5, false, 0.3, 0.35, 0.44);

    p2.text(kpi.asIsValue.slice(0, 32), 276, ky + 19, 7.1, true, 0.72, 0.14, 0.2);
    p2.text(kpi.toBeTarget.slice(0, 28), 394, ky + 19, 7.1, true, 0.04, 0.48, 0.32);

    const pct = layoutMode === 'as-is' ? kpi.progressPctAsIs : kpi.progressPctToBe;
    p2.text(kpi.deltaLabel.slice(0, 24), 492, ky + 13, 6.8, true, 0.55, 0.32, 0.04);
    p2.text(`Nivel (${layoutMode === 'as-is' ? 'As-Is' : 'To-Be'}): ${pct}%`, 492, ky + 22, 6.3, false, 0.3, 0.35, 0.45);

    p2.rectFill(492, ky + 27, 68, 5, 0.86, 0.89, 0.93);
    const barW = Math.max(4, Math.round((68 * pct) / 100));
    if (layoutMode === 'as-is') {
      p2.rectFill(492, ky + 27, barW, 5, 0.85, 0.22, 0.3);
    } else {
      p2.rectFill(492, ky + 27, barW, 5, 0.06, 0.62, 0.42);
    }

    ky += rowH;
  });

  // Mathematical Formulas Reference Box at bottom of Page 2
  const formY = ky + 10;
  p2.rectFill(28, formY, 539, 106, 0.94, 0.97, 0.95);
  p2.rectStroke(28, formY, 539, 106, 0.6, 0.8, 0.68, 0.7);
  p2.text('COMPENDIO DE FÓRMULAS MATEMÁTICAS APLICADAS EN EL MODELO AFM', 36, formY + 14, 8.5, true, 0.04, 0.42, 0.28);
  p2.text(
    '1. Ciclo Ponderado y Muda: T_ciclo = Sigma E_j = (Sigma T_i)/n = 15.479/43 = 360,0 s | %Muda = (E2+E3+E4+E6)/T_ciclo = 127,2/360,0 = 35,3%',
    36,
    formY + 28,
    7.2,
    false,
    0.15,
    0.22,
    0.3
  );
  p2.text(
    '2. Factor de Dispersión Espacial y Temporal: FD_esp = k / k_opt (4,0x a 5,0x -> 1,0x) | ID_esp = (k-1)/(k_max-1) | CV = (sigma / media) x 100 = 74,1%',
    36,
    formY + 41,
    7.2,
    false,
    0.15,
    0.22,
    0.3
  );
  p2.text(
    '3. Entropía del Ciclo y Espacial (Shannon): H(P) = -Sigma p_i * log2(p_i) = 1,876 b (H_max = 2,000 b) | H_esp(k) = log2(k) = 2,000 a 2,322 bits',
    36,
    formY + 54,
    7.2,
    false,
    0.15,
    0.22,
    0.3
  );
  p2.text(
    '4. Entropía Binaria ERI y Neguentropía: H_b(p) = -p*log2(p) - (1-p)*log2(1-p) = 0,5842 b (ERI 86%) | Delta H = H_meta - H_emp = -0,4428 b (-75,80%)',
    36,
    formY + 67,
    7.2,
    false,
    0.15,
    0.22,
    0.3
  );
  p2.text(
    '5. Divergencia Kullback-Leibler: D_KL(P||Q) = Sigma p_i * log2(p_i / q_i) -> Stock ERI: 0,2310 b | Ciclo: 0,1451 b | Anomalías: 1,0142 b',
    36,
    formY + 80,
    7.2,
    false,
    0.15,
    0.22,
    0.3
  );
  p2.text(
    '6. Ruta Mínima por Vanos CAD (Dijkstra) e Isometría 3D: L_min = min Sigma ||P_{k+1}-P_k|| (vanos A1..A9) | y_iso = (rx+ry)*0,32*z_m - z*0,82*z_m',
    36,
    formY + 93,
    7.2,
    true,
    0.04,
    0.42,
    0.28
  );

  // Footer Page 2
  p2.line(28, 808, 567, 808, 0.75, 0.8, 0.86, 0.6);
  p2.text('Proyecto AFM - Electro NICO (Grupo TB4 - UTU) · Tablero de Control de KPIs y Fórmulas Matemáticas', 28, 822, 7.5, false, 0.4, 0.45, 0.52);
  p2.text('Página 2 de 2', 515, 822, 7.5, true, 0.3, 0.35, 0.45);

  // ==================== ASSEMBLE VALID %PDF-1.4 DOCUMENT ====================
  const stream1 = p1.getContent();
  const stream2 = p2.getContent();

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `7 0 obj\n<< /Length ${stream1.length} >>\nstream\n${stream1}\nendstream\nendobj\n`,
    `8 0 obj\n<< /Length ${stream2.length} >>\nstream\n${stream2}\nendstream\nendobj\n`,
  ];

  let pdfStr = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdfStr.length);
    pdfStr += obj;
  }

  const xrefOffset = pdfStr.length;
  pdfStr += `xref\n0 ${objects.length + 1}\n`;
  pdfStr += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdfStr += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdfStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const bytes = new Uint8Array(pdfStr.length);
  for (let i = 0; i < pdfStr.length; i++) {
    bytes[i] = pdfStr.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function triggerPdfDownload(payload: PdfExportPayload): { fileName: string; sizeKb: number } {
  const bytes = buildProjectSummaryPdfBytes(payload);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const obsSuffix = payload.activeIndividualObs ? `_Obs${payload.activeIndividualObs.globalId}` : '_Consolidado';
  const fileName = `Resumen_AFM_Electro_NICO_${payload.layoutMode.toUpperCase()}${obsSuffix}.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);

  return {
    fileName,
    sizeKb: Math.max(1, Math.round((bytes.byteLength / 1024) * 10) / 10),
  };
}
