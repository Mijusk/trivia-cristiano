import { describe, expect, it } from 'vitest'
import type { CasillaKey, Pareja } from '../types'
import { PRUEBAS, TEMAS, TEMAS_BIBLICOS as BIBLICOS } from './config'
import { casillasPendientes, claveCasilla, haGanado, progresoTema, temaCompleto } from './reglas'

const pareja = (ganadas: CasillaKey[] = []): Pareja => ({ id: 'p', nombre: 'P', nivel: 'media', ganadas })

describe('claveCasilla', () => {
  it('junta tema y prueba', () => {
    expect(claveCasilla({ tema: 'nt', prueba: 'mimica' })).toBe('nt:mimica')
  })
})

describe('progresoTema y temaCompleto', () => {
  it('cuenta solo los quesitos de ese tema', () => {
    const p = pareja(['nt:pregunta', 'nt:mimica', 'profetas:pregunta'])
    expect(progresoTema(p, 'nt')).toBe(2)
    expect(progresoTema(p, 'profetas')).toBe(1)
    expect(progresoTema(p, 'pentateuco')).toBe(0)
  })

  it('la meta depende del modo: 1, 2 o 4 por tema', () => {
    const p = pareja(['nt:pregunta', 'nt:mimica'])
    expect(temaCompleto(p, 'nt', 'corta')).toBe(true)
    expect(temaCompleto(p, 'nt', 'media')).toBe(true)
    expect(temaCompleto(p, 'nt', 'completa')).toBe(false)
  })
})

describe('casillasPendientes', () => {
  it('al empezar están todas las casillas de los temas de la partida', () => {
    expect(casillasPendientes(pareja(), 'completa', BIBLICOS)).toHaveLength(16)
    expect(casillasPendientes(pareja(), 'completa', TEMAS)).toHaveLength(20)
    expect(casillasPendientes(pareja(), 'completa', ['vida'])).toHaveLength(4)
  })

  it('solo salen casillas de los temas elegidos', () => {
    const casillas = casillasPendientes(pareja(), 'corta', ['nt', 'vida'])
    expect(new Set(casillas.map((c) => c.tema))).toEqual(new Set(['nt', 'vida']))
    expect(casillas).toHaveLength(8)
  })

  it('quita las casillas ganadas y los temas ya completos', () => {
    const p = pareja(['nt:pregunta', 'profetas:dibujar'])
    const media = casillasPendientes(p, 'media', BIBLICOS).map(claveCasilla)
    expect(media).toHaveLength(14)
    expect(media).not.toContain('nt:pregunta')

    // En corta basta un quesito: nt y profetas salen enteros de la ruleta.
    const corta = casillasPendientes(p, 'corta', BIBLICOS)
    expect(corta).toHaveLength(8)
    expect(corta.every((c) => c.tema !== 'nt' && c.tema !== 'profetas')).toBe(true)
  })

  it('alterna los colores: ordena por prueba y dentro por tema', () => {
    const orden = casillasPendientes(pareja(), 'completa', TEMAS).map(claveCasilla)
    expect(orden.slice(0, 5)).toEqual(TEMAS.map((t) => `${t}:${PRUEBAS[0]}`))
  })
})

describe('haGanado', () => {
  it('gana al completar los temas de la partida', () => {
    const uno = pareja(BIBLICOS.map((t) => `${t}:pregunta` as CasillaKey))
    expect(haGanado(uno, 'corta', BIBLICOS)).toBe(true)
    expect(haGanado(uno, 'media', BIBLICOS)).toBe(false)
  })

  it('jugando con Vida Cristiana también hay que completarla', () => {
    const p = pareja(BIBLICOS.map((t) => `${t}:pregunta` as CasillaKey))
    expect(haGanado(p, 'corta', TEMAS)).toBe(false)
    p.ganadas.push('vida:mimica')
    expect(haGanado(p, 'corta', TEMAS)).toBe(true)
  })

  it('jugando con un solo tema basta con ese', () => {
    expect(haGanado(pareja(['vida:dibujar']), 'corta', ['vida'])).toBe(true)
    expect(haGanado(pareja(['nt:dibujar']), 'corta', ['vida'])).toBe(false)
  })

  it('en completa hacen falta todas las casillas', () => {
    const todas = TEMAS.flatMap((t) => PRUEBAS.map((p) => `${t}:${p}` as CasillaKey))
    expect(haGanado(pareja(todas.slice(1)), 'completa', TEMAS)).toBe(false)
    expect(haGanado(pareja(todas), 'completa', TEMAS)).toBe(true)
  })

  it('sin temas no gana nadie', () => {
    expect(haGanado(pareja(), 'corta', [])).toBe(false)
  })
})
