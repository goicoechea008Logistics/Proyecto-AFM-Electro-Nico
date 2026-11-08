import { LayoutMode } from './afmData';
import { ALL_43_OBSERVATIONS, IndividualObservation } from './htcObservationsData';

export interface CorridorWaypoint {
  id: string;
  x: number;
  y: number;
  label: string;
  openingCode?: string; // e.g. 'A2', 'A4', 'A5', 'A6', 'A7', 'A8', 'ESC'
  sectorId: string;
}

export const CORRIDOR_NODES: Record<string, CorridorWaypoint> = {
  // Sector 2: Lado Sur del Mostrador (Atención al cliente E1, Empaque E7, Facturación y Descuento de Stock en PC E8)
  N_PC: { id: 'N_PC', x: 156, y: 442, label: 'Lado Sur Mostrador · PC Facturación y Descuento Stock (E8)', sectorId: 'sec2' },
  N_MOST_E1: { id: 'N_MOST_E1', x: 245, y: 442, label: 'Lado Sur Mostrador · Atención al Cliente (E1)', sectorId: 'sec2' },
  N_MOST_E7: { id: 'N_MOST_E7', x: 310, y: 442, label: 'Lado Sur Mostrador · Verificación y Empaque (E7)', sectorId: 'sec2' },

  // Abertura / Paso A4 (Paso lateral del Mostrador: 75/100 cm conectando el Lado Sur del Mostrador con los pasillos de S2)
  N_A4: { id: 'N_A4', x: 362, y: 442, label: 'Paso Mostrador A4 (75/100 cm)', openingCode: 'A4', sectorId: 'sec2' },

  // Pasillos del Salón de Ventas (Sector 2)
  N_S2_UPPER_W: { id: 'N_S2_UPPER_W', x: 85, y: 352, label: 'Pasillo Norte Salón S2', sectorId: 'sec2' },
  N_S2_NE: { id: 'N_S2_NE', x: 408, y: 352, label: 'Pasillo Este Salón S2 (Norte)', sectorId: 'sec2' },
  N_S2_PASILLO: { id: 'N_S2_PASILLO', x: 408, y: 458, label: 'Pasillo Principal Sur S2 (240 cm)', sectorId: 'sec2' },
  N_S2_GAV_TOP: { id: 'N_S2_GAV_TOP', x: 292, y: 468, label: 'Acceso Gaveteros A-H (Lado Sur S2)', sectorId: 'sec2' },
  N_S2_GAV_IN: { id: 'N_S2_GAV_IN', x: 292, y: 515, label: 'Pasillo 50 cm Gaveteros C/D (S2)', sectorId: 'sec2' },
  N_S2_SE: { id: 'N_S2_SE', x: 408, y: 493, label: 'Pasillo frente a Abertura A5', sectorId: 'sec2' },

  // Abertura A1 (Acceso Calle 220 cm) y Acera Exterior
  N_A1: { id: 'N_A1', x: 45, y: 352, label: 'Abertura A1 (220 cm)', openingCode: 'A1', sectorId: 'sec2' },
  N_ACERA: { id: 'N_ACERA', x: 24, y: 352, label: 'Acera Exterior (15 m)', sectorId: 'sec1' },

  // Abertura A2 (150 cm en base del triángulo Show Room) y Sector 1
  N_A2: { id: 'N_A2', x: 85, y: 305, label: 'Abertura A2 (150 cm)', openingCode: 'A2', sectorId: 'sec1' },
  N_S1_SHOW: { id: 'N_S1_SHOW', x: 96, y: 245, label: 'Pasillo Show Room Luminarias (S1)', sectorId: 'sec1' },

  // Abertura A5 (77 cm entre Sector 2 y Sector 3)
  N_A5: { id: 'N_A5', x: 440, y: 493, label: 'Abertura A5 (77 cm)', openingCode: 'A5', sectorId: 'sec3' },

  // Pasillos Internos Sector 3 (Salón Depósito N°1)
  N_S3_SW: { id: 'N_S3_SW', x: 510, y: 493, label: 'Ingreso S3 tras Abertura A5', sectorId: 'sec3' },
  N_S3_MID: { id: 'N_S3_MID', x: 510, y: 410, label: 'Pasillo Central S3 (52-58 cm)', sectorId: 'sec3' },
  N_S3_PICK: { id: 'N_S3_PICK', x: 558, y: 410, label: 'Pasillo Est. C/D/F/H (S3)', sectorId: 'sec3' },
  N_S3_NORTH: { id: 'N_S3_NORTH', x: 510, y: 350, label: 'Pasillo Norte S3 (frente a Est. G)', sectorId: 'sec3' },

  // Escalera frente a Estantería G (S3 <-> S4 Entrepiso)
  N_ESC_S3: { id: 'N_ESC_S3', x: 558, y: 348, label: 'Escalera Planta Baja (frente a Est. G)', openingCode: 'ESC', sectorId: 'sec3' },
  N_ESC_S4: { id: 'N_ESC_S4', x: 715, y: 348, label: 'Desembarco Escalera Entrepiso (S4)', openingCode: 'ESC', sectorId: 'sec4' },
  N_S4_PASILLO: { id: 'N_S4_PASILLO', x: 735, y: 385, label: 'Pasillo 70 cm Entrepiso (S4)', sectorId: 'sec4' },
  N_S4_PICK: { id: 'N_S4_PICK', x: 735, y: 465, label: 'Pasillo Est. C/D/E/G (S4)', sectorId: 'sec4' },

  // Abertura A6 (77 cm entre Sector 3 y Sector 6)
  N_A6: { id: 'N_A6', x: 510, y: 310, label: 'Abertura A6 (77 cm)', openingCode: 'A6', sectorId: 'sec6' },

  // Pasillos Internos Sector 6 (Salón Depósito N°4)
  N_S6_SOUTH: { id: 'N_S6_SOUTH', x: 492, y: 296, label: 'Ingreso Sur S6 tras A6', sectorId: 'sec6' },
  N_S6_PICK: { id: 'N_S6_PICK', x: 538, y: 252, label: 'Pasillo Central 100 cm (S6)', sectorId: 'sec6' },
  N_S6_NW: { id: 'N_S6_NW', x: 492, y: 164, label: 'Cruce Norte S6 (junto a A7)', sectorId: 'sec6' },
  N_S6_NE: { id: 'N_S6_NE', x: 598, y: 164, label: 'Pasillo Noreste S6 (hacia A8)', sectorId: 'sec6' },

  // Abertura A7 (84 cm entre Sector 6 y Sector 7) y Pasillos Sector 7
  // (No existe abertura entre Sector 1 y Sector 7: para llegar a S7 desde S1 o S2 el camino obligatorio es A5 -> A6 -> A7)
  N_A7: { id: 'N_A7', x: 478, y: 164, label: 'Abertura A7 (84 cm)', openingCode: 'A7', sectorId: 'sec7' },
  N_S7_EAST: { id: 'N_S7_EAST', x: 455, y: 160, label: 'Pasillo Este S7 tras A7', sectorId: 'sec7' },
  N_S7_MID: { id: 'N_S7_MID', x: 312, y: 160, label: 'Pasillo Central S7 (entre Est. A y J)', sectorId: 'sec7' },
  N_S7_PICK: { id: 'N_S7_PICK', x: 295, y: 242, label: 'Zona Corte Bobinas Diors (S7)', sectorId: 'sec7' },

  // Abertura A8 (68 cm entre Sector 6 y Sector 5) y Pasillo Sector 5
  N_A8: { id: 'N_A8', x: 615, y: 148, label: 'Abertura A8 (68 cm)', openingCode: 'A8', sectorId: 'sec5' },
  N_S5_PICK: { id: 'N_S5_PICK', x: 652, y: 175, label: 'Pasillo Oficina Depósito N°3 (S5)', sectorId: 'sec5' },
};

