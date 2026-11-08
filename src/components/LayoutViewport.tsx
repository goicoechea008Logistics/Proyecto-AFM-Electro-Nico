import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, DoorOpen, Eye, Layers, RotateCcw, Users, ZoomIn, ZoomOut } from 'lucide-react';
import {
  FIELD_OBSERVERS,
  getOperatorColor,
  HTC_STAGES,
  LAYOUT_OPENINGS,
  LayoutMode,
  OPERATOR_COLORS,
  OperatorKey,
  PARETO_BOTTLENECKS,
  projectIso3D,
  SECTORS,
  SHELF_UNITS,
  ShelfUnit,
  ViewDimension,
} from '../data/afmData';
import {
  buildFullCycleCorridorWaypoints,
  CORRIDOR_NODES,
  CorridorWaypoint,
  findCorridorPath,
  getCorrelativeTrioObservations,
  getStageTargetNodeId,
  interpolateAlongWaypoints,
} from '../data/corridorPathfinding';
import { ALL_43_OBSERVATIONS, IndividualObservation } from '../data/htcObservationsData';

export const FAMILY_COLORS: Record<string, { fill: string; top: string; side: string; label: string }> = {
  diors: { fill: '#0284c7', top: '#38bdf8', side: '#0369a1', label: 'Cables Bobina / Diors' },
  sirio: { fill: '#d97706', top: '#fbbf24', side: '#b45309', label: 'Iluminación LED / Luminarias' },
  gaveteros: { fill: '#0d9488', top: '#2dd4bf', side: '#0f766e', label: 'Tornillería / Módulos / Eléctrica' },
  canos: { fill: '#6366f1', top: '#818cf8', side: '#4f46e5', label: 'Caños PVC / Galv. y Conectores' },
  obsoleto: { fill: '#e11d48', top: '#fb7185', side: '#be123c', label: 'Obsoleto 15-20% / Bobinas en Piso' },
  mostrador: { fill: '#475569', top: '#94a3b8', side: '#334155', label: 'Mostrador y Computadora (PC)' },
};

const SLOT_PIXEL_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: 0 },
  { dx: 12, dy: -12 },
  { dx: -12, dy: 12 },
];

interface LayoutViewportProps {
  layoutMode: LayoutMode;
  viewDim: ViewDimension;
  setViewDim: (v: ViewDimension) => void;
  selectedOp: OperatorKey;
  selectedObserver: string;
  activeStageIdx: number;
  activeIndividualObs?: IndividualObservation | null;
  setActiveIndividualObs?: (obs: IndividualObservation | null) => void;
  showHeatmap: boolean;
  setShowHeatmap: React.Dispatch<React.SetStateAction<boolean>>;
  showSpaghetti: boolean;
  setShowSpaghetti: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSectorId: string;
  setSelectedSectorId: (id: string) => void;
  selectedBottleneckRank: number | null;
  setSelectedBottleneckRank: (rank: number | null) => void;
  isoAngle: number;
  setIsoAngle: (angle: number) => void;
  isoZoom: number;
  setIsoZoom: React.Dispatch<React.SetStateAction<number>>;
}

