import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, FileDown, Sigma, Truck, X } from 'lucide-react';
import { HtcSimulatorSection } from './components/HtcSimulatorSection';
import { KpiScorecard } from './components/KpiScorecard';
import { LayoutViewport } from './components/LayoutViewport';
import { MathFormulasModal } from './components/MathFormulasModal';
import {
  calculateBinaryEntropy,
  calculateDispersionMetrics,
  calculateKLDivergenceBinary,
  calculateSpatialEntropy,
  HTC_STAGES,
  LayoutMode,
  OperatorKey,
  PARETO_BOTTLENECKS,
  SHANNON_METRICS,
  ViewDimension,
} from './data/afmData';
import { ALL_43_OBSERVATIONS, IndividualObservation } from './data/htcObservationsData';
import { triggerPdfDownload } from './utils/pdfExport';

export default function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('as-is');
  const [viewDim, setViewDim] = useState<ViewDimension>('2d');
  const [selectedOp, setSelectedOp] = useState<OperatorKey>('global');
  const [selectedObserver, setSelectedObserver] = useState<string>('nico');
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [activeIndividualObs, setActiveIndividualObs] = useState<IndividualObservation | null>(ALL_43_OBSERVATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showSpaghetti, setShowSpaghetti] = useState<boolean>(true);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('sec3');
  const [selectedBottleneckRank, setSelectedBottleneckRank] = useState<number | null>(1);
  const [isoAngle, setIsoAngle] = useState<number>(26);
  const [isoZoom, setIsoZoom] = useState<number>(0.86);
  const [simEriPct, setSimEriPct] = useState<number>(86);
  const [simKSectors, setSimKSectors] = useState<number>(5);
  const [isMathModalOpen, setIsMathModalOpen] = useState<boolean>(false);
  const [pdfNotice, setPdfNotice] = useState<{ fileName: string; sizeKb: number; timestamp: string } | null>(null);

  useEffect(() => {
    setSimEriPct(layoutMode === 'as-is' ? 86 : 98);
    setSimKSectors(layoutMode === 'as-is' ? 5 : 1);
  }, [layoutMode]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStageIdx((prev) => {
        const nextStage = (prev + 1) % HTC_STAGES.length;
        if (nextStage === 0) {
          setActiveIndividualObs((cur) => {
            const idx = cur ? cur.globalId % ALL_43_OBSERVATIONS.length : 0;
            return ALL_43_OBSERVATIONS[idx];
          });
        }
        return nextStage;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const simHb = calculateBinaryEntropy(simEriPct / 100);
  const simDkl = calculateKLDivergenceBinary(simEriPct / 100, 0.98);
  const simHesp = calculateSpatialEntropy(simKSectors);
  const dispMetrics = calculateDispersionMetrics(
    simKSectors,
    ALL_43_OBSERVATIONS.map((o) => o.totalSec)
  );

  const handleExportPdf = () => {
    const res = triggerPdfDownload({
      layoutMode,
      selectedOp,
      activeStageIdx,
      activeIndividualObs,
      simEriPct,
      simKSectors,
      selectedSectorId,
    });
    setPdfNotice({
      fileName: res.fileName,
      sizeKb: res.sizeKb,
      timestamp: new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-slate-950/95 border-b border-slate-800">
        <a href="#top" className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          Electro NICO · Proyecto AFM (Grupo TB4 - UTU)
        </a>
        <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-300" aria-label="Secciones del proyecto">
          <a href="#layout-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Layout 2D y 3D</a>
          <a href="#htc-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Simulador HTC (43 Obs)</a>
          <a href="#pareto-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Pareto y Recepción</a>
          <a href="#shannon-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Dispersión y Shannon</a>
          <a href="#kpi-section" className="hover:text-emerald-400 text-emerald-300 font-semibold transition-colors whitespace-nowrap shrink-0">Cuadro de KPIs</a>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMathModalOpen(true)}
            data-testid="open-math-modal-btn"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sigma className="w-3.5 h-3.5 text-sky-400" />
            <span>Fórmulas Matemáticas</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            data-testid="export-pdf-btn"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar Resumen PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode((m) => (m === 'as-is' ? 'to-be' : 'as-is'))}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              layoutMode === 'as-is' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-rose-600 text-white hover:bg-rose-500'
            }`}
          >
            {layoutMode === 'as-is' ? 'Cambiar a Propuesta AFM (To-Be)' : 'Volver a Estado Actual (As-Is)'}
          </button>
        </div>
      </header>

      <main id="top" className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* PDF Export Confirmation Banner */}
        {pdfNotice && (
          <div
            data-testid="pdf-export-banner"
            className="bg-emerald-950/60 border border-emerald-500/60 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Resumen PDF generado y descargado: <strong className="font-mono text-white">{pdfNotice.fileName}</strong> ({pdfNotice.sizeKb} KB · 2 páginas A4 · {pdfNotice.timestamp}) — Incluye resultados actuales del simulador, Factor de Dispersión ({dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}×), Fórmulas Matemáticas y los 10 KPIs del panel.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPdfNotice(null)}
              className="text-emerald-300 hover:text-white p-1 rounded cursor-pointer"
              aria-label="Cerrar notificación PDF"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hero & Master Comparison Switch */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
              <span>Análisis de Flujo de Materiales (AFM)</span>
              <span aria-hidden="true">·</span>
              <span>Grupo TB4 - UTU</span>
              <span aria-hidden="true">·</span>
              <span>Muestra: Gustavo (n=13), Ana (n=14), Melina (n=16) · Total: 15.479 s (258,0 min)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Diagnóstico Operativo, Simulación 2D/3D (n = 43) y Modelo Entrópico de Electro NICO
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Comparativa integral entre el Estado Actual (As-Is: Factor de Dispersión FD_esp = 4,0× a 5,0× en k = 4 a 5 sectores, CV temporal = {dispMetrics.temporalCvPct.toFixed(1).replace('.', ',')}% y 35,3% de Muda física) y la Propuesta AFM (To-Be: Layout ABC con FD_esp = 1,0×, ERI ≥ 98% y ciclo ≤ 216,0 s).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0" role="group" aria-label="Interruptor Maestro As-Is vs To-Be">
            <button
              type="button"
              onClick={() => setLayoutMode('as-is')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                layoutMode === 'as-is' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Estado Actual (As-Is: Caótico)
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('to-be')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                layoutMode === 'to-be' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Propuesta AFM (To-Be: Layout ABC + Codificación)
            </button>
          </div>
        </section>

        {/* Top KPI Strip (5 Cards including Dispersion Factor) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Ciclo Ponderado HTC (n = 43 · 15.479 s)</div>
            <div className="mt-1 text-xl font-bold font-mono text-white">
              {layoutMode === 'as-is' ? '360,0 s (6,00 min)' : '≤ 216,0 s (3,60 min)'}
            </div>
            <div className="mt-1 text-xs text-slate-300">
              {layoutMode === 'as-is' ? '35,3% Muda física (127,2 s caminata y espera)' : 'Meta Hipótesis 4: -40% ciclo total · E4 = 0,0 s'}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4" data-testid="dispersion-factor-card">
            <div className="text-xs text-slate-400">Factor de Dispersión (FD_esp y CV)</div>
            <div className="mt-1 text-xl font-bold font-mono text-amber-400">
              {dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}× (ID {dispMetrics.normalizedSpatialPct.toFixed(0)}%)
            </div>
            <div className="mt-1 text-xs text-slate-300">
              CV temporal: {dispMetrics.temporalCvPct.toFixed(1).replace('.', ',')}% (σ = {dispMetrics.stdDevSec.toFixed(1).replace('.', ',')} s)
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Entropía Espacial H_esp = log₂(k)</div>
            <div className="mt-1 text-xl font-bold font-mono text-sky-400">
              {layoutMode === 'as-is' ? '2,000 a 2,322 bits' : '0,000 bits (k = 1)'}
            </div>
            <div className="mt-1 text-xs text-slate-300">
              {layoutMode === 'as-is' ? 'Dispersión en k = 4 a 5 sectores · D_KL ≤ 2,7504' : 'Familias críticas consolidadas en 1 sector ABC'}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Exactitud ERI y Entropía H_b</div>
            <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
              {layoutMode === 'as-is' ? '0,5842 bits (ERI 86%)' : '0,1414 bits (ERI ≥ 98%)'}
            </div>
            <div className="mt-1 text-xs text-slate-300">Neguentropía ΔH = -0,4428 bits (-75,80% desorden)</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Frecuencia de Anomalías y Recepción</div>
            <div className="mt-1 text-xl font-bold font-mono text-rose-400">
              {layoutMode === 'as-is' ? '58,1% (25/43 pedidos)' : 'Meta ≤ 10,0% fallas'}
            </div>
            <div className="mt-1 text-xs text-slate-300">39 eventos Pareto · 5 lotes recepción (R4/R5 = 0 s)</div>
          </div>
        </section>

        {/* 1. VISTA 2D Y 3D DEL LAYOUT Y RECORRIDOS */}
        <LayoutViewport
          layoutMode={layoutMode}
          viewDim={viewDim}
          setViewDim={setViewDim}
          selectedOp={selectedOp}
          selectedObserver={selectedObserver}
          activeStageIdx={activeStageIdx}
          activeIndividualObs={activeIndividualObs}
          setActiveIndividualObs={setActiveIndividualObs}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          showSpaghetti={showSpaghetti}
          setShowSpaghetti={setShowSpaghetti}
          selectedSectorId={selectedSectorId}
          setSelectedSectorId={setSelectedSectorId}
          selectedBottleneckRank={selectedBottleneckRank}
          setSelectedBottleneckRank={setSelectedBottleneckRank}
          isoAngle={isoAngle}
          setIsoAngle={setIsoAngle}
          isoZoom={isoZoom}
          setIsoZoom={setIsoZoom}
        />

        {/* 2. SIMULADOR INDIVIDUAL DE LAS 43 MEDICIONES Y HOJA DE TRABAJO COMBINADO (HTC) */}
        <HtcSimulatorSection
          selectedOp={selectedOp}
          setSelectedOp={setSelectedOp}
          selectedObserver={selectedObserver}
          setSelectedObserver={setSelectedObserver}
          activeStageIdx={activeStageIdx}
          setActiveStageIdx={setActiveStageIdx}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          setSelectedSectorId={setSelectedSectorId}
          activeIndividualObs={activeIndividualObs}
          setActiveIndividualObs={setActiveIndividualObs}
        />

        {/* 3. CUELLOS DE BOTELLA (PARETO) Y RECEPCIÓN TRUNCADA (5 LOTES) */}
        <section id="pareto-section" className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>03. Pareto de Cuellos de Botella (25/43 Pedidos con Falla = 58,1% | 39 Eventos)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Haz clic en cada anomalía para localizar el foco de fricción en el plano 2D/3D.</p>
            </div>
            <div className="space-y-3">
              {PARETO_BOTTLENECKS.map((item) => (
                <div
                  key={item.code}
                  onClick={() => {
                    setSelectedBottleneckRank(item.rank);
                    setSelectedSectorId(item.sectorId);
                  }}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedBottleneckRank === item.rank ? 'bg-slate-950 border-rose-500/80' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className="text-white">{item.rank}.º {item.code}: {item.title}</span>
                    <span className="font-mono text-rose-400 shrink-0">{item.events} casos · {item.pct.toFixed(1).replace('.', ',')}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, item.pct * 3.2)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  <span>Recepción Truncada (5 Lotes · 13 Cajas)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Relevamiento en Acera Exterior (a 15 m) y Mostrador · Datos auditados por Franco.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Tiempo en Puerta (R1-R3)</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">96,22 s (1,60 min)</div>
                  <div className="text-xs text-slate-400 mt-0.5">5 lotes · 13 cajas totales</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Ubicación (R4) y Guardado (R5)</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">0,00 s (100% lotes)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Recepción truncada frente al mostrador</div>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="font-semibold text-white">Secuencia de Lotes y Trabajo Diferido:</div>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-300"><span>R1-R3 Descarga en vereda (15 m) y control:</span><span className="text-amber-400">96,22 s promedio</span></div>
                  <div className="flex justify-between text-slate-300"><span>R4 Asignación de ubicación en depósito:</span><span className="text-rose-400">0,00 s (100% truncado)</span></div>
                  <div className="flex justify-between text-slate-300"><span>R5 Guardado efectivo en estantería:</span><span className="text-rose-400">0,00 s (100% truncado)</span></div>
                  <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-800 font-bold"><span>Trabajo Diferido (según Franco):</span><span className="text-rose-400">20 a 30 min (1.200 a 1.800 s)</span></div>
                </div>
                <p className="text-slate-400 font-sans pt-1">Las 13 cajas quedan frente al mostrador y en los pasillos de 0,52 m a 0,77 m, alimentando el cuello de botella n.º 1 (D3/E4: 28,2%).</p>
              </div>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-700/50 rounded-lg p-3.5 text-xs space-y-1">
              <div className="font-semibold text-emerald-300">Solución Propuesta AFM (To-Be)</div>
              <p className="text-slate-300">Completar R4 + R5 mediante carro de staging desde la acera exterior (15 m) hacia ubicaciones pre-codificadas ABC, eliminando cajas en pasillos (E4 = 0,0 s).</p>
            </div>
          </div>
        </section>

        {/* 4. PANEL DE FACTOR DE DISPERSIÓN, ENTROPÍA DE SHANNON (H), NEGUENTROPÍA (ΔH) Y KULLBACK-LEIBLER (D_KL) */}
        <section id="shannon-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <span>04. Factor de Dispersión (FD_esp / CV), Entropía de Shannon (H), Neguentropía (ΔH) y Divergencia D_KL</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Cuantificación física-estadística e informacional del desorden del almacén y ganancia neguentrópica ISO 9001.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-xs font-mono bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-sky-300">
                FD_esp = k / k_óptimo · H(P) = -Σ p_i · log₂(p_i) · D_KL(P||Q) = Σ p_i · log₂(p_i / q_i)
              </div>
              <button
                type="button"
                onClick={() => setIsMathModalOpen(true)}
                data-testid="shannon-open-formulas-btn"
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sigma className="w-4 h-4" />
                <span>Visualizar Fórmulas Matemáticas del Modelo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5">
            {[
              { title: 'Factor Dispersión (FD_esp y CV)', val: `${dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}× (ID ${dispMetrics.normalizedSpatialPct.toFixed(0)}%)`, desc: `Dispersión temporal n=43: CV = ${dispMetrics.temporalCvPct.toFixed(1).replace('.', ',')}% (σ = ${dispMetrics.stdDevSec.toFixed(1).replace('.', ',')} s)`, foot: `Rango: ${dispMetrics.minSec}s a ${dispMetrics.maxSec}s (${dispMetrics.maxToMeanRatio.toFixed(2).replace('.', ',')}× media)`, accent: 'text-amber-400', footColor: 'text-amber-300' },
              { title: SHANNON_METRICS.cycle.title, val: '1,876 bits (93,8% H_max)', desc: 'H_max = 2,000 bits → Meta To-Be ≤ 1,350 bits (≤ 67,5%)', foot: 'Divergencia D_KL(P||Q) = 0,1451 bits', accent: 'text-sky-400', footColor: 'text-amber-300' },
              { title: SHANNON_METRICS.spatial.title, val: '2,000 a 2,322 bits', desc: 'Dispersión k = 4 a 5 sectores → Meta To-Be = 0,000 bits (k = 1 ABC)', foot: 'D_KL = 2,4487 a 2,7504 bits', accent: 'text-sky-400', footColor: 'text-amber-300' },
              { title: SHANNON_METRICS.stockEri.title, val: '0,5842 bits (ERI 86%)', desc: 'Base (ERI 88%): 0,5294 bits · Meta ISO 9001 (ERI ≥ 98%): 0,1414 bits', foot: 'Empírico n=43 (falla 14%): D_KL = 0,2310 b', accent: 'text-sky-400', footColor: 'text-amber-300' },
              { title: SHANNON_METRICS.negentropy.title, val: 'ΔH = -0,4428 bits', desc: 'Reducción del 75,80% en el desorden informacional del inventario (ERI 86% → ≥ 98%).', foot: 'Inyección de orden ABC + ERI', accent: 'text-emerald-400', footColor: 'text-emerald-300' },
              { title: SHANNON_METRICS.anomalies.title, val: '58,1% actual vs ≤ 10,0%', desc: '25/43 pedidos con falla (39 eventos) frente a meta operativa ≤ 10,0%.', foot: 'H(P) = 0,9808 bits · D_KL = 1,0142 bits', accent: 'text-rose-400', footColor: 'text-rose-300' },
            ].map((card) => (
              <div key={card.title} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className={`text-xs font-semibold ${card.accent}`}>{card.title}</div>
                  <div className="text-base font-bold font-mono text-white">{card.val}</div>
                  <div className="text-xs text-slate-300">{card.desc}</div>
                </div>
                <div className={`pt-2 border-t border-slate-800 text-[11px] font-mono ${card.footColor}`}>{card.foot}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>Simulador ERI (Exactitud de Registro de Inventario):</span>
                <span className="font-mono text-sky-400">{simEriPct}% (Falla: {100 - simEriPct}%)</span>
              </label>
              <input type="range" min={70} max={99} value={simEriPct} onChange={(e) => setSimEriPct(Number(e.target.value))} className="w-full accent-sky-500" aria-label="Simulador de porcentaje ERI" />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono"><span>Empírico n=43: 86%</span><span>Línea Base: 88%</span><span>Meta ISO 9001: 98%</span></div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>Factor de Dispersión de Familias Críticas (k sectores):</span>
                <span className="font-mono text-amber-400">k = {simKSectors} (FD_esp = {dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}×)</span>
              </label>
              <input type="range" min={1} max={5} value={simKSectors} onChange={(e) => setSimKSectors(Number(e.target.value))} className="w-full accent-amber-500" aria-label="Simulador de sectores k" />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono"><span>k=1 (FD 1,0× · 0 b)</span><span>k=4 (FD 4,0× · 2,000 b)</span><span>k=5 (FD 5,0× · 2,322 b)</span></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-4 gap-2 text-center font-mono">
              <div><div className="text-[10px] text-slate-400 font-sans">FD_esp (k/1)</div><div className="text-sm font-bold text-amber-400">{dispMetrics.spatialFactor.toFixed(1).replace('.', ',')}×</div></div>
              <div><div className="text-[10px] text-slate-400 font-sans">H_b (Stock)</div><div className="text-sm font-bold text-white">{simHb.toFixed(4).replace('.', ',')} b</div></div>
              <div><div className="text-[10px] text-slate-400 font-sans">D_KL vs 98%</div><div className="text-sm font-bold text-sky-400">{simDkl.toFixed(4).replace('.', ',')} b</div></div>
              <div><div className="text-[10px] text-slate-400 font-sans">H_esp = log₂(k)</div><div className="text-sm font-bold text-emerald-400">{simHesp.toFixed(3).replace('.', ',')} b</div></div>
            </div>
          </div>
        </section>

        {/* 5. CUADRO MAESTRO DE KPIs (AS-IS vs TO-BE) */}
        <KpiScorecard
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          onExportPdf={handleExportPdf}
          onOpenMathModal={() => setIsMathModalOpen(true)}
        />
      </main>

      {/* Modal de Fórmulas Matemáticas y Factor de Dispersión */}
      <MathFormulasModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        layoutMode={layoutMode}
        selectedOp={selectedOp}
        simEriPct={simEriPct}
        simKSectors={simKSectors}
        activeIndividualObs={activeIndividualObs}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}
