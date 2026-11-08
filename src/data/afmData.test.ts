import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBinaryEntropy,
  calculateDispersionMetrics,
  calculateKLDivergenceBinary,
  calculateSpatialEntropy,
  computeCycleSummary,
  FAMILY_DISPERSION_ITEMS,
  getOperatorColor,
  HTC_STAGES,
  KPI_SCORECARD_ITEMS,
  LAYOUT_OPENINGS,
  OPERATOR_COLORS,
  OPERATOR_PROFILES,
  PARETO_BOTTLENECKS,
  RECEPTION_METRICS,
  SECTORS,
  SHANNON_METRICS,
  SHELF_UNITS,
  projectIso3D,
} from './afmData';
import {
  ALL_43_OBSERVATIONS,
  GUSTAVO_HTC_ACTIVO,
  GUSTAVO_HTC_PONDERADO,
} from './htcObservationsData';
import {
  buildFullCycleCorridorWaypoints,
  CORRIDOR_NODES,
  findCorridorPath,
  getCorrelativeTrioObservations,
  interpolateAlongWaypoints,
} from './corridorPathfinding';
import { buildProjectSummaryPdfBytes } from '../utils/pdfExport';

test('Shannon binary entropy H_b matches ERI baseline (88%), empirical (86%), and ISO 9001 target (98%)', () => {
  assert.equal(calculateBinaryEntropy(0.88), 0.5294);
  assert.equal(calculateBinaryEntropy(0.86), 0.5842);
  assert.equal(calculateBinaryEntropy(0.98), 0.1414);

  const deltaH = Number((calculateBinaryEntropy(0.98) - calculateBinaryEntropy(0.86)).toFixed(4));
  assert.equal(deltaH, SHANNON_METRICS.negentropy.deltaHBits);
});

test('Kullback-Leibler divergence D_KL(P||Q) matches empirical ERI (86% vs 98%) and baseline (88% vs 98%)', () => {
  assert.equal(calculateKLDivergenceBinary(0.88, 0.98), 0.1735);
  assert.equal(calculateKLDivergenceBinary(0.86, 0.98), 0.2310);
});

test('Spatial entropy H_esp = log2(k) matches k=4, k=5, and k=1 consolidated', () => {
  assert.equal(calculateSpatialEntropy(4), 2.000);
  assert.equal(calculateSpatialEntropy(5), 2.322);
  assert.equal(calculateSpatialEntropy(1), 0.000);
});

test('Spatial and Temporal Dispersion Factors (FD_esp and CV) match k=5 As-Is, k=1 To-Be, and n=43 sample', () => {
  assert.equal(FAMILY_DISPERSION_ITEMS.length, 4);
  const sampleSec = ALL_43_OBSERVATIONS.map((o) => o.totalSec);
  const dispAsIs = calculateDispersionMetrics(5, sampleSec);
  const dispToBe = calculateDispersionMetrics(1, sampleSec);

  assert.equal(dispAsIs.spatialFactor, 5.0);
  assert.equal(dispAsIs.normalizedSpatialPct, 100.0);
  assert.equal(dispAsIs.hEspBits, 2.322);
  assert.equal(dispAsIs.meanSec, 360.0);
  assert.ok(dispAsIs.temporalCvPct > 65);
  assert.equal(dispAsIs.minSec, 10);
  assert.equal(dispAsIs.maxSec, 1398);

  assert.equal(dispToBe.spatialFactor, 1.0);
  assert.equal(dispToBe.normalizedSpatialPct, 0.0);
  assert.equal(dispToBe.hEspBits, 0.0);
});

