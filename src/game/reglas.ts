import type { Casilla, CasillaKey, Modo, Pareja, Tema } from '../types'
import { META_POR_TEMA, PRUEBAS, TEMAS } from './config'

export const claveCasilla = (c: Casilla): CasillaKey => `${c.tema}:${c.prueba}`

export function progresoTema(pareja: Pareja, tema: Tema): number {
  return pareja.ganadas.filter((k) => k.startsWith(`${tema}:`)).length
}

export function temaCompleto(pareja: Pareja, tema: Tema, modo: Modo): boolean {
  return progresoTema(pareja, tema) >= META_POR_TEMA[modo]
}

/**
 * Casillas que todavía puede ganar la pareja: las de los temas que aún no ha
 * completado y que no haya ganado ya. Se ordenan por prueba y luego por tema
 * para que en la ruleta los colores de los temas se vayan alternando.
 */
export function casillasPendientes(pareja: Pareja, modo: Modo): Casilla[] {
  const pendientes: Casilla[] = []
  for (const prueba of PRUEBAS) {
    for (const tema of TEMAS) {
      const casilla = { tema, prueba }
      if (temaCompleto(pareja, tema, modo)) continue
      if (pareja.ganadas.includes(claveCasilla(casilla))) continue
      pendientes.push(casilla)
    }
  }
  return pendientes
}

export function haGanado(pareja: Pareja, modo: Modo): boolean {
  return TEMAS.every((tema) => temaCompleto(pareja, tema, modo))
}
