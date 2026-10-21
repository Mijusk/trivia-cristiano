import { describe, expect, it } from 'vitest'
import { TIEMPOS_POR_DEFECTO } from './config'
import { VERSION_PARTIDA, leerPartida, limpiarUsadas } from './guardado'

/** Una partida tal y como la guardaba la versión 1, a mitad de un turno. */
const partidaV1 = () => ({
  version: 1,
  fase: 'carta',
  modo: 'corta',
  parejas: [
    { id: 'a', nombre: 'Ana y Juan', nivel: 'peques', ganadas: ['nt:mimica'] },
    { id: 'b', nombre: 'Los abuelos', nivel: 'experta', ganadas: [] },
  ],
  turno: 1,
  casilla: { tema: 'profetas', prueba: 'pregunta' },
  cartaId: 'pregunta-60',
  cartaDeOtroTema: false,
  pistaUsada: true,
  cambioUsado: false,
  usadas: ['mimica-5', 'pregunta-60'],
  ultimoAcierto: null,
  tiempos: { pregunta: 30, actuar: 60, mimica: 90 },
})

describe('leerPartida: migración', () => {
  it('pasa una partida de v1 a la versión actual sin perder nada', () => {
    const p = leerPartida(partidaV1())
    expect(p).toEqual({ ...partidaV1(), version: VERSION_PARTIDA, mazoReiniciado: false })
  })

  it('una partida de la versión actual se lee igual', () => {
    const actual = { ...partidaV1(), version: VERSION_PARTIDA, mazoReiniciado: true }
    expect(leerPartida(actual)).toEqual(actual)
  })

  it('descarta versiones que no conoce', () => {
    expect(leerPartida({ ...partidaV1(), version: 0 })).toBeNull()
    expect(leerPartida({ ...partidaV1(), version: VERSION_PARTIDA + 1 })).toBeNull()
    expect(leerPartida({ ...partidaV1(), version: '1' })).toBeNull()
  })
})

describe('leerPartida: datos irrecuperables', () => {
  it.each([
    ['nada', null],
    ['un texto', 'hola'],
    ['una lista', []],
    ['un modo desconocido', { ...partidaV1(), modo: 'eterna' }],
    ['sin parejas', { ...partidaV1(), parejas: [] }],
    ['parejas que no son una lista', { ...partidaV1(), parejas: {} }],
    ['una pareja sin nombre', { ...partidaV1(), parejas: [{ id: 'a', nivel: 'media', ganadas: [] }] }],
    ['una pareja con nivel desconocido', { ...partidaV1(), parejas: [{ id: 'a', nombre: 'A', nivel: 'dios', ganadas: [] }] }],
  ])('devuelve null con %s', (_, datos) => {
    expect(leerPartida(datos)).toBeNull()
  })
})

describe('leerPartida: reparaciones', () => {
  it('quita quesitos inválidos o repetidos', () => {
    const datos = partidaV1()
    datos.parejas[0].ganadas = ['nt:mimica', 'nt:mimica', 'nt:cantar', 'cielo:pregunta', 7 as never]
    expect(leerPartida(datos)!.parejas[0].ganadas).toEqual(['nt:mimica'])
  })

  it('una pareja sin lista de quesitos empieza sin ninguno', () => {
    const datos = partidaV1() as Record<string, any>
    delete datos.parejas[1].ganadas
    expect(leerPartida(datos)!.parejas[1].ganadas).toEqual([])
  })

  it('quita de usadas las cartas borradas, lo que no es texto y los repetidos', () => {
    const datos = { ...partidaV1(), usadas: ['mimica-5', 'mimica-5', 'pregunta-99999', 3, null] }
    expect(leerPartida(datos)!.usadas).toEqual(['mimica-5'])
  })

  it('completa los tiempos que faltan o no valen', () => {
    const datos = { ...partidaV1(), tiempos: { pregunta: -4, actuar: 45 } }
    expect(leerPartida(datos)!.tiempos).toEqual({ pregunta: TIEMPOS_POR_DEFECTO.pregunta, actuar: 45, mimica: TIEMPOS_POR_DEFECTO.mimica })
    expect(leerPartida({ ...partidaV1(), tiempos: undefined })!.tiempos).toEqual(TIEMPOS_POR_DEFECTO)
  })

  it('un turno fuera de rango vuelve a la primera pareja', () => {
    expect(leerPartida({ ...partidaV1(), turno: 5 })!.turno).toBe(0)
    expect(leerPartida({ ...partidaV1(), turno: 0.5 })!.turno).toBe(0)
  })

  it('si la carta del turno ya no existe, se vuelve a girar la ruleta', () => {
    const p = leerPartida({ ...partidaV1(), cartaId: 'pregunta-99999' })!
    expect(p).toMatchObject({ fase: 'turno', casilla: null, cartaId: null, pistaUsada: false, cambioUsado: false })
    // El resto de la partida sigue igual.
    expect(p.turno).toBe(1)
    expect(p.parejas[0].ganadas).toEqual(['nt:mimica'])
  })

  it('un resultado sin acierto ni fallo vuelve a la ruleta', () => {
    expect(leerPartida({ ...partidaV1(), fase: 'resultado', ultimoAcierto: null })!.fase).toBe('turno')
    expect(leerPartida({ ...partidaV1(), fase: 'resultado', ultimoAcierto: true })!.fase).toBe('resultado')
  })

  it('una victoria de una pareja que no ha ganado se corrige', () => {
    expect(leerPartida({ ...partidaV1(), fase: 'victoria' })!.fase).toBe('turno')
  })

  it('una fase desconocida vuelve a la ruleta', () => {
    expect(leerPartida({ ...partidaV1(), fase: 'pausa' })!.fase).toBe('turno')
  })
})

describe('limpiarUsadas', () => {
  it('se queda solo con ids de cartas que existen', () => {
    expect(limpiarUsadas(['dibujar-1', 'dibujar-1', 'dibujar-99999', 1])).toEqual(['dibujar-1'])
  })

  it('cualquier otra cosa da una lista vacía', () => {
    expect(limpiarUsadas(null)).toEqual([])
    expect(limpiarUsadas({ 0: 'dibujar-1' })).toEqual([])
  })
})