export function LayoutViewport({
  layoutMode,
  viewDim,
  setViewDim,
  selectedObserver,
  activeStageIdx,
  activeIndividualObs = null,
  setActiveIndividualObs,
  showHeatmap,
  setShowHeatmap,
  showSpaghetti,
  setShowSpaghetti,
  selectedSectorId,
  setSelectedSectorId,
  selectedBottleneckRank,
  setSelectedBottleneckRank,
  isoAngle,
  setIsoAngle,
  isoZoom,
  setIsoZoom,
}: LayoutViewportProps) {
  const [selectedShelf, setSelectedShelf] = useState<ShelfUnit>(
    SHELF_UNITS.find((s) => s.id === 's3-G') ?? SHELF_UNITS[16]
  );
  const [showCadBlueprint, setShowCadBlueprint] = useState<boolean>(false);
  const [showOpenings, setShowOpenings] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ dragging: boolean; startX: number; startAngle: number }>({
    dragging: false,
    startX: 0,
    startAngle: 28,
  });

  // 3 observaciones correlativas simultáneas (#k, #k+1, #k+2 de las 43 mediciones)
  const trioObservations = getCorrelativeTrioObservations(activeIndividualObs);

  // Nodos actuales de los 3 operarios simultáneos para nunca saltar muros ni aberturas
  const currentNodeIdsRef = useRef<[string, string, string]>(['N_MOST_E1', 'N_MOST_E1', 'N_MOST_E1']);
  const [activeWalkPaths, setActiveWalkPaths] = useState<[CorridorWaypoint[], CorridorWaypoint[], CorridorWaypoint[]]>([
    [CORRIDOR_NODES.N_MOST_E1],
    [CORRIDOR_NODES.N_MOST_E1],
    [CORRIDOR_NODES.N_MOST_E1],
  ]);
  const [walkProgress, setWalkProgress] = useState<number>(1);

  const activeStage = HTC_STAGES[activeStageIdx];
  const activeSector = SECTORS.find((s) => s.id === selectedSectorId) ?? SECTORS[2];
  const activeObserver = FIELD_OBSERVERS.find((o) => o.id === selectedObserver) ?? FIELD_OBSERVERS[0];
  const sectorShelves = SHELF_UNITS.filter((sh) => sh.sectorId === selectedSectorId);

  const stepCorrelativeObs = (delta: number) => {
    if (!setActiveIndividualObs) return;
    const baseIdx = activeIndividualObs ? Math.max(0, activeIndividualObs.globalId - 1) : 0;
    const nextIdx = (baseIdx + delta + ALL_43_OBSERVATIONS.length) % ALL_43_OBSERVATIONS.length;
    setActiveIndividualObs(ALL_43_OBSERVATIONS[nextIdx]);
  };

  // Calcula y anima suavemente el traslado de los 3 operarios correlativos en simultáneo por pasillos y aberturas
  useEffect(() => {
    const obs0 = trioObservations[0];
    const obs1 = trioObservations[1];
    const obs2 = trioObservations[2];
    const trio: [IndividualObservation, IndividualObservation, IndividualObservation] = [obs0, obs1, obs2];

    const nextPaths: [CorridorWaypoint[], CorridorWaypoint[], CorridorWaypoint[]] = [
      [CORRIDOR_NODES.N_MOST_E1],
      [CORRIDOR_NODES.N_MOST_E1],
      [CORRIDOR_NODES.N_MOST_E1],
    ];

    let maxDist = 0;
    for (let slot = 0; slot < 3; slot++) {
      const slotStageIdx = (activeStageIdx + slot * 2) % HTC_STAGES.length;
      const targetNodeId = getStageTargetNodeId(slotStageIdx, layoutMode, trio[slot]);
      const startNodeId = currentNodeIdsRef.current[slot] || 'N_MOST_E1';
      const path = findCorridorPath(startNodeId, targetNodeId);
      currentNodeIdsRef.current[slot] = targetNodeId;
      nextPaths[slot] = path;

      let dist = 0;
      for (let i = 0; i < path.length - 1; i++) {
        dist += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
      }
      if (dist > maxDist) maxDist = dist;
    }

    setActiveWalkPaths(nextPaths);

    if (maxDist <= 1) {
      setWalkProgress(1);
      return;
    }

    const durationMs = Math.min(1450, Math.max(450, maxDist * 3.2));
    const startTime = performance.now();
    let rafId = 0;

    setWalkProgress(0);
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setWalkProgress(eased);
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeStageIdx, layoutMode, trioObservations[0].globalId, trioObservations[1].globalId, trioObservations[2].globalId]);

  // Estado instantáneo de los 3 operarios correlativos en simultáneo
  const simultaneousOperators = ([0, 1, 2] as const).map((slot) => {
    const obs = trioObservations[slot];
    const slotStageIdx = (activeStageIdx + slot * 2) % HTC_STAGES.length;
    const slotStage = HTC_STAGES[slotStageIdx];
    const walkPath = activeWalkPaths[slot];
    const interp = interpolateAlongWaypoints(walkPath, walkProgress);
    const offset = SLOT_PIXEL_OFFSETS[slot];
    const opColor = getOperatorColor(obs.operatorObserved);
    const stageSec = obs.stages[slotStageIdx];
    const coords = { x: Math.round(interp.x + offset.dx), y: Math.round(interp.y + offset.dy) };
    const label = `#${obs.globalId} ${obs.operatorObserved} · ${slotStage.code}: ${stageSec}s`;
    const fullCycleWaypoints = buildFullCycleCorridorWaypoints(layoutMode, obs);
    return {
      slot,
      obs,
      slotStageIdx,
      slotStage,
      walkPath,
      interp,
      opColor,
      stageSec,
      coords,
      label,
      fullCycleWaypoints,
    };
  });

  const primaryOp = simultaneousOperators[0];

  useEffect(() => {
    if (viewDim !== '3d' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerX = width * 0.49;
    const centerY = height * 0.46;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090f1d';
    ctx.fillRect(0, 0, width, height);

    // Reference Floor Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
    ctx.lineWidth = 1;
    for (let gx = 40; gx <= 920; gx += 60) {
      const p1 = projectIso3D(gx, 40, 0, isoAngle, isoZoom, centerX, centerY);
      const p2 = projectIso3D(gx, 560, 0, isoAngle, isoZoom, centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
    }
    for (let gy = 40; gy <= 560; gy += 60) {
      const p1 = projectIso3D(40, gy, 0, isoAngle, isoZoom, centerX, centerY);
      const p2 = projectIso3D(920, gy, 0, isoAngle, isoZoom, centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
    }

    // Draw Sectors 1 to 7 Floor Plates (Sectors 3 and 4 share identical width w=230 / h=220)
    SECTORS.forEach((sec) => {
      const z0 = sec.zBase ?? 0;
      const pts = sec.polygon
        ? sec.polygon.split(' ').map((pair) => {
            const [px, py] = pair.split(',').map(Number);
            return projectIso3D(px, py, z0, isoAngle, isoZoom, centerX, centerY);
          })
        : [
            projectIso3D(sec.x, sec.y, z0, isoAngle, isoZoom, centerX, centerY),
            projectIso3D(sec.x + sec.w, sec.y, z0, isoAngle, isoZoom, centerX, centerY),
            projectIso3D(sec.x + sec.w, sec.y + sec.h, z0, isoAngle, isoZoom, centerX, centerY),
            projectIso3D(sec.x, sec.y + sec.h, z0, isoAngle, isoZoom, centerX, centerY),
          ];

      const baseColor = layoutMode === 'as-is' ? sec.colorAsIs : sec.colorToBe;
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      pts.slice(1).forEach((p) => ctx.lineTo(p.sx, p.sy));
      ctx.closePath();
      ctx.fillStyle = showHeatmap ? `${baseColor}26` : 'rgba(30, 41, 59, 0.6)';
      ctx.fill();
      ctx.strokeStyle = sec.id === selectedSectorId ? '#38bdf8' : `${baseColor}99`;
      ctx.lineWidth = sec.id === selectedSectorId ? 2.4 : 1.2;
      ctx.stroke();

      const lblX = sec.badgeX ?? sec.x + sec.w / 2;
      const lblY = sec.badgeY ? sec.badgeY + 28 : sec.y + sec.h - 14;
      const lp = projectIso3D(lblX, lblY, z0 + 2, isoAngle, isoZoom, centerX, centerY);
      ctx.fillStyle = sec.id === selectedSectorId ? '#38bdf8' : '#cbd5e1';
      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Sector ${sec.refNum}`, lp.sx, lp.sy);
    });

    // Floor-only Legends for Show Room and Vidriera (no 3D blocks)
    const showRoomFloor = projectIso3D(135, 175, 2, isoAngle, isoZoom, centerX, centerY);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Show Room Luminarias', showRoomFloor.sx, showRoomFloor.sy);

    const vidrieraFloor = projectIso3D(78, 475, 2, isoAngle, isoZoom, centerX, centerY);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vidriera', vidrieraFloor.sx, vidrieraFloor.sy);

    // Draw Architectural Openings (Aberturas A1-A9) in 3D Floor
    if (showOpenings) {
      LAYOUT_OPENINGS.forEach((op) => {
        const p1 = projectIso3D(op.x1, op.y1, 2, isoAngle, isoZoom, centerX, centerY);
        const p2 = projectIso3D(op.x2, op.y2, 2, isoAngle, isoZoom, centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
    }

    // Draw 3D Escalera directly in front of Estantería G in Sector 3 (x=534, y=339, w=28, d=48)
    const stairSteps = 6;
    for (let s = 0; s < stairSteps; s++) {
      const sy0 = 339 + (s * 48) / stairSteps;
      const sy1 = 339 + ((s + 1) * 48) / stairSteps;
      const sz = (stairSteps - s) * 3.8;
      const sp = [
        projectIso3D(534, sy0, sz, isoAngle, isoZoom, centerX, centerY),
        projectIso3D(562, sy0, sz, isoAngle, isoZoom, centerX, centerY),
        projectIso3D(562, sy1, sz, isoAngle, isoZoom, centerX, centerY),
        projectIso3D(534, sy1, sz, isoAngle, isoZoom, centerX, centerY),
      ];
      ctx.beginPath();
      ctx.moveTo(sp[0].sx, sp[0].sy);
      sp.slice(1).forEach((p) => ctx.lineTo(p.sx, p.sy));
      ctx.closePath();
      ctx.fillStyle = '#d97706';
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    const stairLbl = projectIso3D(548, 363, 26, isoAngle, isoZoom, centerX, centerY);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Escalera (frente a G)', stairLbl.sx, stairLbl.sy);

    // Sort Shelves by Painter's Algorithm
    const visibleShelves = SHELF_UNITS.filter((sh) => !(layoutMode === 'to-be' && sh.asIsOnly));
    const sortedShelves = [...visibleShelves].sort((a, b) => {
      const pa = projectIso3D(a.x + a.w / 2, a.y + a.d / 2, a.zBase ?? 0, isoAngle, isoZoom, centerX, centerY);
      const pb = projectIso3D(b.x + b.w / 2, b.y + b.d / 2, b.zBase ?? 0, isoAngle, isoZoom, centerX, centerY);
      return pa.sy - pb.sy;
    });

    sortedShelves.forEach((sh, sIdx) => {
      const fam = layoutMode === 'to-be' && sh.toBeFamily ? sh.toBeFamily : sh.family;
      const palette = FAMILY_COLORS[fam] ?? FAMILY_COLORS.mostrador;
      const z0 = sh.zBase ?? 0;
      const z1 = z0 + sh.h * 0.62;
      const isSelected = selectedShelf.id === sh.id;
      const inSelectedSector = sh.sectorId === selectedSectorId;

      const cx = sh.x + sh.w / 2;
      const cy = sh.y + sh.d / 2;
      const rad = ((sh.angleDeg ?? 0) * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);
      const halfW = sh.w / 2;
      const halfD = sh.d / 2;
      const localCorners = [
        { dx: -halfW, dy: -halfD },
        { dx: halfW, dy: -halfD },
        { dx: halfW, dy: halfD },
        { dx: -halfW, dy: halfD },
      ];
      const worldCorners = localCorners.map(({ dx, dy }) => ({
        wx: cx + dx * cosA - dy * sinA,
        wy: cy + dx * sinA + dy * cosA,
      }));

      const b = worldCorners.map(({ wx, wy }) =>
        projectIso3D(wx, wy, z0, isoAngle, isoZoom, centerX, centerY)
      );
      const t = worldCorners.map(({ wx, wy }) =>
        projectIso3D(wx, wy, z1, isoAngle, isoZoom, centerX, centerY)
      );
      const faces = [
        { pts: [b[0], b[1], t[1], t[0]], color: palette.side },
        { pts: [b[1], b[2], t[2], t[1]], color: palette.fill },
        { pts: [b[2], b[3], t[3], t[2]], color: palette.fill },
        { pts: [b[3], b[0], t[0], t[3]], color: palette.side },
        { pts: t, color: palette.top },
      ];
      faces.forEach((face) => {
        ctx.beginPath();
        ctx.moveTo(face.pts[0].sx, face.pts[0].sy);
        face.pts.slice(1).forEach((p) => ctx.lineTo(p.sx, p.sy));
        ctx.closePath();
        ctx.fillStyle = face.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(15, 23, 42, 0.78)';
        ctx.lineWidth = isSelected ? 1.8 : 0.9;
        ctx.stroke();
      });

      const shortCode = sh.code.split(' ')[0] === 'Est.' ? sh.code.split(' ')[1] : sh.code.split(' ')[0];
      if (isSelected || (inSelectedSector && (sh.w >= 32 || sh.d >= 40))) {
        const tc = projectIso3D(sh.x + sh.w / 2, sh.y + sh.d / 2, z1 + 8 + (sIdx % 2) * 7, isoAngle, isoZoom, centerX, centerY);
        const tag = `${shortCode} (${sh.altoM.toFixed(2).replace('.', ',')}m)`;
        ctx.font = '600 9px "JetBrains Mono", monospace';
        const tw = ctx.measureText(tag).width;
        ctx.fillStyle = isSelected ? '#0284c7' : 'rgba(9, 15, 29, 0.88)';
        ctx.fillRect(tc.sx - tw / 2 - 3, tc.sy - 8, tw + 6, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(tag, tc.sx, tc.sy);
      } else {
        const topCenter = projectIso3D(sh.x + sh.w / 2, sh.y + sh.d / 2, z1 + 1, isoAngle, isoZoom, centerX, centerY);
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(shortCode, topCenter.sx, topCenter.sy + 2);
      }
    });

    // Draw Spaghetti Trajectories in 3D for the 3 simultaneous correlative operators
    if (showSpaghetti) {
      simultaneousOperators.forEach((opSim) => {
        if (opSim.fullCycleWaypoints.length <= 1) return;
        const off = SLOT_PIXEL_OFFSETS[opSim.slot];
        ctx.beginPath();
        opSim.fullCycleWaypoints.forEach((wp, idx) => {
          const z = (wp.sectorId === 'sec4' ? 32 : 10) + opSim.slot * 2;
          const proj = projectIso3D(wp.x + off.dx * 0.5, wp.y + off.dy * 0.5, z, isoAngle, isoZoom, centerX, centerY);
          if (idx === 0) ctx.moveTo(proj.sx, proj.sy);
          else ctx.lineTo(proj.sx, proj.sy);
        });
        ctx.strokeStyle = opSim.opColor.hex;
        ctx.lineWidth = opSim.slot === 0 ? 2.2 : 1.6;
        ctx.setLineDash(layoutMode === 'as-is' ? [6, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw Active Corridor Walk Segments & Beacons in 3D for all 3 Simultaneous Operators
    simultaneousOperators.forEach((opSim) => {
      const off = SLOT_PIXEL_OFFSETS[opSim.slot];
      if (opSim.walkPath.length > 1) {
        ctx.beginPath();
        opSim.walkPath.forEach((wp, idx) => {
          const z = (wp.sectorId === 'sec4' ? 34 : 13) + opSim.slot * 2;
          const proj = projectIso3D(wp.x + off.dx * 0.6, wp.y + off.dy * 0.6, z, isoAngle, isoZoom, centerX, centerY);
          if (idx === 0) ctx.moveTo(proj.sx, proj.sy);
          else ctx.lineTo(proj.sx, proj.sy);
        });
        ctx.strokeStyle = opSim.opColor.hex;
        ctx.lineWidth = 3.0;
        ctx.stroke();
      }

      const opZBase = opSim.interp.currentWaypoint.sectorId === 'sec4' ? 25 : 0;
      const pinHeight = 42 + opSim.slot * 11;
      const opBase = projectIso3D(opSim.coords.x, opSim.coords.y, opZBase, isoAngle, isoZoom, centerX, centerY);
      const opHead = projectIso3D(opSim.coords.x, opSim.coords.y, opZBase + pinHeight, isoAngle, isoZoom, centerX, centerY);

      ctx.beginPath();
      ctx.moveTo(opBase.sx, opBase.sy);
      ctx.lineTo(opHead.sx, opHead.sy);
      ctx.strokeStyle = opSim.opColor.hex;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(opHead.sx, opHead.sy, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = opSim.opColor.hex;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(opSim.label).width;
      ctx.fillStyle = opSim.opColor.badgeBg;
      ctx.fillRect(opHead.sx - tw / 2 - 4, opHead.sy - 21, tw + 8, 14);
      ctx.strokeStyle = opSim.opColor.badgeBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(opHead.sx - tw / 2 - 4, opHead.sy - 21, tw + 8, 14);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(opSim.label, opHead.sx, opHead.sy - 11);
    });
  }, [viewDim, layoutMode, isoAngle, isoZoom, showHeatmap, showSpaghetti, showOpenings, selectedSectorId, selectedShelf, activeStage, activeObserver, simultaneousOperators]);

  return (
    <section id="layout-section" className="scroll-mt-20 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>01. Plano Oficial de Electro NICO Dividido por Sector (3 Operarios Simultáneos Correlativos · n = 43)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sin abertura entre Sector 1 y Sector 7 (camino desde S1 y S2 hacia S7 vía A5 → A6 → A7), leyendas de piso en Show Room/Vidriera y 3 operarios simultáneos con color distintivo avanzando correlativamente de la medición #1 a la #43.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDim('2d')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewDim === '2d' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Vista 2D (Plano + Diagrama de Espagueti + Mapa de Calor)
          </button>
          <button
            type="button"
            onClick={() => setViewDim('3d')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewDim === '3d' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Vista 3D Isométrica Interactiva (con rotación y altura de estanterías)
          </button>
          <button
            type="button"
            onClick={() => setShowOpenings((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              showOpenings ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Aberturas CAD (8): {showOpenings ? 'Visibles' : 'Ocultas'}</span>
          </button>
          {viewDim === '2d' && (
            <button
              type="button"
              onClick={() => setShowCadBlueprint((b) => !b)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                showCadBlueprint ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showCadBlueprint ? 'Ocultar Calco CAD Original' : 'Ver Calco Plano CAD Original'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSpaghetti((s) => !s)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              showSpaghetti ? 'bg-slate-800 border-sky-500/60 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Espagueti: {showSpaghetti ? 'Visible' : 'Oculto'}
          </button>
          <button
            type="button"
            onClick={() => setShowHeatmap((h) => !h)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              showHeatmap ? 'bg-slate-800 border-amber-500/60 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Mapa de Calor: {showHeatmap ? 'Activo' : 'Inactivo'}
          </button>
        </div>
      </div>

      {/* Quick Sector Selector Buttons (Referencias 1 a 7) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Referencias Plano:</span>
          {SECTORS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setSelectedSectorId(sec.id);
                const firstShelf = SHELF_UNITS.find((sh) => sh.sectorId === sec.id);
                if (firstShelf) setSelectedShelf(firstShelf);
              }}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedSectorId === sec.id ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sec.refNum}- {sec.name.split('(')[0].replace(/^\d-\s*/, '').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Legend: Familias de Estanterías + Colores Distintivos por Operario */}
      <div className="flex flex-col gap-2 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-400">Familias:</span>
          {Object.entries(FAMILY_COLORS).map(([key, item]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: item.fill }} />
              <span className="text-slate-300">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1.5 rounded-sm inline-block bg-amber-400 border border-sky-400" />
            <span className="text-amber-300 font-medium">Abertura / Vano CAD</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1.5 border-t border-slate-800/80" data-testid="operator-color-legend">
          <span className="font-semibold text-sky-300 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Color de Nodo por Operario:</span>
          </span>
          {Object.values(OPERATOR_COLORS).map((opTheme) => (
            <div
              key={opTheme.operatorName}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800"
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block ring-2 ring-white/40"
                style={{ backgroundColor: opTheme.hex }}
              />
              <span className="font-semibold text-slate-200">{opTheme.operatorName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de 3 Operarios Simultáneos en Pista (Secuencia Correlativa hasta completar las 43 Mediciones) */}
      <div
        data-testid="correlative-trio-bar"
        className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2.5 text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/50 text-sky-300 font-mono font-bold">
              3 OPERARIOS EN SIMULTÁNEO
            </span>
            <span className="text-slate-200 font-semibold">
              Secuencia Correlativa Activa: Mediciones #{trioObservations[0].globalId}, #{trioObservations[1].globalId} y #{trioObservations[2].globalId} de 43
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => stepCorrelativeObs(-3)}
              data-testid="trio-prev-btn"
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Retroceder 3 mediciones correlativas"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>-3</span>
            </button>
            <button
              type="button"
              onClick={() => stepCorrelativeObs(1)}
              data-testid="trio-next-1-btn"
              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Avanzar +1 medición correlativa"
            >
              <span>+1 Correlativo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => stepCorrelativeObs(3)}
              data-testid="trio-next-3-btn"
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Avanzar a los siguientes 3 operarios correlativos"
            >
              <span>+3 Tanda</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {simultaneousOperators.map((opSim) => (
            <div
              key={`trio-card-${opSim.slot}-${opSim.obs.globalId}`}
              data-testid={`trio-operator-card-${opSim.slot}`}
              onClick={() => setActiveIndividualObs && setActiveIndividualObs(opSim.obs)}
              className="bg-slate-900/95 border rounded-lg px-3 py-2 flex flex-col justify-between gap-1 cursor-pointer hover:bg-slate-900 transition-colors"
              style={{ borderColor: opSim.opColor.hex }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block shrink-0 ring-2 ring-white/60"
                    style={{ backgroundColor: opSim.opColor.hex }}
                  />
                  <span className="font-bold text-white">
                    Obs #{opSim.obs.globalId}/43 · {opSim.obs.operatorObserved}
                  </span>
                </div>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  {opSim.obs.observerName.split(' ')[0]} · {opSim.obs.anomalyCode && opSim.obs.anomalyCode !== '—' ? opSim.obs.anomalyCode : 'Fluido'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
                <span style={{ color: opSim.opColor.hex }}>
                  {opSim.slotStage.code}: {opSim.stageSec} s (Total: {opSim.obs.totalSec} s)
                </span>
                <span className="text-slate-400 truncate">
                  Pos ({opSim.coords.x},{opSim.coords.y}) · {opSim.interp.currentWaypoint.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-sky-400">Ruta Pasillos Op. #1 ({primaryOp.obs.operatorObserved}):</span>
            {primaryOp.walkPath.map((wp, idx) => (
              <React.Fragment key={`${wp.id}-${idx}`}>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono ${
                    wp.openingCode
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold'
                      : wp.id === primaryOp.interp.currentWaypoint.id
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {wp.openingCode ? `Vano ${wp.openingCode}` : wp.label}
                </span>
                {idx < primaryOp.walkPath.length - 1 && <span className="text-slate-500">→</span>}
              </React.Fragment>
            ))}
          </div>
          <span className="font-mono text-emerald-400">
            Progreso Correlativo: {trioObservations[0].globalId}–{trioObservations[2].globalId} de 43 mediciones ({Math.round((trioObservations[2].globalId / 43) * 100)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative min-h-[490px] flex items-center justify-center">
          {viewDim === '2d' ? (
            <svg
              viewBox="0 0 950 585"
              className="w-full h-auto max-h-[540px] select-none"
              role="img"
              aria-label="Plano CAD 2D de Electro NICO con aberturas, igual ancho Sector 3 y Sector 4, y escalera frente a Estantería G"
            >
              <defs>
                <radialGradient id="heatRed" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatAmber" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatGreen" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="950" height="585" fill="#090f1d" />

              {/* Optional CAD Original Image Underlay */}
              {showCadBlueprint && (
                <image
                  href="/assets/aistudio/Layout_Electro_Nico_25df3821.png"
                  x="25"
                  y="10"
                  width="900"
                  height="565"
                  opacity="0.32"
                  preserveAspectRatio="none"
                />
              )}

              {/* Architectural Grid */}
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((gx) => (
                <line key={gx} x1={gx} y1={0} x2={gx} y2={585} stroke="#1e293b" strokeWidth="0.8" />
              ))}
              {[100, 200, 300, 400, 500].map((gy) => (
                <line key={gy} x1={0} y1={gy} x2={950} y2={gy} stroke="#1e293b" strokeWidth="0.8" />
              ))}

              {/* External Acera 15m Reception Indicator */}
              <rect x="6" y="340" width="34" height="190" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x="23" y="435" fill="#fbbf24" fontSize="9" fontWeight="700" textAnchor="middle" transform="rotate(-90 23 435)">
                Acera Exterior (a 15 m · 5 Lotes / 13 Cajas)
              </text>

              {/* Render Sectors 1 to 7 (Sector 3 and Sector 4 have identical width w=230 and height h=220) */}
              {SECTORS.map((sec) => {
                const isSelected = sec.id === selectedSectorId;
                const strokeColor = layoutMode === 'as-is' ? sec.colorAsIs : sec.colorToBe;
                return (
                  <g key={sec.id} onClick={() => setSelectedSectorId(sec.id)} className="cursor-pointer">
                    {sec.polygon ? (
                      <polygon
                        points={sec.polygon}
                        fill={showCadBlueprint ? 'rgba(15, 23, 42, 0.45)' : '#0f172a'}
                        stroke={isSelected ? '#38bdf8' : strokeColor}
                        strokeWidth={isSelected ? 2.8 : 1.8}
                      />
                    ) : (
                      <rect
                        x={sec.x}
                        y={sec.y}
                        width={sec.w}
                        height={sec.h}
                        rx={4}
                        fill={showCadBlueprint ? 'rgba(15, 23, 42, 0.45)' : '#0f172a'}
                        stroke={isSelected ? '#38bdf8' : strokeColor}
                        strokeWidth={isSelected ? 2.8 : 1.8}
                      />
                    )}

                    {showHeatmap && (
                      <circle
                        cx={sec.badgeX ?? sec.x + sec.w / 2}
                        cy={sec.badgeY ?? sec.y + sec.h / 2}
                        r={Math.max(sec.w, sec.h) * 0.45}
                        fill={
                          layoutMode === 'as-is'
                            ? sec.heatLevelAsIs > 0.85
                              ? 'url(#heatRed)'
                              : 'url(#heatAmber)'
                            : 'url(#heatGreen)'
                        }
                      />
                    )}

                    {/* Big CAD Sector Number Circle (1 to 7) */}
                    <circle
                      cx={sec.badgeX ?? sec.x + sec.w * 0.46}
                      cy={sec.badgeY ?? sec.y + sec.h * 0.52}
                      r="14"
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke={isSelected ? '#38bdf8' : '#64748b'}
                      strokeWidth="1.5"
                    />
                    <text
                      x={sec.badgeX ?? sec.x + sec.w * 0.46}
                      y={(sec.badgeY ?? sec.y + sec.h * 0.52) + 5}
                      fill="#f8fafc"
                      fontSize="14"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      {sec.refNum}
                    </text>
                  </g>
                );
              })}

              {/* Floor-only Legends for Show Room, Vidriera, and Lado Sur del Mostrador */}
              <g className="pointer-events-none select-none">
                <text
                  x="138"
                  y="196"
                  fill="#fde68a"
                  fontSize="10.5"
                  fontWeight="700"
                  textAnchor="middle"
                  transform="rotate(-64 138 196)"
                >
                  Show Room Luminarias
                </text>
                <text
                  x="76"
                  y="475"
                  fill="#fde68a"
                  fontSize="10.5"
                  fontWeight="700"
                  textAnchor="middle"
                  transform="rotate(-90 76 475)"
                >
                  Vidriera (626 × 220 cm)
                </text>
                <text
                  x="235"
                  y="436"
                  fill="#38bdf8"
                  fontSize="8"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  Lado Sur Mostrador: Atención (E1), Empaque (E7) y Facturación/Stock PC (E8)
                </text>
              </g>

              {/* Escalera in Sector 3 (DIRECTLY IN FRONT OF Estantería G) & Escalera Landing in Sector 4 + Baño in Sector 5 */}
              <g>
                {/* Escalera S3: right in front of Estantería G (s3-G is at x=532..656, y=315..337) */}
                <rect x="534" y="339" width="28" height="48" fill="#451a03" stroke="#fbbf24" strokeWidth="1.5" />
                {[346, 353, 360, 367, 374, 381].map((sy) => (
                  <line key={sy} x1="534" y1={sy} x2="562" y2={sy} stroke="#fde68a" strokeWidth="1.1" />
                ))}
                <text x="548" y="395" fill="#fde68a" fontSize="8" fontWeight="700" textAnchor="middle">
                  Escalera
                </text>

                {/* Escalera Landing in Sector 4 (Entrepiso) */}
                <rect x="694" y="346" width="32" height="28" fill="#451a03" stroke="#fbbf24" strokeWidth="1.3" />
                {[352, 358, 364, 370].map((sy) => (
                  <line key={sy} x1="694" y1={sy} x2="726" y2={sy} stroke="#fde68a" strokeWidth="1" />
                ))}
                <text x="710" y="343" fill="#fde68a" fontSize="8" fontWeight="700" textAnchor="middle">
                  Escalera
                </text>

                {/* Baño in Sector 5 */}
                <rect x="615" y="242" width="44" height="58" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
                <text x="637" y="274" fill="#cbd5e1" fontSize="9" fontWeight="600" textAnchor="middle">
                  Baño (65cm)
                </text>
              </g>

              {/* Render All Shelves A-K across Sectors 1 to 7 */}
              {SHELF_UNITS.filter((sh) => !(layoutMode === 'to-be' && sh.asIsOnly)).map((sh) => {
                const fam = layoutMode === 'to-be' && sh.toBeFamily ? sh.toBeFamily : sh.family;
                const color = FAMILY_COLORS[fam]?.fill ?? '#475569';
                const isHi = selectedShelf.id === sh.id;
                const shortCode = sh.code.split(' ')[0] === 'Est.' ? sh.code.split(' ')[1] : sh.code.split(' ')[0];
                const cx = sh.x + sh.w / 2;
                const cy = sh.y + sh.d / 2;
                return (
                  <g
                    key={sh.id}
                    transform={sh.angleDeg ? `rotate(${sh.angleDeg} ${cx} ${cy})` : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShelf(sh);
                      setSelectedSectorId(sh.sectorId);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x={sh.x}
                      y={sh.y}
                      width={sh.w}
                      height={sh.d}
                      rx={2}
                      fill={color}
                      fillOpacity={isHi ? 1 : 0.84}
                      stroke={isHi ? '#ffffff' : '#0f172a'}
                      strokeWidth={isHi ? 2 : 1}
                    />
                    <text
                      x={sh.x + sh.w / 2}
                      y={sh.y + sh.d / 2 + 3}
                      fill="#ffffff"
                      fontSize={sh.w < 22 ? '7.5' : '8.5'}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {sh.w >= 70 ? `${shortCode}: ${sh.altoM.toFixed(2).replace('.', ',')}m` : shortCode}
                    </text>
                  </g>
                );
              })}

              {/* Render Official CAD Openings (Aberturas / Vanos A1 a A9) */}
              {showOpenings && (
                <g>
                  {LAYOUT_OPENINGS.map((op) => {
                    const isHorizontal = Math.abs(op.y1 - op.y2) < 4;
                    return (
                      <g key={op.id}>
                        {/* Wall Cutout / Void */}
                        <line
                          x1={op.x1}
                          y1={op.y1}
                          x2={op.x2}
                          y2={op.y2}
                          stroke="#090f1d"
                          strokeWidth="6"
                        />
                        {/* Dashed Passage Threshold */}
                        <line
                          x1={op.x1}
                          y1={op.y1}
                          x2={op.x2}
                          y2={op.y2}
                          stroke="#fbbf24"
                          strokeWidth="2.6"
                          strokeDasharray="4 2"
                        />
                        {/* Architectural Jamb Ticks */}
                        {isHorizontal ? (
                          <>
                            <line x1={op.x1} y1={op.y1 - 4} x2={op.x1} y2={op.y1 + 4} stroke="#38bdf8" strokeWidth="2" />
                            <line x1={op.x2} y1={op.y2 - 4} x2={op.x2} y2={op.y2 + 4} stroke="#38bdf8" strokeWidth="2" />
                          </>
                        ) : (
                          <>
                            <line x1={op.x1 - 4} y1={op.y1} x2={op.x1 + 4} y2={op.y1} stroke="#38bdf8" strokeWidth="2" />
                            <line x1={op.x2 - 4} y1={op.y2} x2={op.x2 + 4} y2={op.y2} stroke="#38bdf8" strokeWidth="2" />
                          </>
                        )}
                        {/* Opening Badge */}
                        <rect
                          x={op.labelX - 24}
                          y={op.labelY - 8}
                          width="48"
                          height="12"
                          rx="3"
                          fill="rgba(9, 15, 29, 0.92)"
                          stroke="#fbbf24"
                          strokeWidth="0.9"
                        />
                        <text
                          x={op.labelX}
                          y={op.labelY + 1}
                          fill="#fde68a"
                          fontSize="7.5"
                          fontWeight="700"
                          textAnchor="middle"
                          className="font-mono"
                        >
                          {op.code}:{op.widthCm.replace(' cm', '')}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Equal Width Dimension Bars for Sector 3 and Sector 4 (Ancho S3 = Ancho S4 = 412 cm) */}
              <g fill="#f87171" fontSize="8.5" fontWeight="700" className="font-mono">
                <text x="82" y="175" transform="rotate(-68 82 175)">725 cm</text>
                <text x="174" y="102" transform="rotate(44 174 102)">270,3 cm</text>
                <text x="172" y="210" transform="rotate(-64 172 210)">400,2 cm</text>
                <text x="122" y="286" transform="rotate(-48 122 286)">150 cm</text>
                <text x="262" y="64" transform="rotate(27 262 64)">540 cm</text>
                <text x="230" y="372">836 cm (Pasillo 240 cm)</text>
                <text x="352" y="476">Pasillos: 50 cm (0,50 m)</text>

                {/* Highlight Equal Width of Sector 3 and Sector 4 */}
                <line x1="440" y1="544" x2="670" y2="544" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="440" y1="540" x2="440" y2="548" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="670" y1="540" x2="670" y2="548" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="555" y="556" fill="#38bdf8" textAnchor="middle">
                  Ancho Sector 3 = Sector 4 (412 cm)
                </text>

                <line x1="690" y1="544" x2="920" y2="544" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="690" y1="540" x2="690" y2="548" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="920" y1="540" x2="920" y2="548" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="805" y="556" fill="#38bdf8" textAnchor="middle">
                  Ancho Sector 4 = Sector 3 (412 cm)
                </text>
              </g>

              {/* Spaghetti Trajectories for the 3 Simultaneous Correlative Operators */}
              {showSpaghetti && (
                <g>
                  {simultaneousOperators.map((opSim) => {
                    if (opSim.fullCycleWaypoints.length <= 1) return null;
                    const off = SLOT_PIXEL_OFFSETS[opSim.slot];
                    return (
                      <polyline
                        key={`spaghetti-slot-${opSim.slot}-${opSim.obs.globalId}`}
                        points={opSim.fullCycleWaypoints
                          .map((p) => `${Math.round(p.x + off.dx * 0.45)},${Math.round(p.y + off.dy * 0.45)}`)
                          .join(' ')}
                        fill="none"
                        stroke={opSim.opColor.hex}
                        strokeWidth={opSim.slot === 0 ? '2.4' : '1.7'}
                        strokeDasharray={layoutMode === 'as-is' ? '6 4' : undefined}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity={opSim.slot === 0 ? '0.88' : '0.68'}
                      />
                    );
                  })}
                  {/* Reception Corridor Path: Acera Exterior (15m) -> A1 (220cm) -> Pasillo S2 -> A4 -> Lado Sur Mostrador */}
                  {layoutMode === 'as-is' && (
                    <polyline
                      points="24,352 45,352 85,352 408,352 362,442 245,442"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      strokeLinejoin="round"
                      opacity="0.85"
                    />
                  )}
                </g>
              )}

              {/* Active Corridor & Opening Walk Paths for all 3 Simultaneous Operators */}
              {simultaneousOperators.map((opSim) => {
                if (opSim.walkPath.length <= 1) return null;
                const off = SLOT_PIXEL_OFFSETS[opSim.slot];
                return (
                  <g key={`walkpath-slot-${opSim.slot}`}>
                    <polyline
                      points={opSim.walkPath
                        .map((p) => `${Math.round(p.x + off.dx * 0.65)},${Math.round(p.y + off.dy * 0.65)}`)
                        .join(' ')}
                      fill="none"
                      stroke={opSim.opColor.hex}
                      strokeWidth={opSim.slot === 0 ? '3.2' : '2.4'}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity="0.95"
                    />
                    {opSim.walkPath.map((wp, idx) => (
                      <circle
                        key={`wp-${opSim.slot}-${wp.id}-${idx}`}
                        cx={Math.round(wp.x + off.dx * 0.65)}
                        cy={Math.round(wp.y + off.dy * 0.65)}
                        r={wp.openingCode ? 4.8 : 2.8}
                        fill={wp.openingCode ? '#f59e0b' : opSim.opColor.hex}
                        stroke="#0f172a"
                        strokeWidth="1.1"
                      />
                    ))}
                  </g>
                );
              })}

              {/* Pareto Bottleneck Badges */}
              {layoutMode === 'as-is' &&
                PARETO_BOTTLENECKS.map((b) => {
                  const isHi = selectedBottleneckRank === b.rank;
                  return (
                    <g
                      key={b.code}
                      onClick={() => {
                        setSelectedBottleneckRank(b.rank);
                        setSelectedSectorId(b.sectorId);
                      }}
                      className="cursor-pointer"
                    >
                      <circle cx={b.alertX} cy={b.alertY} r={isHi ? 12 : 9.5} fill={isHi ? '#e11d48' : '#9f1239'} stroke="#fda4af" strokeWidth="1.5" />
                      <text x={b.alertX} y={b.alertY + 3} fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="middle">
                        {b.code.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

              {/* 3 Simultaneous Correlative Operator Beacons (Distinct Color Per Operator) */}
              {simultaneousOperators.map((opSim) => {
                const badgeYOffset = opSim.slot === 0 ? -32 : opSim.slot === 1 ? -49 : 14;
                const textYOffset = badgeYOffset + 11.5;
                return (
                  <g
                    key={`beacon-slot-${opSim.slot}-${opSim.obs.globalId}`}
                    data-testid={`operator-node-slot-${opSim.slot}`}
                    data-operator-name={opSim.obs.operatorObserved}
                    data-operator-color={opSim.opColor.hex}
                    data-obs-id={opSim.obs.globalId}
                  >
                    <circle cx={opSim.coords.x} cy={opSim.coords.y} r="13" fill={opSim.opColor.glowRgba} />
                    <circle
                      cx={opSim.coords.x}
                      cy={opSim.coords.y}
                      r="7.2"
                      fill={opSim.opColor.hex}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={opSim.coords.x}
                      y={opSim.coords.y + 3}
                      fill="#090f1d"
                      fontSize="7.5"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {opSim.slot + 1}
                    </text>
                    <rect
                      x={opSim.coords.x - 84}
                      y={opSim.coords.y + badgeYOffset}
                      width="168"
                      height="16.5"
                      rx="4"
                      fill={opSim.opColor.badgeBg}
                      stroke={opSim.opColor.badgeBorder}
                      strokeWidth="1.1"
                    />
                    <text
                      x={opSim.coords.x}
                      y={opSim.coords.y + textYOffset}
                      fill="#ffffff"
                      fontSize="8.2"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {opSim.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={920}
                height={500}
                onMouseDown={(e) => {
                  dragRef.current = { dragging: true, startX: e.clientX, startAngle: isoAngle };
                }}
                onMouseMove={(e) => {
                  if (!dragRef.current.dragging) return;
                  setIsoAngle((dragRef.current.startAngle + Math.round((e.clientX - dragRef.current.startX) * 0.45) + 360) % 360);
                }}
                onMouseUp={() => {
                  dragRef.current.dragging = false;
                }}
                onMouseLeave={() => {
                  dragRef.current.dragging = false;
                }}
                className="w-full h-auto max-h-[520px] cursor-grab active:cursor-grabbing"
                aria-label="Vista 3D Isométrica Interactiva de los 7 Sectores, Aberturas y Escalera frente a Estantería G"
              />

              {/* Controles de Rotación, Acercar y Alejar dentro del recuadro del plano 3D */}
              <div
                data-testid="3d-in-frame-controls"
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2.5 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-lg px-3 py-2 text-xs shadow-lg"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-semibold text-slate-200 whitespace-nowrap">Rotación:</span>
                  <button
                    type="button"
                    onClick={() => setIsoAngle((isoAngle - 15 + 360) % 360)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-mono text-slate-200 cursor-pointer"
                    title="Rotar -15°"
                  >
                    -15°
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={isoAngle}
                    onChange={(e) => setIsoAngle(Number(e.target.value))}
                    className="w-24 accent-sky-500 cursor-pointer"
                    aria-label="Rotación 3D Isométrica"
                  />
                  <button
                    type="button"
                    onClick={() => setIsoAngle((isoAngle + 15) % 360)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-mono text-slate-200 cursor-pointer"
                    title="Rotar +15°"
                  >
                    +15°
                  </button>
                  <span className="font-mono font-bold text-sky-400 w-9 text-right">{isoAngle}°</span>
                </div>

                <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsoZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 font-medium cursor-pointer transition-colors"
                    aria-label="Alejar vista 3D"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-amber-400" />
                    <span>Alejar</span>
                  </button>
                  <span className="font-mono text-[11px] text-slate-300 px-1">{Math.round(isoZoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setIsoZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 font-medium cursor-pointer transition-colors"
                    aria-label="Acercar vista 3D"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Acercar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsoAngle(26);
                      setIsoZoom(0.86);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 hover:text-white cursor-pointer transition-colors"
                    aria-label="Reiniciar cámara 3D"
                    title="Restablecer vista 3D"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden md:inline">Reiniciar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector: Sector Details + Exact Shelf Measurements + CAD Openings */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div>
              <div className="text-xs font-mono text-sky-400">REFERENCIA {activeSector.refNum} DEL PLANO</div>
              <h3 className="text-base font-bold text-white mt-0.5">{activeSector.name}</h3>
              <p className="text-xs text-slate-400">{activeSector.subtitle}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Cotas Plano CAD:</span>
                <span className="font-mono text-amber-300 text-right">{activeSector.cotasPlano}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Pasos y Aberturas:</span>
                <span className="font-mono text-slate-200 text-right">{activeSector.aisleWidth}</span>
              </div>
            </div>

            {/* Selected Shelf Exact Measurement Card */}
            <div className="bg-slate-900 border border-sky-500/40 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-400">FICHA DE ESTANTERÍA RELEVADA</span>
                <span className="text-xs font-mono text-emerald-400">{selectedShelf.cubiculos} cubículos</span>
              </div>
              <div className="text-sm font-bold text-white">{selectedShelf.label}</div>
              <div className="text-xs text-slate-300">Contenido: {selectedShelf.contenido}</div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">ALTO</div>
                  <div className="font-bold text-white">{selectedShelf.altoM.toFixed(2).replace('.', ',')} m</div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">LARGO</div>
                  <div className="font-bold text-white">{selectedShelf.largoM.toFixed(2).replace('.', ',')} m</div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">PROF.</div>
                  <div className="font-bold text-white">{selectedShelf.profM.toFixed(2).replace('.', ',')} m</div>
                </div>
              </div>
            </div>

            {/* Quick Shelf Selector within Active Sector */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-300">
                Estanterías en Sector {activeSector.refNum} ({sectorShelves.length} unidades):
              </div>
              {sectorShelves.length > 0 ? (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {sectorShelves.map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setSelectedShelf(sh)}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                        selectedShelf.id === sh.id
                          ? 'bg-sky-600 border-sky-400 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sh.code.replace(/\s*\(S\d\)/, '')} ({sh.altoM.toFixed(2).replace('.', ',')}m)
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-amber-300/90 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5">
                  Show Room y Vidriera representados únicamente como leyenda en el piso del plano (sin bloques físicos).
                </div>
              )}
            </div>

            {/* CAD Openings Reference List */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-2.5 space-y-1">
              <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center justify-between gap-2">
                <span className="whitespace-nowrap">ABERTURAS CAD ({LAYOUT_OPENINGS.length})</span>
                <span className="text-sky-300 whitespace-nowrap">Ruta S1/S2 → S7: A5 → A6 → A7</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[11px]">
                {LAYOUT_OPENINGS.map((op) => (
                  <div key={op.id} className="flex items-center justify-between gap-2 text-slate-300 border-b border-slate-800/70 pb-0.5">
                    <span className="truncate">
                      <strong className="text-amber-300 font-mono">{op.code}</strong> · {op.connects}
                    </span>
                    <span className="font-mono text-sky-300 shrink-0">{op.widthCm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

