import type { Carta } from '../types'
import { INFO_NIVEL, INFO_PRUEBA, INFO_TEMA } from './config'
import { cartaPorId, existeCarta } from './mazo'

/** Por qué se avisa de una carta. */
export type Motivo = 'dato' | 'respuesta' | 'redaccion' | 'repetida' | 'otro'

export const MOTIVOS: Motivo[] = ['dato', 'respuesta', 'redaccion', 'repetida', 'otro']

export const INFO_MOTIVO: Record<Motivo, string> = {
  dato: 'Tiene un dato incorrecto',
  respuesta: 'La respuesta es dudosa o hay más de una correcta',
  redaccion: 'Está mal redactada o se entiende mal',
  repetida: 'Está repetida o se parece mucho a otra',
  otro: 'Otro motivo',
}

/** Una carta marcada durante la partida para revisarla después. */
export interface Aviso {
  cartaId: string
  motivo: Motivo
  comentario: string
  /** Cuándo se avisó, en ISO. */
  fecha: string
}

export const MAX_COMENTARIO = 300

/**
 * Lee los avisos guardados. Descarta los que no tienen la forma esperada y los de cartas que ya
 * no existen, y deja uno por carta (el último).
 */
export function leerAvisos(datos: unknown): Aviso[] {
  if (!Array.isArray(datos)) return []
  const porCarta = new Map<string, Aviso>()
  for (const a of datos) {
    if (!a || typeof a !== 'object') continue
    const { cartaId, motivo, comentario, fecha } = a as Record<string, unknown>
    if (typeof cartaId !== 'string' || !existeCarta(cartaId)) continue
    if (!MOTIVOS.includes(motivo as Motivo)) continue
    porCarta.delete(cartaId)
    porCarta.set(cartaId, {
      cartaId,
      motivo: motivo as Motivo,
      comentario: typeof comentario === 'string' ? comentario.slice(0, MAX_COMENTARIO) : '',
      fecha: typeof fecha === 'string' ? fecha : '',
    })
  }
  return [...porCarta.values()]
}

/** El texto que identifica la carta: la pregunta con su respuesta, o lo que hay que adivinar. */
export function textoCarta(c: Carta): string {
  if (c.prueba === 'pregunta') return `${c.pregunta} → ${c.respuesta}`
  if (c.prueba === 'describir') return c.palabra
  return c.adivinar
}

/** Lista para copiar o compartir: una línea por aviso, con lo necesario para encontrar la carta. */
export function exportarAvisos(avisos: Aviso[]): string {
  const lineas = avisos.flatMap((a) => {
    const c = cartaPorId(a.cartaId)
    if (!c) return []
    const donde = [c.id, INFO_TEMA[c.tema].nombre, INFO_PRUEBA[c.prueba].nombre, INFO_NIVEL[c.nivel].nombre].join(' · ')
    const comentario = a.comentario.trim() ? `: ${a.comentario.trim()}` : ''
    return [`[${donde}] ${textoCarta(c)} — ${INFO_MOTIVO[a.motivo]}${comentario}`]
  })
  return [`Trivia Cristiano · cartas con aviso (${lineas.length})`, '', ...lineas].join('\n')
}
