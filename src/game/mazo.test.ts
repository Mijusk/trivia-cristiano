import { describe, expect, it } from 'vitest'
import type { Nivel, Prueba, Tema } from '../types'
import { TEMAS_BIBLICOS } from './config'
import { CARTAS, cartaPermitida, cartaPorId, existeCarta, sacarCarta } from './mazo'

/** Ids de las cartas de una prueba y nivel, sin las del Camino (que por defecto no salen). */
const ids = (prueba: Prueba, nivel: Nivel, tema?: Tema) =>
  CARTAS.filter((c) => c.prueba === prueba && c.nivel === nivel && !c.camino && (!tema || c.tema === tema)).map(
    (c) => c.id,
  )

describe('banco de cartas', () => {
  it('las cartas del Camino son todas de Vida Cristiana', () => {
    const delCamino = CARTAS.filter((c) => c.camino)
    expect(delCamino.length).toBeGreaterThan(0)
    expect(delCamino.every((c) => c.tema === 'vida')).toBe(true)
  })

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
      const otra = sacarCarta('pentateuco', 'pregunta', 'experta', primera.usadas, { evitar: primera.carta.id })
      expect(otra.carta.id).not.toBe(primera.carta.id)
    }
  })

  it('al cambiar la última carta libre, el mazo empieza de nuevo sin devolver la que se cambia', () => {
    const delNivel = ids('describir', 'peques')
    const ultima = delNivel[0]
    for (let i = 0; i < 100; i++) {
      const s = sacarCarta('pentateuco', 'describir', 'peques', delNivel, { evitar: ultima })
      expect(s.reiniciado).toBe(true)
      expect(s.carta.id).not.toBe(ultima)
      // La que se cambia sigue usada: ya la ha visto alguien.
      expect(s.usadas).toContain(ultima)
    }
  })

  it('las alternativas nunca salen de los temas de la partida', () => {
    const temas: Tema[] = ['nt', 'vida']
    let usadas: string[] = []
    for (let i = 0; i < 200; i++) {
      const s = sacarCarta('nt', 'mimica', 'media', usadas, { temas })
      expect(temas).toContain(s.carta.tema)
      usadas = s.usadas
    }
  })

  it('con un solo tema, el mazo se reinicia con las cartas de ese tema', () => {
    const delTema = ids('pregunta', 'peques', 'vida')
    let usadas: string[] = []
    const vistas = new Set<string>()
    for (let i = 0; i < delTema.length; i++) {
      const s = sacarCarta('vida', 'pregunta', 'peques', usadas, { temas: ['vida'] })
      expect(s.deOtroTema).toBe(false)
      expect(s.reiniciado).toBe(false)
      usadas = s.usadas
      vistas.add(s.carta.id)
    }
    expect([...vistas].sort()).toEqual([...delTema].sort())
    expect(sacarCarta('vida', 'pregunta', 'peques', usadas, { temas: ['vida'] }).reiniciado).toBe(true)
  })

  it('las cartas del Camino no salen si la partida no las incluye', () => {
    let usadas: string[] = []
    for (let i = 0; i < 300; i++) {
      const s = sacarCarta('vida', 'describir', 'media', usadas, { temas: ['vida'] })
      expect(s.carta.camino).toBeFalsy()
      usadas = s.usadas
    }
  })

  it('con el Camino incluido, sus cartas se mezclan con las de Vida Cristiana', () => {
    const todas = CARTAS.filter((c) => c.tema === 'vida' && c.prueba === 'mimica' && c.nivel === 'peques')
    let usadas: string[] = []
    const vistas = new Set<string>()
    for (let i = 0; i < todas.length; i++) {
      const s = sacarCarta('vida', 'mimica', 'peques', usadas, { temas: ['vida'], incluirCamino: true })
      usadas = s.usadas
      vistas.add(s.carta.id)
    }
    // Sin repetir han salido todas, las generales y las del Camino.
    expect(vistas.size).toBe(todas.length)
    expect([...vistas].some((id) => cartaPorId(id)!.camino)).toBe(true)
    expect([...vistas].some((id) => !cartaPorId(id)!.camino)).toBe(true)
  })

  it('cartaPermitida: el Camino solo con Vida Cristiana y la opción encendida', () => {
    const delCamino = CARTAS.find((c) => c.camino)!
    const general = CARTAS.find((c) => c.tema === 'vida' && !c.camino)!
    expect(cartaPermitida(delCamino, ['vida'], true)).toBe(true)
    expect(cartaPermitida(delCamino, ['vida'], false)).toBe(false)
    expect(cartaPermitida(delCamino, TEMAS_BIBLICOS, true)).toBe(false)
    expect(cartaPermitida(general, ['vida'], false)).toBe(true)
    expect(cartaPermitida(general, TEMAS_BIBLICOS, false)).toBe(false)
  })

  it('falla si la prueba no tiene cartas', () => {
    expect(() => sacarCarta('nt', 'cantar' as Prueba, 'peques', [])).toThrow('No hay cartas de cantar')
  })
})
