import React, { useState } from 'react';
import { Calculator, CheckCircle2, FileDown, Layers, Sigma, X } from 'lucide-react';
import {
  FAMILY_DISPERSION_ITEMS,
  LayoutMode,
  OPERATOR_PROFILES,
  OperatorKey,
  calculateBinaryEntropy,
  calculateDispersionMetrics,
  calculateKLDivergenceBinary,
  calculateSpatialEntropy,
} from '../data/afmData';
import { ALL_43_OBSERVATIONS, IndividualObservation } from '../data/htcObservationsData';

interface MathFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: LayoutMode;
  selectedOp: OperatorKey;
  simEriPct: number;
  simKSectors: number;
  activeIndividualObs: IndividualObservation | null;
  onExportPdf: () => void;
}

type FormulaCategory = 'all' | 'htc' | 'dispersion' | 'shannon' | 'geometria';

export function MathFormulasModal({
  isOpen,
  onClose,
  layoutMode,
  selectedOp,
  simEriPct,
  simKSectors,
  activeIndividualObs,
  onExportPdf,
}: MathFormulasModalProps) {
  const [activeCategory, setActiveCategory] = useState<FormulaCategory>('all');

  if (!isOpen) return null;

  const simHb = calculateBinaryEntropy(simEriPct / 100);
  const simDkl = calculateKLDivergenceBinary(simEriPct / 100, 0.98);
  const simHesp = calculateSpatialEntropy(simKSectors);
  const disp = calculateDispersionMetrics(
    simKSectors,
    ALL_43_OBSERVATIONS.map((o) => o.totalSec)
  );
  const deltaHLive = Number((0.1414 - simHb).toFixed(4));
  const reductionLivePct = simHb > 0 ? Number(((Math.abs(deltaHLive) / simHb) * 100).toFixed(2)) : 100;
  const opProfile = OPERATOR_PROFILES[selectedOp];
  const frictionRatio = Number((opProfile.activeFrictionSec / opProfile.weightedCycleSec).toFixed(2));

  const formulas = [
    {
      id: 'f-1',
      code: 'EC-01',
      category: 'htc' as FormulaCategory,
      categoryLabel: 'Ciclo Operativo HTC',
      title: 'Tiempo de Ciclo Total Ponderado (n = 43 pedidos)',
      equation: 'T_ciclo = Σ E_j (j = 1..8) = (Σ T_i) / n',
      variables: 'E_j: promedio ponderado de la etapa j [s] · T_i: tiempo total del pedido i [s] · n = 43 mediciones',
      projectCalculation: 'T_ciclo = 70,8 + 48,5 + 39,6 + 19,6 + 61,3 + 19,5 + 25,6 + 75,0 = 15.479 s / 43 = 360,0 s (6,00 min)',
      liveEval: activeIndividualObs
        ? `Obs #${activeIndividualObs.globalId} (${activeIndividualObs.operatorObserved}): T_pedido = ${activeIndividualObs.totalSec} s (${activeIndividualObs.totalMin.toFixed(2).replace('.', ',')} min)`
        : `Estrato ${opProfile.label}: ${opProfile.weightedCycleSec.toFixed(1).replace('.', ',')} s (Meta To-Be ≤ 216,0 s)`,
      accent: 'text-sky-400',
    },
    {
      id: 'f-2',
      code: 'EC-02',
      category: 'htc' as FormulaCategory,
      categoryLabel: 'Lean / Muda Física',
      title: 'Tiempo y Proporción de Muda Física en el Ciclo (% Muda)',
      equation: 'T_muda = E2 + E3 + E4 + E6   |   % Muda = (T_muda / T_ciclo) × 100',
      variables: 'E2: caminata inicial · E3: búsqueda por memoria · E4: remoción obstáculos · E6: caminata retorno',
      projectCalculation: 'T_muda = 48,5 + 39,6 + 19,6 + 19,5 = 127,2 s   →   % Muda = (127,2 / 360,0) × 100 = 35,3%',
      liveEval: `Estrato ${opProfile.label}: ${opProfile.mudaSec.toFixed(1).replace('.', ',')} s de Muda (${opProfile.mudaPct.toFixed(1).replace('.', ',')}%) → Meta To-Be ≤ 37,7 s (≤ 17,5%)`,
      accent: 'text-rose-400',
    },
    {
      id: 'f-3',
      code: 'EC-03',
      category: 'dispersion' as FormulaCategory,
      categoryLabel: 'Factor de Dispersión Espacial',
      title: 'Factor de Dispersión Espacial (FD_esp) e Índice Normalizado (ID_esp)',
      equation: 'FD_esp = k / k_óptimo   |   ID_esp = [ (k - 1) / (k_máx - 1) ] × 100%',
      variables: 'k: sectores donde se fragmenta una familia crítica (k ∈ [1, 5]) · k_óptimo = 1 (Layout ABC consolidado) · k_máx = 5',
      projectCalculation: 'Estado Actual (As-Is): k = 4 a 5 sectores → FD_esp = 4,0× a 5,0× (ID_esp = 75,0% a 100,0%) · Meta To-Be: FD_esp = 1,0× (ID_esp = 0,0%)',
      liveEval: `Simulador actual (k = ${simKSectors}): FD_esp = ${disp.spatialFactor.toFixed(1).replace('.', ',')}×   |   ID_esp = ${disp.normalizedSpatialPct.toFixed(1).replace('.', ',')}%`,
      accent: 'text-amber-400',
    },
    {
      id: 'f-4',
      code: 'EC-04',
      category: 'dispersion' as FormulaCategory,
      categoryLabel: 'Dispersión Estadística / Temporal',
      title: 'Coeficiente de Variación Muestral (CV) y Factor de Amplificación por Fricción (FA)',
      equation: 'σ = √[ Σ (T_i - x̄)² / (n - 1) ]   |   CV = (σ / x̄) × 100%   |   FA = T_activo(>0) / T_ponderado',
      variables: 'x̄ = 360,0 s (media muestral n=43) · σ = desviación estándar muestral · T_activo(>0): suma de promedios cuando ocurre fricción',
      projectCalculation: `Muestra n = 43: x̄ = ${disp.meanSec.toFixed(1).replace('.', ',')} s · σ = ${disp.stdDevSec.toFixed(1).replace('.', ',')} s → CV = ${disp.temporalCvPct.toFixed(1).replace('.', ',')}% (Rango: ${disp.minSec} s a ${disp.maxSec} s · Razón máx/media = ${disp.maxToMeanRatio.toFixed(2).replace('.', ',')}×)`,
      liveEval: `Estrato ${opProfile.label}: FA = ${opProfile.activeFrictionSec.toFixed(1).replace('.', ',')} s / ${opProfile.weightedCycleSec.toFixed(1).replace('.', ',')} s = ${frictionRatio.toFixed(2).replace('.', ',')}× amplificación por fricción`,
      accent: 'text-amber-400',
    },
    {
      id: 'f-5',
      code: 'EC-05',
      category: 'shannon' as FormulaCategory,
      categoryLabel: 'Entropía de Shannon (Ciclo y Layout)',
      title: 'Entropía del Ciclo Operativo (H_ciclo) y Entropía Espacial (H_esp)',
      equation: 'H(P) = -Σ p_i · log₂(p_i)   |   H_esp(k) = -Σ (1/k) · log₂(1/k) = log₂(k)',
      variables: 'p_i: proporción de tiempo en cada categoría del ciclo (Manual VA, Caminata, Espera, Auto) · H_máx = log₂(4) = 2,000 bits',
      projectCalculation: 'H_ciclo (As-Is) = 1,876 bits (93,8% de H_máx) → Meta To-Be ≤ 1,350 bits | H_esp (k=4..5) = 2,000 a 2,322 bits → Meta To-Be (k=1) = 0,000 bits',
      liveEval: `Simulador actual (k = ${simKSectors}): H_esp = log₂(${simKSectors}) = ${simHesp.toFixed(3).replace('.', ',')} bits`,
      accent: 'text-sky-400',
    },
    {
      id: 'f-6',
      code: 'EC-06',
      category: 'shannon' as FormulaCategory,
      categoryLabel: 'Entropía Binaria y Neguentropía',
      title: 'Entropía Binaria de Stock (H_b sobre ERI) y Neguentropía Inyectada (ΔH)',
      equation: 'H_b(p) = -p · log₂(p) - (1 - p) · log₂(1 - p)   |   ΔH = H_meta - H_actual',
      variables: 'p = ERI (Exactitud de Registro de Inventario) · 1 - p = tasa de quiebre / error de stock (D1)',
      projectCalculation: 'Empírico n=43 (p = 0,86): H_b = 0,5842 bits | Línea Base (p = 0,88): H_b = 0,5294 bits | Meta ISO 9001 (p = 0,98): H_b = 0,1414 bits → ΔH = -0,4428 bits (-75,80%)',
      liveEval: `Simulador ERI = ${simEriPct}%: H_b = ${simHb.toFixed(4).replace('.', ',')} bits | ΔH vs Meta 98% = ${deltaHLive.toFixed(4).replace('.', ',')} bits (-${reductionLivePct.toFixed(1).replace('.', ',')}%)`,
      accent: 'text-emerald-400',
    },
    {
      id: 'f-7',
      code: 'EC-07',
      category: 'shannon' as FormulaCategory,
      categoryLabel: 'Divergencia Informacional',
      title: 'Divergencia de Kullback-Leibler D_KL(P || Q)',
      equation: 'D_KL(P || Q) = Σ p_i · log₂(p_i / q_i) = p · log₂(p / q) + (1 - p) · log₂((1 - p) / (1 - q))',
      variables: 'P = distribución empírica relevada (As-Is) · Q = distribución objetivo de diseño (To-Be / Meta ISO 9001)',
      projectCalculation: 'Stock ERI (86% vs 98%): D_KL = 0,2310 bits | Base (88% vs 98%): D_KL = 0,1735 bits | Ciclo: D_KL = 0,1451 bits | Anomalías (58,1% vs 10%): D_KL = 1,0142 bits | Layout: D_KL = 2,4487 a 2,7504 bits',
      liveEval: `Simulador ERI (${simEriPct}% vs 98%): D_KL(P || Q) = ${simDkl.toFixed(4).replace('.', ',')} bits`,
      accent: 'text-indigo-400',
    },
    {
      id: 'f-8',
      code: 'EC-08',
      category: 'geometria' as FormulaCategory,
      categoryLabel: 'Cinemática Pasillos y 3D',
      title: 'Ruta Mínima por Aberturas CAD (Dijkstra) y Proyección Isométrica 3D',
      equation: 'L_mín = min Σ √[ (x_{k+1} - x_k)² + (y_{k+1} - y_k)² ]   |   y_iso = (rx + ry) · 0,32 · zoom - z · 0,82 · zoom + cy',
      variables: '(x_k, y_k): nodos de pasillos y vanos CAD (A1..A9, Escalera) · rx, ry: coordenadas rotadas por ángulo θ · z: altura de estantería (altoM × 26)',
      projectCalculation: 'Garantiza traslado continuo P(t) = P_k + u(t)·(P_{k+1} - P_k) con easing cuadrático sin atravesar muros ni estanterías.',
      liveEval: `Modo Vista: ${layoutMode === 'as-is' ? 'As-Is (Recorrido multi-sector por A4, A5, A6, A7, Escalera)' : 'To-Be (Ruta consolidada por A4 y A5 a Núcleo ABC)'}`,
      accent: 'text-cyan-400',
    },
  ];

  const visibleFormulas =
    activeCategory === 'all' ? formulas : formulas.filter((f) => f.category === activeCategory);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="math-formulas-modal-title"
      data-testid="math-formulas-modal"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <h2 id="math-formulas-modal-title" className="text-lg font-bold text-white">
                Compendio de Fórmulas Matemáticas y Factor de Dispersión del Modelo AFM
              </h2>
              <p className="text-xs text-slate-400">
                Notación matemática limpia y evaluación en vivo sobre las 43 mediciones (15.479 s) y parámetros del simulador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar Fórmulas y KPIs en PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana de fórmulas matemáticas"
              data-testid="close-math-modal-btn"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all' as FormulaCategory, label: 'Todas las Fórmulas (8)' },
              { id: 'dispersion' as FormulaCategory, label: 'Factor de Dispersión (2)' },
              { id: 'shannon' as FormulaCategory, label: 'Entropía Shannon, ΔH y D_KL (3)' },
              { id: 'htc' as FormulaCategory, label: 'Ciclo HTC y Muda (2)' },
              { id: 'geometria' as FormulaCategory, label: 'Ruta CAD e Isometría 3D (1)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
            <span>FD_esp actual: <strong className="text-amber-400">{disp.spatialFactor.toFixed(1).replace('.', ',')}×</strong></span>
            <span>·</span>
            <span>CV temporal (n=43): <strong className="text-rose-400">{disp.temporalCvPct.toFixed(1).replace('.', ',')}%</strong></span>
            <span>·</span>
            <span>H_b(ERI {simEriPct}%): <strong className="text-sky-400">{simHb.toFixed(4).replace('.', ',')} b</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Formula Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleFormulas.map((f) => (
              <div
                key={f.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {f.code} · {f.categoryLabel}
                    </span>
                    <Calculator className={`w-4 h-4 ${f.accent}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3.5 py-2.5 font-mono text-xs sm:text-sm font-bold text-sky-300 tracking-wide">
                    {f.equation}
                  </div>
                  <p className="text-xs text-slate-400">{f.variables}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="text-slate-300">
                    <span className="font-semibold text-slate-400">Cálculo Base Proyecto: </span>
                    <span className="font-mono">{f.projectCalculation}</span>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-md px-2.5 py-1.5 font-mono text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{f.liveEval}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Family Spatial Dispersion Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Desglose del Factor de Dispersión Espacial por Familia Crítica (FD_esp = k / k_óptimo)
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-300">
                As-Is: k = 4 a 5 sectores (FD_esp = 4,0× a 5,0×) → Meta To-Be: k = 1 sector ABC (FD_esp = 1,0×)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <th className="py-2 px-2.5 font-semibold">Familia de Producto Crítica</th>
                    <th className="py-2 px-2.5 font-semibold">Sectores Ocupados (As-Is)</th>
                    <th className="py-2 px-2.5 font-semibold text-center">k (As-Is)</th>
                    <th className="py-2 px-2.5 font-semibold text-center">FD_esp (As-Is)</th>
                    <th className="py-2 px-2.5 font-semibold text-center">ID_esp (%)</th>
                    <th className="py-2 px-2.5 font-semibold text-center">H_esp = log₂(k)</th>
                    <th className="py-2 px-2.5 font-semibold text-emerald-400">Meta Consolidada (To-Be)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {FAMILY_DISPERSION_ITEMS.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50">
                      <td className="py-2 px-2.5 font-semibold text-white">{item.family}</td>
                      <td className="py-2 px-2.5 text-slate-300 font-mono text-[11px]">{item.sectorsAsIs}</td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-rose-400">{item.kAsIs}</td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-amber-400">
                        {item.dispersionFactorAsIs.toFixed(1).replace('.', ',')}×
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-300">
                        {item.normalizedDispersionPct.toFixed(1).replace('.', ',')}%
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-sky-400">
                        {item.hEspAsIs.toFixed(3).replace('.', ',')} bits
                      </td>
                      <td className="py-2 px-2.5 font-mono text-emerald-300">
                        k = 1 · FD = 1,0× · 0,000 b ({item.sectorsToBe})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
