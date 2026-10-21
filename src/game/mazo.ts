import type { Carta, CartaDescribir, CartaDibujar, CartaMimica, CartaPregunta, Nivel, Prueba, Tema } from '../types'
import { TEMAS } from './config'
import preguntas from '../data/preguntas.json'
import dibujar from '../data/dibujar.json'
import describir from '../data/describir.json'
import mimica from '../data/mimica.json'

type SinPrueba<T> = Omit<T, 'prueba'>

/** Cada carta trae su `id` fijo en el JSON, así no cambia aunque se reordene o se borre otra. */
function conPrueba<T extends Carta>(prueba: T['prueba'], lista: SinPrueba<T>[]): T[] {
  return lista.map((c) => ({ ...c, prueba }) as unknown as T)
}

export const CARTAS: Carta[] = [
  ...conPrueba<CartaPregunta>('pregunta', preguntas as unknown as SinPrueba<CartaPregunta>[]),
  ...conPrueba<CartaDibujar>('dibujar', dibujar as unknown as SinPrueba<CartaDibujar>[]),
  ...conPrueba<CartaDescribir>('describir', describir as unknown as SinPrueba<CartaDescribir>[]),
  ...conPrueba<CartaMimica>('mimica', mimica as unknown as SinPrueba<CartaMimica>[]),
]

const POR_ID = new Map<string, Carta>(CARTAS.map((c) => [c.id, c] as const))

export const cartaPorId = (id: string | null): Carta | undefined => (id ? POR_ID.get(id) : undefined)

export const existeCarta = (id: string): boolean => POR_ID.has(id)

const azar = <T>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)]

export interface CartaSacada {
  carta: Carta
  /** La carta es de otro tema porque no quedaban sin usar del tema pedido. */
  deOtroTema: boolean
  /** Ya habían salido todas las cartas de esta prueba y nivel, así que el mazo ha vuelto a empezar. */
  reiniciado: boolean
  /** Lista de usadas tras sacar la carta (sin las del mazo reiniciado y con la nueva). */
  usadas: string[]
}

export interface OpcionesMazo {
  /** La carta que se está cambiando, para que no vuelva a salir. */
  evitar?: string | null
  /** Temas de la partida: las cartas de otros temas no salen nunca. Por defecto, todos. */
  temas?: Tema[]
  /** Mezclar las cartas del Camino Neocatecumenal. Por defecto, no. */
  incluirCamino?: boolean
}

/** La carta puede salir en una partida con estos temas y esta opción del Camino. */
export function cartaPermitida(carta: Carta, temas: Tema[], incluirCamino: boolean): boolean {
  return temas.includes(carta.tema) && (incluirCamino || !carta.camino)
}

/**
 * Saca una carta para el tema, la prueba y el nivel pedidos, siempre de los
 * temas de la partida. Busca por orden: una sin usar del tema, una sin usar del
 * mismo nivel en otro tema de la partida y, si no hay cartas de ese nivel,
 * cualquiera de la prueba. Cuando ya han salido todas las de la prueba y el
 * nivel, se olvidan esas usadas y el mazo vuelve a empezar.
 */
export function sacarCarta(
  tema: Tema,
  prueba: Prueba,
  nivel: Nivel,
  usadas: string[],
  { evitar = null, temas = TEMAS, incluirCamino = false }: OpcionesMazo = {},
): CartaSacada {
  const permitidas = CARTAS.filter((c) => c.prueba === prueba && cartaPermitida(c, temas, incluirCamino))
  let deLaPrueba = permitidas.filter((c) => c.id !== evitar)
  // Si la que se cambia es la única carta de la prueba, no queda otra que repetirla.
  if (deLaPrueba.length === 0) deLaPrueba = permitidas
  if (deLaPrueba.length === 0) throw new Error(`No hay cartas de ${prueba}`)

  const delNivel = new Set(deLaPrueba.filter((c) => c.nivel === nivel).map((c) => c.id))
  let usada = new Set(usadas)
  let reiniciado = false
  if (delNivel.size > 0 && [...delNivel].every((id) => usada.has(id))) {
    usadas = usadas.filter((id) => !delNivel.has(id))
    usada = new Set(usadas)
    reiniciado = true
  }

  const intentos: Carta[][] = [
    deLaPrueba.filter((c) => c.tema === tema && c.nivel === nivel && !usada.has(c.id)),
    deLaPrueba.filter((c) => c.nivel === nivel && !usada.has(c.id)),
    deLaPrueba,
  ]
  const opciones = intentos.find((lista) => lista.length > 0)!
  const carta = azar(opciones)
  return { carta, deOtroTema: carta.tema !== tema, reiniciado, usadas: [...usadas, carta.id] }
}