// Grafo bidireccional de pasillos reales y aberturas (ninguna arista atraviesa muros ni estanterías;
// Sector 1 y Sector 7 están separados por muro cerrado, conectando desde S1/S2 hacia S7 vía A5 -> A6 -> A7)
export const CORRIDOR_ADJACENCY: Record<string, string[]> = {
  N_PC: ['N_MOST_E1'],
  N_MOST_E1: ['N_PC', 'N_MOST_E7'],
  N_MOST_E7: ['N_MOST_E1', 'N_A4'],
  N_A4: ['N_MOST_E7', 'N_S2_PASILLO', 'N_S2_GAV_TOP', 'N_S2_NE'],
  N_S2_UPPER_W: ['N_S2_NE', 'N_A1', 'N_A2'],
  N_A1: ['N_S2_UPPER_W', 'N_ACERA'],
  N_ACERA: ['N_A1'],
  N_A2: ['N_S2_UPPER_W', 'N_S1_SHOW'],
  N_S1_SHOW: ['N_A2'],
  N_S2_NE: ['N_A4', 'N_S2_UPPER_W', 'N_S2_PASILLO'],
  N_S2_PASILLO: ['N_A4', 'N_S2_NE', 'N_S2_GAV_TOP', 'N_S2_SE'],
  N_S2_GAV_TOP: ['N_A4', 'N_S2_PASILLO', 'N_S2_GAV_IN'],
  N_S2_GAV_IN: ['N_S2_GAV_TOP'],
  N_S2_SE: ['N_S2_PASILLO', 'N_A5'],
  N_A5: ['N_S2_SE', 'N_S3_SW'],
  N_S3_SW: ['N_A5', 'N_S3_MID'],
  N_S3_MID: ['N_S3_SW', 'N_S3_PICK', 'N_S3_NORTH'],
  N_S3_PICK: ['N_S3_MID'],
  N_S3_NORTH: ['N_S3_MID', 'N_ESC_S3', 'N_A6'],
  N_ESC_S3: ['N_S3_NORTH', 'N_ESC_S4'],
  N_ESC_S4: ['N_ESC_S3', 'N_S4_PASILLO'],
  N_S4_PASILLO: ['N_ESC_S4', 'N_S4_PICK'],
  N_S4_PICK: ['N_S4_PASILLO'],
  N_A6: ['N_S3_NORTH', 'N_S6_SOUTH'],
  N_S6_SOUTH: ['N_A6', 'N_S6_PICK', 'N_S6_NW'],
  N_S6_PICK: ['N_S6_SOUTH'],
  N_S6_NW: ['N_S6_SOUTH', 'N_A7', 'N_S6_NE'],
  N_S6_NE: ['N_S6_NW', 'N_A8'],
  N_A7: ['N_S6_NW', 'N_S7_EAST'],
  N_S7_EAST: ['N_A7', 'N_S7_MID'],
  N_S7_MID: ['N_S7_EAST', 'N_S7_PICK'],
  N_S7_PICK: ['N_S7_MID'],
  N_A8: ['N_S6_NE', 'N_S5_PICK'],
  N_S5_PICK: ['N_A8'],
};