test('PDF Export generator produces a valid 2-page %PDF-1.4 document with simulator state, KPIs, and formulas', () => {
  const pdfBytes = buildProjectSummaryPdfBytes({
    layoutMode: 'as-is',
    selectedOp: 'global',
    activeStageIdx: 4,
    activeIndividualObs: ALL_43_OBSERVATIONS[3],
    simEriPct: 86,
    simKSectors: 5,
    selectedSectorId: 'sec3',
    generatedAt: '05/11/2026 20:05',
  });

  assert.ok(pdfBytes.byteLength > 4000);
  const pdfAscii = Buffer.from(pdfBytes).toString('latin1');
  assert.ok(pdfAscii.startsWith('%PDF-1.4\n'));
  assert.ok(pdfAscii.trimEnd().endsWith('%%EOF'));
  assert.ok(pdfAscii.includes('/Count 2'));
  assert.ok(pdfAscii.includes('KPI-01'));
  assert.ok(pdfAscii.includes('KPI-10'));
  assert.ok(pdfAscii.includes('Obs #4/43'));
  assert.ok(pdfAscii.includes('FD_esp'));
});

test('CAD Reference Sectors 1 to 7, Equal Width S3=S4, 8 Openings, and Shelf Inventory A-K match blueprint', () => {
  assert.equal(SECTORS.length, 7);
  assert.deepEqual(
    SECTORS.map((s) => s.refNum),
    [1, 2, 3, 4, 5, 6, 7]
  );

  const sec3 = SECTORS.find((s) => s.id === 'sec3')!;
  const sec4 = SECTORS.find((s) => s.id === 'sec4')!;
  assert.equal(sec3.w, sec4.w);
  assert.equal(sec3.h, sec4.h);

  assert.equal(LAYOUT_OPENINGS.length, 8);
  assert.equal(LAYOUT_OPENINGS.some((o) => o.code === 'A3'), false);
  const openingA2 = LAYOUT_OPENINGS.find((o) => o.code === 'A2')!;
  assert.equal(openingA2.widthCm, '150 cm');
  assert.equal(openingA2.x1, 45);
  assert.equal(openingA2.y1, 305);
  assert.equal(openingA2.x2, 115);
  assert.equal(openingA2.y2, 305);

  const shelfG3 = SHELF_UNITS.find((sh) => sh.id === 's3-G')!;
  assert.equal(shelfG3.x, 532);
  assert.equal(shelfG3.y, 315);

  const sec1Shelves = SHELF_UNITS.filter((sh) => sh.sectorId === 'sec1');
  assert.equal(sec1Shelves.length, 0);
  const sec2Gaveteros = SHELF_UNITS.filter((sh) => sh.sectorId === 'sec2' && sh.cubiculos === 8);
  assert.equal(sec2Gaveteros.length, 8);
  const sec3Shelves = SHELF_UNITS.filter((sh) => sh.sectorId === 'sec3');
  assert.equal(sec3Shelves.length, 11);
  const sec7Shelves = SHELF_UNITS.filter((sh) => sh.sectorId === 'sec7');
  assert.equal(sec7Shelves.length, 10);
});

