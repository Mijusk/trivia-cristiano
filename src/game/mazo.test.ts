import { describe, expect, it } from 'vitest'
import type { Nivel, Prueba, Tema } from '../types'
import { CARTAS, cartaPorId, existeCarta, sacarCarta } from './mazo'

const ids = (prueba: Prueba, nivel: Nivel, tema?: Tema) =>
  CARTAS.filter((c) => c.prueba === prueba && c.nivel === nivel && (!tema || c.tema === tema)).map((c) => c.id)

describe('banco de cartas', () => {
  it('cada carta tiene un id único con el formato <prueba>-<número>', () => {
    expect(new Set(CARTAS.map((c) => c.id)).size).toBe(CARTAS.length)
    for (const c of CARTAS) expect(c.id).toMatch(new RegExp(`^${c.prueba}-\\d+$`))
  })

  it('busca por id', () => {
    expect(cartaPorId('pregunta-0')?.prueba).toBe('pregunta')
    expect(cartaPorId('pregunta-99999')).toBeUndefined()
    expect(cartaPorId(null)).toBeUndefined()
    expect(existeCarta('mimica-0')).toBe(true)
    expect(existeCarta('mimica-99999')).toBe(false)
  })
})

describe('sacarCarta', () => {
  it('saca una carta del tema, la prueba y el nivel pedidos y la apunta como usada', () => {
    const s = sacarCarta('nt', 'pregunta', 'peques', [])
    expect(s.carta).toMatchObject({ tema: 'nt', prueba: 'pregunta', nivel: 'peques' })
    expect(s.deOtroTema).toBe(false)
    expect(s.reiniciado).toBe(false)
    expect(s.usadas).toEqual([s.carta.id])
  })

  it('no modifica la lista de usadas que recibe', () => {
    const usadas = ['pregunta-0']
    sacarCarta('nt', 'pregunta', 'peques', usadas)
    expect(usadas).toEqual(['pregunta-0'])
  })

  it('no repite ninguna carta hasta agotar la prueba y el nivel', () => {
    const total = ids('describir', 'media').length
    let usadas: string[] = []
    const vistas = new Set<string>()
    for (let i = 0; i < total; i++) {
      const s = sacarCarta('historicos', 'describir', 'media', usadas)
      expect(s.reiniciado).toBe(false)
      usadas = s.usadas
      vistas.add(s.carta.id)
    }
    expect(vistas.size).toBe(total)
  })

  it('sin cartas libres del tema, saca otra del mismo nivel de otro tema', () => {
    const s = sacarCarta('nt', 'mimica', 'peques', ids('mimica', 'peques', 'nt'))
    expect(s.deOtroTema).toBe(true)
    expect(s.carta).toMatchObject({ prueba: 'mimica', nivel: 'peques' })
    expect(s.carta.tema).not.toBe('nt')
    expect(s.reiniciado).toBe(false)
  })

  it('al agotar la prueba y el nivel, el mazo vuelve a empezar sin olvidar los otros niveles', () => {
    const otras = [...ids('mimica', 'media'), ...ids('pregunta', 'peques')]
    const s = sacarCarta('nt', 'mimica', 'peques', [...ids('mimica', 'peques'), ...otras])
    expect(s.reiniciado).toBe(true)
    expect(s.deOtroTema).toBe(false)
    expect(s.usadas).toEqual([...otras, s.carta.id])
  })

  it('las usadas nunca crecen más que el banco de la prueba y el nivel', () => {
    const total = ids('dibujar', 'experta').length
    let usadas: string[] = []
    let reinicios = 0
    for (let i = 0; i < total * 3; i++) {
      const s = sacarCarta('profetas', 'dibujar', 'experta', usadas)
      usadas = s.usadas
      if (s.reiniciado) reinicios++
      expect(usadas.length).toBeLessThanOrEqual(total)
    }
    expect(reinicios).toBe(2)
  })

  it('al cambiar de carta nunca sale la misma', () => {
    for (let i = 0; i < 300; i++) {
      const primera = sacarCarta('pentateuco', 'pregunta', 'experta', [])
      const otra = sacarCarta('pentateuco', 'pregunta', 'experta', primera.usadas, primera.carta.id)
      expect(otra.carta.id).not.toBe(primera.carta.id)
    }
  })

  it('al cambiar la última carta libre, el mazo empieza de nuevo sin devolver la que se cambia', () => {
    const delNivel = ids('describir', 'peques')
    const ultima = delNivel[0]
    for (let i = 0; i < 100; i++) {
      const s = sacarCarta('pentateuco', 'describir', 'peques', delNivel, ultima)
      expect(s.reiniciado).toBe(true)
      expect(s.carta.id).not.toBe(ultima)
      // La que se cambia sigue usada: ya la ha visto alguien.
      expect(s.usadas).toContain(ultima)
    }
  })

  it('falla si la prueba no tiene cartas', () => {
    expect(() => sacarCarta('nt', 'cantar' as Prueba, 'peques', [])).toThrow('No hay cartas de cantar')
  })
})