const SECTOR_TARGET_NODE: Record<string, { searchNode: string; obstacleNode: string; pickNode: string }> = {
  sec1: { searchNode: 'N_A2', obstacleNode: 'N_S1_SHOW', pickNode: 'N_S1_SHOW' },
  sec2: { searchNode: 'N_S2_GAV_TOP', obstacleNode: 'N_S2_GAV_TOP', pickNode: 'N_S2_GAV_IN' },
  sec3: { searchNode: 'N_S3_NORTH', obstacleNode: 'N_S3_MID', pickNode: 'N_S3_PICK' },
  sec4: { searchNode: 'N_S4_PASILLO', obstacleNode: 'N_ESC_S3', pickNode: 'N_S4_PICK' },
  sec5: { searchNode: 'N_S6_NE', obstacleNode: 'N_A8', pickNode: 'N_S5_PICK' },
  sec6: { searchNode: 'N_S6_NW', obstacleNode: 'N_S6_SOUTH', pickNode: 'N_S6_PICK' },
  sec7: { searchNode: 'N_S7_MID', obstacleNode: 'N_S3_MID', pickNode: 'N_S7_PICK' },
};

// Encuentra el camino más corto por pasillos y aberturas usando Dijkstra sobre distancias euclidianas
export function findCorridorPath(startNodeId: string, endNodeId: string): CorridorWaypoint[] {
  if (!CORRIDOR_NODES[startNodeId] || !CORRIDOR_NODES[endNodeId]) {
    return [CORRIDOR_NODES.N_MOST_E1];
  }
  if (startNodeId === endNodeId) {
    return [CORRIDOR_NODES[startNodeId]];
  }

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set<string>(Object.keys(CORRIDOR_NODES));

  for (const id of unvisited) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[startNodeId] = 0;

  while (unvisited.size > 0) {
    let u: string | null = null;
    let bestD = Infinity;
    for (const id of unvisited) {
      if (dist[id] < bestD) {
        bestD = dist[id];
        u = id;
      }
    }
    if (!u || u === endNodeId) break;
    unvisited.delete(u);

    const neighbors = CORRIDOR_ADJACENCY[u] ?? [];
    for (const v of neighbors) {
      if (!unvisited.has(v)) continue;
      const nu = CORRIDOR_NODES[u];
      const nv = CORRIDOR_NODES[v];
      const edgeLen = Math.hypot(nv.x - nu.x, nv.y - nu.y);
      const alt = dist[u] + edgeLen;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  const path: CorridorWaypoint[] = [];
  let curr: string | null = endNodeId;
  while (curr) {
    path.unshift(CORRIDOR_NODES[curr]);
    curr = prev[curr];
  }
  return path.length > 0 ? path : [CORRIDOR_NODES[startNodeId], CORRIDOR_NODES[endNodeId]];
}

// Devuelve el nodo objetivo de cada etapa (E1 a E8) respetando el modo As-Is / To-Be y la medición activa
export function getStageTargetNodeId(
  stageIdx: number,
  layoutMode: LayoutMode,
  obs: IndividualObservation | null
): string {
  // En Propuesta AFM (To-Be), las familias críticas Clase A están consolidadas en Sector 3 (y Gaveteros S2)
  if (layoutMode === 'to-be') {
    switch (stageIdx) {
      case 0:
        return 'N_MOST_E1'; // E1 Recepción en mostrador
      case 1:
        return 'N_A5'; // E2 Caminata corta por A4 -> Pasillo S2 -> Abertura A5
      case 2:
        return 'N_S3_MID'; // E3 Búsqueda codificada inmediata en S3
      case 3:
        return 'N_S3_MID'; // E4 = 0,0 s (Pasillo libre sin obstáculos)
      case 4:
        return 'N_S3_PICK'; // E5 Picking en núcleo ABC Sector 3
      case 5:
        return 'N_S2_NE'; // E6 Retorno fluido por A5 -> Pasillo S2 -> A4
      case 6:
        return 'N_MOST_E7'; // E7 Empaque en mostrador
      case 7:
      default:
        return 'N_PC'; // E8 Registro en PC
    }
  }

  // En Estado Actual (As-Is), depende de la observación individual o del ciclo global caótico
  const targetSec = obs?.targetSectorId ?? 'sec7';
  const secNodes = SECTOR_TARGET_NODE[targetSec] ?? SECTOR_TARGET_NODE.sec7;

  // Si la observación individual no sale del mostrador (ej. Obs #5 Pago Factura o #13 Cerradura Inex.)
  if (obs && obs.stages[1] === 0 && obs.stages[2] === 0 && obs.stages[4] === 0) {
    if (stageIdx === 7) return 'N_PC';
    return 'N_MOST_E1';
  }

  switch (stageIdx) {
    case 0:
      return 'N_MOST_E1'; // E1: Detrás del mostrador
    case 1:
      return targetSec === 'sec1'
        ? 'N_A2'
        : targetSec === 'sec2'
        ? 'N_S2_PASILLO'
        : 'N_A5'; // E2: Desplazamiento inicial pasando por la abertura correspondiente
    case 2:
      return secNodes.searchNode; // E3: Búsqueda por memoria en el sector destino
    case 3:
      return obs && obs.stages[3] === 0 ? secNodes.searchNode : secNodes.obstacleNode; // E4: Remoción de obstáculos en pasillo
    case 4:
      return obs && obs.stages[4] === 0 ? secNodes.searchNode : secNodes.pickNode; // E5: Picking en estantería
    case 5:
      return targetSec === 'sec1' ? 'N_S2_UPPER_W' : 'N_S2_PASILLO'; // E6: Caminata de retorno por pasillo S2
    case 6:
      return 'N_MOST_E7'; // E7: Verificación y empaque en mostrador
    case 7:
    default:
      return 'N_PC'; // E8: Facturación en PC
  }
}

// Interpola una posición continua (x, y) a lo largo de una polilínea de waypoints con t en [0, 1]
export function interpolateAlongWaypoints(
  waypoints: CorridorWaypoint[],
  t: number
): { x: number; y: number; currentWaypoint: CorridorWaypoint; openingsPassed: string[] } {
  if (waypoints.length === 0) {
    const fallback = CORRIDOR_NODES.N_MOST_E1;
    return { x: fallback.x, y: fallback.y, currentWaypoint: fallback, openingsPassed: [] };
  }
  if (waypoints.length === 1 || t <= 0) {
    const first = waypoints[0];
    return {
      x: first.x,
      y: first.y,
      currentWaypoint: first,
      openingsPassed: first.openingCode ? [first.openingCode] : [],
    };
  }
  const clampedT = Math.min(1, Math.max(0, t));

  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const len = Math.hypot(waypoints[i + 1].x - waypoints[i].x, waypoints[i + 1].y - waypoints[i].y);
    segLengths.push(len);
    totalLen += len;
  }

  if (totalLen === 0) {
    const last = waypoints[waypoints.length - 1];
    return { x: last.x, y: last.y, currentWaypoint: last, openingsPassed: [] };
  }

  const targetDist = clampedT * totalLen;
  let accum = 0;
  const openingsPassed: string[] = [];
  if (waypoints[0].openingCode) openingsPassed.push(waypoints[0].openingCode);

  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (waypoints[i + 1].openingCode && accum + segLen * 0.5 <= targetDist) {
      if (!openingsPassed.includes(waypoints[i + 1].openingCode!)) {
        openingsPassed.push(waypoints[i + 1].openingCode!);
      }
    }
    if (accum + segLen >= targetDist || i === segLengths.length - 1) {
      const localT = segLen > 0 ? (targetDist - accum) / segLen : 1;
      const p0 = waypoints[i];
      const p1 = waypoints[i + 1];
      return {
        x: Number((p0.x + (p1.x - p0.x) * localT).toFixed(1)),
        y: Number((p0.y + (p1.y - p0.y) * localT).toFixed(1)),
        currentWaypoint: localT < 0.5 ? p0 : p1,
        openingsPassed,
      };
    }
    accum += segLen;
  }

  const last = waypoints[waypoints.length - 1];
  return { x: last.x, y: last.y, currentWaypoint: last, openingsPassed };
}