test('Corridor pathfinding places E1/E7/E8 on south side of counter, respects CAD openings (no A3; S7 via A5 -> A6 -> A7), and interpolates smoothly', () => {
  // Mostrador horizontal is at y=400..424; customer service (E1), packing (E7), and PC invoicing/stock (E8) must be on the south side (y > 424)
  const mostradorShelves = SHELF_UNITS.filter((s) => s.id === 's2-pc' || s.id === 's2-most1');
  const mostradorSouthEdgeY = Math.max(...mostradorShelves.map((s) => s.y + s.d));
  assert.equal(mostradorSouthEdgeY, 424);
  assert.ok(CORRIDOR_NODES.N_PC.y > mostradorSouthEdgeY);
  assert.ok(CORRIDOR_NODES.N_MOST_E1.y > mostradorSouthEdgeY);
  assert.ok(CORRIDOR_NODES.N_MOST_E7.y > mostradorSouthEdgeY);

  const pathToS3 = findCorridorPath('N_MOST_E1', 'N_S3_PICK');
  const codesS3 = pathToS3.map((p) => p.openingCode).filter(Boolean);
  assert.ok(codesS3.includes('A4'));
  assert.ok(codesS3.includes('A5'));

  // Reaching Sector 7 from Sector 2 must go through A5 -> A6 -> A7
  const pathS2ToS7 = findCorridorPath('N_S2_PASILLO', 'N_S7_PICK');
  const codesS2ToS7 = pathS2ToS7.map((p) => p.openingCode).filter(Boolean);
  assert.deepEqual(codesS2ToS7, ['A5', 'A6', 'A7']);

  // Reaching Sector 7 from Sector 1 must exit S1 via A2 and then go through A5 -> A6 -> A7 (no A3 shortcut)
  const pathS1ToS7 = findCorridorPath('N_S1_SHOW', 'N_S7_PICK');
  const codesS1ToS7 = pathS1ToS7.map((p) => p.openingCode).filter(Boolean);
  assert.equal(codesS1ToS7.includes('A3'), false);
  assert.deepEqual(codesS1ToS7.slice(-3), ['A5', 'A6', 'A7']);

  const pathToS4 = findCorridorPath('N_S3_MID', 'N_S4_PICK');
  const codesS4 = pathToS4.map((p) => p.openingCode).filter(Boolean);
  assert.ok(codesS4.includes('ESC'));

  const pathToS5 = findCorridorPath('N_S3_MID', 'N_S5_PICK');
  const codesS5 = pathToS5.map((p) => p.openingCode).filter(Boolean);
  assert.ok(codesS5.includes('A6'));
  assert.ok(codesS5.includes('A8'));

  const pStart = interpolateAlongWaypoints(pathToS3, 0);
  const pMid1 = interpolateAlongWaypoints(pathToS3, 0.45);
  const pMid2 = interpolateAlongWaypoints(pathToS3, 0.50);
  const pEnd = interpolateAlongWaypoints(pathToS3, 1);

  assert.equal(pStart.x, pathToS3[0].x);
  assert.equal(pEnd.x, pathToS3[pathToS3.length - 1].x);
  const stepDist = Math.hypot(pMid2.x - pMid1.x, pMid2.y - pMid1.y);
  assert.ok(stepDist > 0 && stepDist < 35);

  const cycleRoute = buildFullCycleCorridorWaypoints('as-is', ALL_43_OBSERVATIONS[11]);
  assert.ok(cycleRoute.length >= 6);
  const cycleOpenings = cycleRoute.map((p) => p.openingCode).filter(Boolean);
  assert.equal(cycleOpenings.includes('A3'), false);
  assert.ok(cycleOpenings.includes('A5'));
  assert.ok(cycleOpenings.includes('A6'));
  assert.ok(cycleOpenings.includes('A7'));
});

test('Each operator has a unique node color and getCorrelativeTrioObservations returns 3 correlative measurements across all 43', () => {
  const uniqueHexes = new Set(Object.values(OPERATOR_COLORS).map((c) => c.hex));
  assert.equal(uniqueHexes.size, 7);
  assert.equal(getOperatorColor('Nico').hex, '#38bdf8');
  assert.equal(getOperatorColor('Agustina').hex, '#f472b6');
  assert.equal(getOperatorColor('Franco').hex, '#fbbf24');
  assert.equal(getOperatorColor('Gervin').hex, '#34d399');
  assert.equal(getOperatorColor('Facundo').hex, '#a78bfa');
  assert.equal(getOperatorColor('Lautaro').hex, '#fb923c');
  assert.equal(getOperatorColor('Mostrador').hex, '#2dd4bf');

  const trioStart = getCorrelativeTrioObservations(ALL_43_OBSERVATIONS[0]);
  assert.deepEqual(
    trioStart.map((o) => o.globalId),
    [1, 2, 3]
  );

  const trioWrap = getCorrelativeTrioObservations(ALL_43_OBSERVATIONS[41]);
  assert.deepEqual(
    trioWrap.map((o) => o.globalId),
    [42, 43, 1]
  );
});

