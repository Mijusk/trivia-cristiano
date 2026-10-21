import type { Casilla, CasillaKey, Fase, Pareja, Partida } from '../types'
import { MODOS, NIVELES, PRUEBAS, TEMAS, TEMAS_BIBLICOS, TIEMPOS_POR_DEFECTO, ordenarTemas } from './config'
import { cartaPermitida, cartaPorId, existeCarta } from './mazo'
import { haGanado } from './reglas'

export const VERSION_PARTIDA = 3

const FASES: Fase[] = ['turno', 'carta', 'resultado', 'victoria']

type Objeto = Record<string, unknown>

const esObjeto = (x: unknown): x is Objeto => typeof x === 'object' && x !== null && !Array.isArray(x)
const esUno = <T extends string>(lista: readonly T[], x: unknown): x is T => lista.includes(x as T)
const esSegundos = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0

function esCasilla(x: unknown): x is Casilla {
  return esObjeto(x) && esUno(TEMAS, x.tema) && esUno(PRUEBAS, x.prueba)
}

function esClaveCasilla(x: unknown): x is CasillaKey {
  if (typeof x !== 'string') return false
  const [tema, prueba] = x.split(':')
  return esUno(TEMAS, tema) && esUno(PRUEBAS, prueba)
}

function leerPareja(x: unknown): Pareja | null {
  if (!esObjeto(x) || typeof x.id !== 'string' || typeof x.nombre !== 'string' || !esUno(NIVELES, x.nivel)) return null
  const ganadas = Array.isArray(x.ganadas) ? x.ganadas.filter(esClaveCasilla) : []
  return { id: x.id, nombre: x.nombre, nivel: x.nivel, ganadas: [...new Set(ganadas)] }
}

/** Solo las cartas que todavía existen en el banco, por si se ha borrado alguna. */
export function limpiarUsadas(x: unknown): string[] {
  return Array.isArray(x) ? [...new Set(x.filter((id): id is string => typeof id === 'string' && existeCarta(id)))] : []
}

/** v1 → v2: se añade el aviso de mazo reiniciado. Los ids de las cartas no cambian. */
function migrarV1(datos: Objeto): Objeto {
  return { ...datos, version: 2, mazoReiniciado: false }
}

/** v2 → v3: se eligen los temas. Las partidas de antes se jugaban con los cuatro bíblicos y sin el Camino. */
function migrarV2(datos: Objeto): Objeto {
  return { ...datos, version: 3, temas: [...TEMAS_BIBLICOS], incluirCamino: false }
}

const MIGRACIONES: Record<number, (datos: Objeto) => Objeto> = { 1: migrarV1, 2: migrarV2 }

/**
 * Convierte lo que haya guardado en una partida válida de la versión actual,
 * o devuelve null si no se puede aprovechar. Lo que no cuadra se arregla en
 * vez de descartar la partida entera: si la carta del turno ya no existe, se
 * vuelve a girar la ruleta.
 */
export function leerPartida(datos: unknown): Partida | null {
  if (!esObjeto(datos) || typeof datos.version !== 'number') return null
  let actual = datos
  while ((actual.version as number) < VERSION_PARTIDA) {
    const migrar = MIGRACIONES[actual.version as number]
    if (!migrar) return null
    actual = migrar(actual)
  }
  if (actual.version !== VERSION_PARTIDA) return null

  if (!esUno(MODOS, actual.modo) || !Array.isArray(actual.parejas)) return null
  const parejas = actual.parejas.map(leerPareja)
  if (parejas.length < 1 || parejas.some((p) => p === null)) return null
  const modo = actual.modo
  const elegidos = Array.isArray(actual.temas) ? ordenarTemas(actual.temas) : []
  const temas = elegidos.length > 0 ? elegidos : [...TEMAS_BIBLICOS]

  const tiempos = esObjeto(actual.tiempos) ? actual.tiempos : {}
  const partida: Partida = {
    version: VERSION_PARTIDA,
    fase: esUno(FASES, actual.fase) ? actual.fase : 'turno',
    modo,
    temas,
    // El Camino solo tiene sentido jugando con Vida Cristiana.
    incluirCamino: actual.incluirCamino === true && temas.includes('vida'),
    parejas: parejas as Pareja[],
    turno: Number.isInteger(actual.turno) && (actual.turno as number) >= 0 && (actual.turno as number) < parejas.length ? (actual.turno as number) : 0,
    casilla: esCasilla(actual.casilla) ? { tema: actual.casilla.tema, prueba: actual.casilla.prueba } : null,
    cartaId: typeof actual.cartaId === 'string' && existeCarta(actual.cartaId) ? actual.cartaId : null,
    cartaDeOtroTema: actual.cartaDeOtroTema === true,
    mazoReiniciado: actual.mazoReiniciado === true,
    pistaUsada: actual.pistaUsada === true,
    cambioUsado: actual.cambioUsado === true,
    usadas: limpiarUsadas(actual.usadas),
    ultimoAcierto: typeof actual.ultimoAcierto === 'boolean' ? actual.ultimoAcierto : null,
    tiempos: {
      pregunta: esSegundos(tiempos.pregunta) ? tiempos.pregunta : TIEMPOS_POR_DEFECTO.pregunta,
      actuar: esSegundos(tiempos.actuar) ? tiempos.actuar : TIEMPOS_POR_DEFECTO.actuar,
      mimica: esSegundos(tiempos.mimica) ? tiempos.mimica : TIEMPOS_POR_DEFECTO.mimica,
    },
  }

  const sinCarta = partida.casilla === null || partida.cartaId === null
  // La casilla o la carta del turno no son de esta partida (otro tema, o del Camino sin incluirlo).
  const carta = cartaPorId(partida.cartaId)
  const fueraDeLaPartida =
    (partida.casilla !== null && !temas.includes(partida.casilla.tema)) ||
    (carta !== undefined && !cartaPermitida(carta, temas, partida.incluirCamino))
  const turnoRoto =
    (partida.fase === 'carta' && (sinCarta || fueraDeLaPartida)) ||
    (partida.fase === 'resultado' && (partida.casilla === null || partida.ultimoAcierto === null || fueraDeLaPartida)) ||
    (partida.fase === 'victoria' && !haGanado(partida.parejas[partida.turno], modo, temas))
  if (turnoRoto) {
    Object.assign(partida, {
      fase: 'turno',
      casilla: null,
      cartaId: null,
      cartaDeOtroTema: false,
      mazoReiniciado: false,
      pistaUsada: false,
      cambioUsado: false,
      ultimoAcierto: null,
    } satisfies Partial<Partida>)
  }
  return partida
}
