import type { Carta, CartaDescribir, CartaDibujar, CartaMimica, CartaPregunta, Nivel, Prueba, Tema } from '../types'
import preguntas from '../data/preguntas.json'
import dibujar from '../data/dibujar.json'
import describir from '../data/describir.json'
import mimica from '../data/mimica.json'

type SinId<T> = Omit<T, 'id' | 'prueba'>

function conIds<T extends Carta>(prueba: T['prueba'], lista: SinId<T>[]): T[] {
  return lista.map((c, i) => ({ ...c, prueba, id: `${prueba}-${i}` }) as unknown as T)
}

export const CARTAS: Carta[] = [
  ...conIds<CartaPregunta>('pregunta', preguntas as unknown as SinId<CartaPregunta>[]),
  ...conIds<CartaDibujar>('dibujar', dibujar as unknown as SinId<CartaDibujar>[]),
  ...conIds<CartaDescribir>('describir', describir as unknown as SinId<CartaDescribir>[]),
  ...conIds<CartaMimica>('mimica', mimica as unknown as SinId<CartaMimica>[]),
]

const POR_ID = new Map<string, Carta>(CARTAS.map((c) => [c.id, c] as const))

export const cartaPorId = (id: string | null): Carta | undefined => (id ? POR_ID.get(id) : undefined)

const azar = <T>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)]

/**
 * Saca una carta para el tema, la prueba y el nivel pedidos. Si ya se han
 * usado todas, busca por orden: otra sin usar del mismo nivel en otro tema,
 * una repetida del tema pedido y, como último recurso, cualquiera de la prueba.
 */
export function sacarCarta(
  tema: Tema,
  prueba: Prueba,
  nivel: Nivel,
  usadas: string[],
): { carta: Carta; deOtroTema: boolean } {
  const usada = new Set(usadas)
  const deLaPrueba = CARTAS.filter((c) => c.prueba === prueba)
  const intentos: Carta[][] = [
    deLaPrueba.filter((c) => c.tema === tema && c.nivel === nivel && !usada.has(c.id)),
    deLaPrueba.filter((c) => c.nivel === nivel && !usada.has(c.id)),
    deLaPrueba.filter((c) => c.tema === tema && c.nivel === nivel),
    deLaPrueba.filter((c) => c.nivel === nivel),
    deLaPrueba,
  ]
  const opciones = intentos.find((lista) => lista.length > 0) ?? []
  if (opciones.length === 0) throw new Error(`No hay cartas de ${prueba}`)
  const carta = azar(opciones)
  return { carta, deOtroTema: carta.tema !== tema }
}
