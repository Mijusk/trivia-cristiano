import { describe, expect, it } from 'vitest'
import type { CasillaKey, Pareja } from '../types'
import { PRUEBAS, TEMAS } from './config'
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
  it('al empezar están las 16 casillas', () => {
    expect(casillasPendientes(pareja(), 'completa')).toHaveLength(16)
  })

  it('quita las casillas ganadas y los temas ya completos', () => {
    const p = pareja(['nt:pregunta', 'profetas:dibujar'])
    const media = casillasPendientes(p, 'media').map(claveCasilla)
    expect(media).toHaveLength(14)
    expect(media).not.toContain('nt:pregunta')

    // En corta basta un quesito: nt y profetas salen enteros de la ruleta.
    const corta = casillasPendientes(p, 'corta')
    expect(corta).toHaveLength(8)
    expect(corta.every((c) => c.tema !== 'nt' && c.tema !== 'profetas')).toBe(true)
  })

  it('alterna los colores: ordena por prueba y dentro por tema', () => {
    const orden = casillasPendientes(pareja(), 'completa').map(claveCasilla)
    expect(orden.slice(0, 4)).toEqual(TEMAS.map((t) => `${t}:${PRUEBAS[0]}`))
  })
})

describe('haGanado', () => {
  it('gana al completar los cuatro temas', () => {
    const uno = pareja(TEMAS.map((t) => `${t}:pregunta` as CasillaKey))
    expect(haGanado(uno, 'corta')).toBe(true)
    expect(haGanado(uno, 'media')).toBe(false)
  })

  it('en completa hacen falta las 16 casillas', () => {
    const todas = TEMAS.flatMap((t) => PRUEBAS.map((p) => `${t}:${p}` as CasillaKey))
    expect(haGanado(pareja(todas.slice(1)), 'completa')).toBe(false)
    expect(haGanado(pareja(todas), 'completa')).toBe(true)
  })
})
