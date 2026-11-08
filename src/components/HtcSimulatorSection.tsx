import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Filter, Pause, Play, Table2, Users } from 'lucide-react';
import {
  FIELD_OBSERVERS,
  HTC_STAGES,
  OPERATOR_PROFILES,
  OperatorKey,
  SECTORS,
} from '../data/afmData';
import {
  ALL_43_OBSERVATIONS,
  buildHtcCombinedSummary,
  GLOBAL_HTC_PONDERADO,
  GUSTAVO_HTC_ACTIVO,
  GUSTAVO_HTC_PONDERADO,
  GUSTAVO_PART1_STATS,
  IndividualObservation,
  ObserverGroupKey,
} from '../data/htcObservationsData';

interface HtcSimulatorSectionProps {
  selectedOp: OperatorKey;
  setSelectedOp: (op: OperatorKey) => void;
  selectedObserver: string;
  setSelectedObserver: (id: string) => void;
  activeStageIdx: number;
  setActiveStageIdx: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedSectorId: (id: string) => void;
  activeIndividualObs: IndividualObservation | null;
  setActiveIndividualObs: (obs: IndividualObservation | null) => void;
}

type TableTab = 'individual-43' | 'htc-combinada' | 'tabla-1-1';
type HtcScenarioMode = 'selected-obs' | 'gustavo-ponderado' | 'gustavo-activo' | 'global-ponderado';