test('All 43 individual observations sum to 15,479 s (258.0 min) with 25/43 anomalies and exact Gustavo/Ana/Melina strata', () => {
  assert.equal(ALL_43_OBSERVATIONS.length, 43);

  const gustavoObs = ALL_43_OBSERVATIONS.filter((o) => o.observerKey === 'gustavo');
  const anaObs = ALL_43_OBSERVATIONS.filter((o) => o.observerKey === 'ana');
  const melinaObs = ALL_43_OBSERVATIONS.filter((o) => o.observerKey === 'melina');

  assert.equal(gustavoObs.length, 13);
  assert.equal(anaObs.length, 14);
  assert.equal(melinaObs.length, 16);

  const gustavoSum = gustavoObs.reduce((s, o) => s + o.totalSec, 0);
  const anaSum = anaObs.reduce((s, o) => s + o.totalSec, 0);
  const melinaSum = melinaObs.reduce((s, o) => s + o.totalSec, 0);
  const grandTotalSec = ALL_43_OBSERVATIONS.reduce((s, o) => s + o.totalSec, 0);

  assert.equal(gustavoSum, 4931);
  assert.equal(anaSum, 5927);
  assert.equal(melinaSum, 4621);
  assert.equal(grandTotalSec, 15479);

  assert.equal(gustavoObs[0].totalSec, 992);
  assert.equal(gustavoObs[11].totalSec, 813);
  assert.equal(gustavoObs[11].stages[7], 460);
  assert.equal(gustavoObs[12].totalSec, 10);

  assert.equal(anaObs[3].stages[3], 365);
  assert.equal(anaObs[3].stages[4], 546);

  const anomalyCount = ALL_43_OBSERVATIONS.filter((o) => o.hasAnomaly).length;
  assert.equal(anomalyCount, 25);

  assert.equal(GUSTAVO_HTC_ACTIVO.totalCycleSec, 670.2);
  assert.equal(GUSTAVO_HTC_PONDERADO.rows.length, 8);
});

test('HTC consolidated table (n=43) and To-Be Hypothesis 4 reduction (-40% to <= 216.0 s)', () => {
  const globalAsIs = computeCycleSummary('global', 'as-is');
  assert.equal(OPERATOR_PROFILES.global.weightedCycleSec, 360.0);
  assert.equal(HTC_STAGES.length, 8);

  const toBeSummary = computeCycleSummary('global', 'to-be');
  assert.equal(toBeSummary.totalSec, 216.0);
  assert.equal(toBeSummary.obstacleSec, 0.0);
  assert.ok(toBeSummary.walkSec <= 23.8);
  assert.ok(toBeSummary.searchSec <= 13.9);
  assert.ok(globalAsIs.totalSec > toBeSummary.totalSec);
});

test('Pareto bottlenecks (39 events, 25/43 failed orders), reception (5 lots), and 10 KPI Scorecard items', () => {
  assert.equal(PARETO_BOTTLENECKS.length, 6);
  assert.equal(RECEPTION_METRICS.lotsCount, 5);
  assert.equal(RECEPTION_METRICS.totalBoxes, 13);
  assert.equal(RECEPTION_METRICS.doorTimeSec, 96.22);

  assert.equal(KPI_SCORECARD_ITEMS.length, 10);
  assert.equal(KPI_SCORECARD_ITEMS[0].code, 'KPI-01');
  assert.equal(KPI_SCORECARD_ITEMS[9].code, 'KPI-10');
});

test('Isometric 3D projection elevates Z height accurately', () => {
  const base = projectIso3D(470, 310, 0, 32, 1, 450, 280);
  const top = projectIso3D(470, 310, 80, 32, 1, 450, 280);
  assert.equal(base.sx, top.sx);
  assert.ok(top.sy < base.sy);
});