// Construye la polilínea completa del ciclo (E1 -> E2 -> E3 -> E4 -> E5 -> E6 -> E7 -> E8) respetando pasillos y aberturas
export function buildFullCycleCorridorWaypoints(
  layoutMode: LayoutMode,
  obs: IndividualObservation | null
): CorridorWaypoint[] {
  const fullList: CorridorWaypoint[] = [];
  for (let stageIdx = 0; stageIdx < 8; stageIdx++) {
    const fromNode =
      stageIdx === 0
        ? getStageTargetNodeId(0, layoutMode, obs)
        : getStageTargetNodeId(stageIdx - 1, layoutMode, obs);
    const toNode = getStageTargetNodeId(stageIdx, layoutMode, obs);
    const segment = findCorridorPath(fromNode, toNode);
    for (const wp of segment) {
      if (fullList.length === 0 || fullList[fullList.length - 1].id !== wp.id) {
        fullList.push(wp);
      }
    }
  }
  return fullList;
}

// Devuelve 3 observaciones correlativas en simultáneo (ej. [#1, #2, #3], ..., [#41, #42, #43]) hasta completar las 43 mediciones
export function getCorrelativeTrioObservations(
  anchorObs: IndividualObservation | null
): [IndividualObservation, IndividualObservation, IndividualObservation] {
  const total = ALL_43_OBSERVATIONS.length;
  const baseIdx = anchorObs
    ? Math.max(
        0,
        ALL_43_OBSERVATIONS.findIndex((o) => o.globalId === anchorObs.globalId)
      )
    : 0;

  return [
    ALL_43_OBSERVATIONS[baseIdx % total],
    ALL_43_OBSERVATIONS[(baseIdx + 1) % total],
    ALL_43_OBSERVATIONS[(baseIdx + 2) % total],
  ];
}