export function HtcSimulatorSection({
  selectedOp,
  setSelectedOp,
  selectedObserver,
  setSelectedObserver,
  activeStageIdx,
  setActiveStageIdx,
  isPlaying,
  setIsPlaying,
  setSelectedSectorId,
  activeIndividualObs,
  setActiveIndividualObs,
}: HtcSimulatorSectionProps) {
  const [observerFilter, setObserverFilter] = useState<'all' | ObserverGroupKey>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [anomalyFilter, setAnomalyFilter] = useState<'all' | 'anomaly' | 'clean'>('all');
  const [activeTab, setActiveTab] = useState<TableTab>('individual-43');
  const [htcScenario, setHtcScenario] = useState<HtcScenarioMode>('selected-obs');

  const filteredObservations = useMemo(() => {
    return ALL_43_OBSERVATIONS.filter((obs) => {
      if (observerFilter !== 'all' && obs.observerKey !== observerFilter) return false;
      if (operatorFilter !== 'all' && obs.operatorObserved !== operatorFilter) return false;
      if (anomalyFilter === 'anomaly' && !obs.hasAnomaly) return false;
      if (anomalyFilter === 'clean' && obs.hasAnomaly) return false;
      return true;
    });
  }, [observerFilter, operatorFilter, anomalyFilter]);

  const currentObs = activeIndividualObs ?? ALL_43_OBSERVATIONS[0];
  const currentObsHtc = useMemo(() => buildHtcCombinedSummary(currentObs.stages), [currentObs]);

  const displayedHtcSummary = useMemo(() => {
    if (htcScenario === 'gustavo-ponderado') return GUSTAVO_HTC_PONDERADO;
    if (htcScenario === 'gustavo-activo') return GUSTAVO_HTC_ACTIVO;
    if (htcScenario === 'global-ponderado') return GLOBAL_HTC_PONDERADO;
    return currentObsHtc;
  }, [htcScenario, currentObsHtc]);

  const handleSelectObservation = (obs: IndividualObservation) => {
    setActiveIndividualObs(obs);
    setSelectedSectorId(obs.targetSectorId);
    const matchingFieldObs = FIELD_OBSERVERS.find(
      (f) => f.name.toLowerCase() === obs.operatorObserved.toLowerCase()
    );
    if (matchingFieldObs) {
      setSelectedObserver(matchingFieldObs.id);
    }
  };

  const handleStepObs = (delta: number) => {
    const list = filteredObservations.length > 0 ? filteredObservations : ALL_43_OBSERVATIONS;
    const idx = list.findIndex((o) => o.globalId === currentObs.globalId);
    const nextIdx = idx === -1 ? 0 : (idx + delta + list.length) % list.length;
    handleSelectObservation(list[nextIdx]);
  };

  const currentOpProfile = OPERATOR_PROFILES[selectedOp];
  const activeFieldObserver = FIELD_OBSERVERS.find((o) => o.id === selectedObserver) ?? FIELD_OBSERVERS[0];
  const targetSectorObj = SECTORS.find((s) => s.id === currentObs.targetSectorId);

  return (
    <section id="htc-section" className="scroll-mt-20 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header & Simulation Playback Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>02. Simulador Individual de las 43 Mediciones y Hoja de Trabajo Combinado (HTC · 15.479 s / 258,0 min)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Muestra completa: Gustavo Leschenko (n = 13 · 4.931 s), Ana (n = 14 · 5.927 s) y Melina (n = 16 · 4.621 s) · Ciclo Global Ponderado: 360,0 s (6,00 min).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pausar Etapa' : 'Animar Etapas E1-E8'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeIndividualObs) {
                setActiveIndividualObs(null);
              } else {
                handleSelectObservation(ALL_43_OBSERVATIONS[0]);
              }
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              activeIndividualObs
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {activeIndividualObs
              ? `Modo Individual Activo: Obs #${activeIndividualObs.globalId}/43`
              : 'Modo Consolidado (Activar Individual)'}
          </button>

          {HTC_STAGES.map((st, idx) => {
            const stageVal = activeIndividualObs ? activeIndividualObs.stages[idx] : st.globalSec;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStageIdx(idx);
                  setSelectedSectorId(
                    activeIndividualObs && idx >= 2 && idx <= 4
                      ? activeIndividualObs.targetSectorId
                      : st.sectorId
                  );
                }}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer ${
                  activeStageIdx === idx
                    ? 'bg-emerald-600 text-white'
                    : stageVal === 0
                    ? 'bg-slate-950 text-slate-500 border border-slate-800'
                    : 'bg-slate-800 text-slate-200 hover:text-white'
                }`}
                title={`${st.code}: ${stageVal} s`}
              >
                {st.code} ({stageVal}s)
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 43 Measurements Selector & Live Telemetry Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left 7 Cols: Filter + 43 Pill Selector */}
        <div className="xl:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>Selector de las 43 Mediciones Individuales Cronometradas:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStepObs(-1)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer"
                aria-label="Medición anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-sky-400 font-bold px-1.5">
                Obs #{currentObs.globalId} de 43
              </span>
              <button
                type="button"
                onClick={() => handleStepObs(1)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer"
                aria-label="Siguiente medición"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Strip by Observer & Operator */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {[
              { id: 'all' as const, label: 'Todos (n=43 · 15.479 s)' },
              { id: 'gustavo' as const, label: 'Gustavo Leschenko (n=13 · 4.931 s)' },
              { id: 'ana' as const, label: 'Ana (n=14 · 5.927 s)' },
              { id: 'melina' as const, label: 'Melina (n=16 · 4.621 s)' },
            ].map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setObserverFilter(grp.id)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  observerFilter === grp.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {grp.label}
              </button>
            ))}

            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              aria-label="Filtrar por operario observado"
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
            >
              <option value="all">Operario: Todos (7)</option>
              <option value="Nico">Nico</option>
              <option value="Agustina">Agustina</option>
              <option value="Mostrador">Mostrador</option>
              <option value="Franco">Franco</option>
              <option value="Gervin">Gervin</option>
              <option value="Facundo">Facundo</option>
              <option value="Lautaro">Lautaro</option>
            </select>

            <select
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value as 'all' | 'anomaly' | 'clean')}
              aria-label="Filtrar por anomalía"
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
            >
              <option value="all">Estado: Todas (43)</option>
              <option value="anomaly">Con Anomalía D1-D7 (25)</option>
              <option value="clean">Sin Falla / Fluidas (18)</option>
            </select>
          </div>

          {/* 43 Observation Number Buttons */}
          <div className="grid grid-cols-9 sm:grid-cols-11 md:grid-cols-15 gap-1.5 pt-1">
            {filteredObservations.map((obs) => {
              const isSelected = currentObs.globalId === obs.globalId && activeIndividualObs !== null;
              return (
                <button
                  key={obs.globalId}
                  type="button"
                  onClick={() => handleSelectObservation(obs)}
                  title={`Obs #${obs.globalId} (${obs.observerName} #${obs.localObsNum}) · ${obs.operatorObserved} · ${obs.productFamily} · Total: ${obs.totalSec} s (${obs.anomalyCode})`}
                  className={`py-1.5 px-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-500 text-white border-white shadow-sm'
                      : obs.hasAnomaly
                      ? 'bg-rose-950/50 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                      : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
                  }`}
                >
                  #{obs.globalId}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-900 border border-rose-500 inline-block" />
                <span>Con Anomalía D1–D7 (25/43 = 58,1%)</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900 border border-emerald-500 inline-block" />
                <span>Flujo Limpio (18/43 = 41,9%)</span>
              </span>
            </div>
            <span className="font-mono text-slate-300">
              Mostrando {filteredObservations.length} de 43 mediciones
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Active Observation Detailed Telemetry Card */}
        <div className="xl:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                  MEDICIÓN #{currentObs.globalId} DE 43 · {currentObs.observerName.toUpperCase()} (OBS. #{currentObs.localObsNum})
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Operario: {currentObs.operatorObserved} · {currentObs.productFamily}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold shrink-0 ${
                  currentObs.hasAnomaly
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                {currentObs.hasAnomaly ? `Falla: ${currentObs.anomalyCode}` : 'Sin Anomalía'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 font-sans">Ciclo Pedido</div>
                <div className="text-sm font-bold text-white">
                  {currentObs.totalSec} s ({currentObs.totalMin.toFixed(2).replace('.', ',')} m)
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 font-sans">Muda Física (E2+E3+E4+E6)</div>
                <div className="text-sm font-bold text-rose-400">
                  {currentObsHtc.mudaTotalSec} s ({currentObsHtc.mudaPct.toFixed(1).replace('.', ',')}%)
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 font-sans">Sector Destino</div>
                <div className="text-xs font-bold text-amber-300 truncate">
                  {targetSectorObj ? targetSectorObj.name.split('(')[0].trim() : 'Mostrador'}
                </div>
              </div>
            </div>

            {/* 8-Stage Timeline Strip for Selected Observation */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Desglose E1–E8 de la Medición #{currentObs.globalId}:</span>
                <span className="font-mono text-slate-300">
                  VA Manual: {currentObsHtc.manualVaTotal}s · Auto PC: {currentObsHtc.autoTotal}s
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1 text-center font-mono text-[11px]">
                {currentObs.stages.map((sec, idx) => {
                  const st = HTC_STAGES[idx];
                  const isAct = activeStageIdx === idx;
                  return (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStageIdx(idx);
                        handleSelectObservation(currentObs);
                      }}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        isAct
                          ? 'bg-sky-600 text-white border-sky-400'
                          : sec === 0
                          ? 'bg-slate-900/40 text-slate-500 border-slate-800/70'
                          : st.type === 'Muda'
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                          : 'bg-slate-900 text-slate-200 border-slate-800'
                      }`}
                    >
                      <div className="font-bold">{st.code}</div>
                      <div className="text-[10px]">{sec}s</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>
              Equipo TB4: <strong className="text-slate-200">{activeFieldObserver.name}</strong> ({activeFieldObserver.role})
            </span>
            <span className="font-mono text-emerald-400">
              {currentOpProfile.label}: {currentOpProfile.weightedCycleSec.toFixed(1).replace('.', ',')} s
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for the 3 Official HTC & Diagnostic Tables */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('individual-43')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'individual-43'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>1. Matriz de las 43 Mediciones Individuales (Gustavo n=13, Ana n=14, Melina n=16)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('htc-combinada')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'htc-combinada'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. Hoja de Trabajo Combinado (HTC Dinámica · Escenario Ponderado vs. Activo)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tabla-1-1')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'tabla-1-1'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Tabla 1.1 Comparativa por Observador y Consolidado (n = 43 · 15.479 s)</span>
          </button>
        </div>

        {/* Quick Operator Stratum Switch */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(OPERATOR_PROFILES) as OperatorKey[]).map((opKey) => (
            <button
              key={opKey}
              type="button"
              onClick={() => setSelectedOp(opKey)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                selectedOp === opKey
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {OPERATOR_PROFILES[opKey].label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: MATRIZ INDIVIDUAL DE LAS 43 MEDICIONES CRONOMETRADAS */}
      {activeTab === 'individual-43' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[420px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-950 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-2.5 font-semibold">Obs #</th>
                  <th className="py-2.5 px-2.5 font-semibold">Relevador (Obs. Local)</th>
                  <th className="py-2.5 px-2.5 font-semibold">Operario</th>
                  <th className="py-2.5 px-2.5 font-semibold">Familia / Motivo</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E1</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E2</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E3</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E4</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E5</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E6</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E7</th>
                  <th className="py-2.5 px-2 font-semibold text-right">E8</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">Total (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">Total (min)</th>
                  <th className="py-2.5 px-2.5 font-semibold">Anomalía (D1–D9)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredObservations.map((obs) => {
                  const isCurrent = currentObs.globalId === obs.globalId;
                  return (
                    <tr
                      key={obs.globalId}
                      onClick={() => handleSelectObservation(obs)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-sky-950/70 text-white'
                          : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-200'
                      }`}
                    >
                      <td className="py-2 px-2.5 font-bold text-sky-400">#{obs.globalId}</td>
                      <td className="py-2 px-2.5 font-sans">
                        {obs.observerName} <span className="text-slate-400 font-mono">(Obs {obs.localObsNum})</span>
                      </td>
                      <td className="py-2 px-2.5 font-sans font-semibold text-white">{obs.operatorObserved}</td>
                      <td className="py-2 px-2.5 font-sans text-slate-300">{obs.productFamily}</td>
                      {obs.stages.map((val, sIdx) => (
                        <td
                          key={sIdx}
                          className={`py-2 px-2 text-right ${
                            val === 0
                              ? 'text-slate-600'
                              : sIdx === 3 && val >= 60
                              ? 'text-rose-400 font-bold'
                              : sIdx === 4 && val >= 120
                              ? 'text-amber-300 font-bold'
                              : sIdx === 7 && val >= 140
                              ? 'text-rose-300 font-bold'
                              : 'text-slate-200'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                      <td className="py-2 px-2.5 text-right font-bold text-white">{obs.totalSec} s</td>
                      <td className="py-2 px-2.5 text-right text-slate-300">
                        {obs.totalMin.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            obs.hasAnomaly
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : 'text-emerald-400'
                          }`}
                        >
                          {obs.anomalyCode}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Parte 1 Gustavo Leschenko Summary Bar (Min Active, Max, Weighted Avg, Active Avg >0) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">
                Estadísticos Oficiales Parte 1 — Relevamiento Gustavo Leschenko (13 Observaciones · Mín. Activo, Máximo, Prom. Ponderado y Prom. Activo &gt; 0):
              </span>
              <span className="text-xs font-mono text-amber-300">
                8/10 ventas efectivas c/ anomalía (D2=6, D4=4, D3=2, D5=2, D1=1) · Ciclo Máx: 992,0 s (16,53 min)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-[11px]">
              {GUSTAVO_PART1_STATS.map((st) => (
                <div key={st.code} className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                  <div className="font-bold text-sky-400">{st.code}</div>
                  <div className="text-slate-300">Pond: {st.weightedAvg.toFixed(1).replace('.', ',')}s</div>
                  <div className="text-emerald-400">Act(&gt;0): {st.activeAvg.toFixed(1).replace('.', ',')}s</div>
                  <div className="text-[10px] text-slate-400">
                    Mín {st.minActive}s · Máx {st.max}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOJA DE TRABAJO COMBINADO (HTC DINÁMICA) */}
      {activeTab === 'htc-combinada' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-200">
              Seleccionar Escenario de Hoja de Trabajo Combinado (HTC):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  id: 'selected-obs' as const,
                  label: `Medición Seleccionada: Obs #${currentObs.globalId} (${currentObs.totalSec} s)`,
                },
                {
                  id: 'gustavo-ponderado' as const,
                  label: 'Gustavo Escenario 1: Prom. Ponderado (379,3 s / 6,32 min · 42,9% Muda)',
                },
                {
                  id: 'gustavo-activo' as const,
                  label: 'Gustavo Escenario 2: Activo con Fricción >0 (670,2 s / 11,17 min · 46,2% Muda)',
                },
                {
                  id: 'global-ponderado' as const,
                  label: 'Consolidado Global Ponderado n=43 (360,0 s / 6,00 min · 35,3% Muda)',
                },
              ].map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setHtcScenario(sc.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    htcScenario === sc.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="py-2.5 px-2.5 font-semibold">N.º Op.</th>
                  <th className="py-2.5 px-2.5 font-semibold">Cód.</th>
                  <th className="py-2.5 px-2.5 font-semibold">Descripción de la Operación (Elemento Logístico)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right text-emerald-400">MANUAL: VA (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right text-sky-400">AUTO: Sistema (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right text-rose-400">ESPERA: Muda (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right text-amber-400">DESPLAZ.: Caminata (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">TOTAL (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">Inicio (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">Fin (s)</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">% Ciclo</th>
                  <th className="py-2.5 px-2.5 font-semibold w-44">Escala Acumulada HTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {displayedHtcSummary.rows.map((row, idx) => {
                  const total = Math.max(1, displayedHtcSummary.totalCycleSec);
                  const leftPct = (row.startScaleSec / total) * 100;
                  const widthPct = Math.max(1.5, (row.totalSec / total) * 100);
                  return (
                    <tr
                      key={row.code}
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStageIdx(idx);
                      }}
                      className={`cursor-pointer transition-colors ${
                        activeStageIdx === idx
                          ? 'bg-sky-950/60 text-white'
                          : 'bg-slate-900/60 hover:bg-slate-800/50 text-slate-200'
                      }`}
                    >
                      <td className="py-2 px-2.5">{row.opNum}</td>
                      <td className="py-2 px-2.5 font-bold text-sky-400">{row.code}</td>
                      <td className="py-2 px-2.5 font-sans">{row.description}</td>
                      <td className="py-2 px-2.5 text-right text-emerald-400">
                        {row.manualVaSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right text-sky-400">
                        {row.autoSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right text-rose-400">
                        {row.waitMudaSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right text-amber-400">
                        {row.walkMudaSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-white">
                        {row.totalSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-400">
                        {row.startScaleSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-300">
                        {row.endScaleSec.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="py-2 px-2.5 text-right">{row.pctOfCycle.toFixed(1).replace('.', ',')}%</td>
                      <td className="py-2 px-2.5">
                        <div className="w-full bg-slate-950 h-2.5 rounded-full relative overflow-hidden border border-slate-800">
                          {row.totalSec > 0 && (
                            <div
                              className={`h-full rounded-full absolute top-0 ${
                                row.waitMudaSec > 0
                                  ? 'bg-rose-500'
                                  : row.walkMudaSec > 0
                                  ? 'bg-amber-500'
                                  : row.autoSec > 0
                                  ? 'bg-sky-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-950 border-t-2 border-slate-700 font-mono text-white font-bold">
                  <td colSpan={3} className="py-2.5 px-2.5 font-sans">
                    TOTALES HOJA DE TRABAJO COMBINADO (Segundos / Minutos)
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-emerald-400">
                    {displayedHtcSummary.manualVaTotal.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-sky-400">
                    {displayedHtcSummary.autoTotal.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-rose-400">
                    {displayedHtcSummary.waitMudaTotal.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-amber-400">
                    {displayedHtcSummary.walkMudaTotal.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-2.5 text-right">
                    {displayedHtcSummary.totalCycleSec.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-slate-400">0,0 s</td>
                  <td className="py-2.5 px-2.5 text-right">
                    {displayedHtcSummary.totalCycleMin.toFixed(2).replace('.', ',')} min
                  </td>
                  <td className="py-2.5 px-2.5 text-right">100,0%</td>
                  <td className="py-2.5 px-2.5 font-sans text-rose-400">
                    Muda (Espera+Caminata): {displayedHtcSummary.mudaPct.toFixed(1).replace('.', ',')}% (
                    {displayedHtcSummary.mudaTotalSec.toFixed(1).replace('.', ',')} s)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TABLA 1.1 COMPARATIVA POR OBSERVADOR Y CONSOLIDADO GLOBAL PONDERADO (n = 43) */}
      {activeTab === 'tabla-1-1' && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                <th className="py-3 px-3 font-semibold">Etapa</th>
                <th className="py-3 px-3 font-semibold">Descripción de la Operación (Tabla 1.1)</th>
                <th className="py-3 px-3 font-semibold">Categoría HTC / Lean</th>
                <th className="py-3 px-3 font-semibold text-right">Gustavo (n=13)</th>
                <th className="py-3 px-3 font-semibold text-right">Ana (n=14)</th>
                <th className="py-3 px-3 font-semibold text-right">Melina (n=16)</th>
                <th className="py-3 px-3 font-semibold text-right text-sky-400">Global (n=43)</th>
                <th className="py-3 px-3 font-semibold text-right">% Ciclo Global</th>
                <th className="py-3 px-3 font-semibold text-right text-emerald-400">Meta To-Be (H4)</th>
                <th className="py-3 px-3 font-semibold">Picos Máximos Registrados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {HTC_STAGES.map((st, idx) => (
                <tr
                  key={st.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStageIdx(idx);
                    setSelectedSectorId(st.sectorId);
                  }}
                  className={`cursor-pointer transition-colors ${
                    idx === activeStageIdx
                      ? 'bg-sky-950/60 text-white'
                      : 'bg-slate-900/60 hover:bg-slate-800/50 text-slate-200'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-sky-400">{st.code}</td>
                  <td className="py-2.5 px-3 font-sans font-medium">{st.name}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={
                        st.type === 'Muda'
                          ? 'text-rose-400 font-semibold'
                          : st.type === 'Manual VA'
                          ? 'text-emerald-400 font-semibold'
                          : 'text-amber-300'
                      }
                    >
                      {idx === 0
                        ? 'MANUAL (NNVA / VA)'
                        : idx === 1 || idx === 5
                        ? 'DESPLAZ. (Caminata)'
                        : idx === 2 || idx === 3
                        ? 'ESPERA (Muda)'
                        : idx === 4 || idx === 6
                        ? 'MANUAL (VA Puro)'
                        : 'AUTO (Sistema)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">{st.gustavoSec.toFixed(1).replace('.', ',')} s</td>
                  <td className="py-2.5 px-3 text-right">{st.anaSec.toFixed(1).replace('.', ',')} s</td>
                  <td className="py-2.5 px-3 text-right">{st.melinaSec.toFixed(1).replace('.', ',')} s</td>
                  <td className="py-2.5 px-3 text-right font-bold text-sky-300">
                    {st.globalSec.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-3 text-right">{st.globalPct.toFixed(1).replace('.', ',')}%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {st.toBeSec.toFixed(1).replace('.', ',')} s
                  </td>
                  <td className="py-2.5 px-3 font-sans text-amber-300">{st.peakNote ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700 font-mono text-white font-bold">
                <td colSpan={3} className="py-3 px-3 font-sans">
                  TIEMPO DE CICLO TOTAL (n = 43 · Total Operación: 15.479 s / 258,0 min)
                </td>
                <td className="py-3 px-3 text-right">379,3 s (6,32 min)</td>
                <td className="py-3 px-3 text-right">423,4 s (7,06 min)</td>
                <td className="py-3 px-3 text-right">288,8 s (4,81 min)</td>
                <td className="py-3 px-3 text-right text-sky-400">360,0 s (6,00 min)</td>
                <td className="py-3 px-3 text-right text-rose-400">35,3% Muda (127,2 s)</td>
                <td className="py-3 px-3 text-right text-emerald-400">≤ 216,0 s (3,60 min)</td>
                <td className="py-3 px-3 font-sans text-emerald-300">
                  Umbral exacto: 6,00 min → Meta To-Be: -40% ciclo (E4 = 0,0 s)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
