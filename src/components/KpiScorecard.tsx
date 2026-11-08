import React, { useState } from 'react';
import { BarChart3, CheckCircle2, FileDown, Sigma, TrendingDown } from 'lucide-react';
import { KPI_SCORECARD_ITEMS, KpiItem, LayoutMode } from '../data/afmData';

interface KpiScorecardProps {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  onExportPdf?: () => void;
  onOpenMathModal?: () => void;
}

type CategoryFilter = 'all' | KpiItem['category'];

export function KpiScorecard({ layoutMode, setLayoutMode, onExportPdf, onOpenMathModal }: KpiScorecardProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredKpis =
    categoryFilter === 'all'
      ? KPI_SCORECARD_ITEMS
      : KPI_SCORECARD_ITEMS.filter((k) => k.category === categoryFilter);

  return (
    <section id="kpi-section" className="scroll-mt-20 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>05. Cuadro Maestro de KPIs (Tablero de Control AFM: Línea Base As-Is vs. Meta To-Be)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidado de los 10 indicadores clave de desempeño operativo, logístico e informacional relevados en Electro NICO (n = 43 pedidos y 5 lotes de recepción).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all' as CategoryFilter, label: 'Todos los KPIs (10)' },
            { id: 'operativo' as CategoryFilter, label: 'Operativos y HTC (4)' },
            { id: 'logistica' as CategoryFilter, label: 'Flujo y Recepción (2)' },
            { id: 'entropia' as CategoryFilter, label: 'Entropía y Stock ERI (4)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === tab.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {onOpenMathModal && (
            <button
              type="button"
              onClick={onOpenMathModal}
              data-testid="kpi-open-formulas-btn"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-950 border border-sky-500/50 text-sky-300 hover:bg-sky-950/60 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sigma className="w-3.5 h-3.5 text-sky-400" />
              <span>Ver Fórmulas</span>
            </button>
          )}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              data-testid="kpi-export-pdf-btn"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Exportar PDF (Simulador + KPIs)</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive Summary Banner inside KPI Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Reducción Tiempo de Ciclo</div>
            <div className="text-lg font-bold font-mono text-emerald-400">-40,0% (≤ 216,0 s)</div>
            <div className="text-[11px] text-slate-400">Desde 360,0 s (6,00 min)</div>
          </div>
          <TrendingDown className="w-7 h-7 text-emerald-500/70 shrink-0" />
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Reducción Caminata y Búsqueda</div>
            <div className="text-lg font-bold font-mono text-sky-400">-65,0% Muda</div>
            <div className="text-[11px] text-slate-400">Caminata ≤ 23,8 s · Búsq. ≤ 13,9 s</div>
          </div>
          <TrendingDown className="w-7 h-7 text-sky-500/70 shrink-0" />
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Mejora ERI y Neguentropía</div>
            <div className="text-lg font-bold font-mono text-amber-400">86% → ≥ 98% ERI</div>
            <div className="text-[11px] text-slate-400">ΔH = -0,4428 bits (-75,80%)</div>
          </div>
          <CheckCircle2 className="w-7 h-7 text-amber-500/70 shrink-0" />
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Eliminación Obstrucción y Fallas</div>
            <div className="text-lg font-bold font-mono text-rose-400">E4 = 0,0 s · ≤ 10% Fallas</div>
            <div className="text-[11px] text-slate-400">Desde 58,1% pedidos con falla</div>
          </div>
          <CheckCircle2 className="w-7 h-7 text-rose-500/70 shrink-0" />
        </div>
      </div>

      {/* Main KPI Comparison Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
              <th className="py-3 px-2.5 font-semibold">Código</th>
              <th className="py-3 px-2.5 font-semibold">Dimensión</th>
              <th className="py-3 px-2.5 font-semibold">Indicador Clave de Desempeño (KPI)</th>
              <th className="py-3 px-2.5 font-semibold">Fórmula / Base Empírica</th>
              <th
                onClick={() => setLayoutMode('as-is')}
                className={`py-3 px-2.5 font-semibold cursor-pointer transition-colors ${
                  layoutMode === 'as-is' ? 'bg-rose-950/50 text-rose-300' : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                Estado Actual (As-Is)
              </th>
              <th
                onClick={() => setLayoutMode('to-be')}
                className={`py-3 px-2.5 font-semibold cursor-pointer transition-colors ${
                  layoutMode === 'to-be' ? 'bg-emerald-950/50 text-emerald-300' : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                Meta Propuesta (To-Be)
              </th>
              <th className="py-3 px-2.5 font-semibold w-48">Impacto y Nivel ({layoutMode === 'as-is' ? 'As-Is' : 'To-Be'})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredKpis.map((kpi) => {
              const activeProgress = layoutMode === 'as-is' ? kpi.progressPctAsIs : kpi.progressPctToBe;
              return (
                <tr key={kpi.id} className="bg-slate-900/60 hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-2.5 font-mono font-bold text-sky-400 whitespace-nowrap">{kpi.code}</td>
                  <td className="py-2.5 px-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        kpi.category === 'operativo'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                          : kpi.category === 'logistica'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {kpi.categoryLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 font-semibold text-white">{kpi.name}</td>
                  <td className="py-2.5 px-2.5 font-mono text-slate-300">{kpi.formulaOrBase}</td>
                  <td
                    className={`py-2.5 px-2.5 font-mono font-semibold ${
                      layoutMode === 'as-is' ? 'bg-rose-950/30 text-rose-300' : 'text-slate-300'
                    }`}
                  >
                    {kpi.asIsValue}
                  </td>
                  <td
                    className={`py-2.5 px-2.5 font-mono font-bold ${
                      layoutMode === 'to-be' ? 'bg-emerald-950/30 text-emerald-300' : 'text-emerald-400'
                    }`}
                  >
                    {kpi.toBeTarget}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="font-semibold text-amber-300">{kpi.deltaLabel}</span>
                      <span className="text-slate-300">{activeProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          layoutMode === 'as-is' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${activeProgress}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
