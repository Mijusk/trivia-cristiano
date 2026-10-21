import { describe, expect, it } from 'vitest'
import { TEMAS, TEMAS_BIBLICOS, TIEMPOS_POR_DEFECTO } from './config'
import { VERSION_PARTIDA, leerPartida, limpiarUsadas } from './guardado'
import { CARTAS } from './mazo'

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

/** La misma partida guardada con la versión actual, jugando con los cinco temas y dibujando en la pantalla. */
const partidaActual = () => ({
  ...partidaV1(),
  version: VERSION_PARTIDA,
  mazoReiniciado: true,
  temas: [...TEMAS],
  incluirCamino: true,
  dibujarEn: 'pantalla',
})

describe('leerPartida: migración', () => {
  it('pasa una partida de v1 a la versión actual sin perder nada', () => {
    const p = leerPartida(partidaV1())
    expect(p).toEqual({
      ...partidaV1(),
      version: VERSION_PARTIDA,
      mazoReiniciado: false,
      temas: TEMAS_BIBLICOS,
      incluirCamino: false,
      dibujarEn: 'papel',
    })
  })

  it('una partida de v2 (sin elegir temas) se juega con los cuatro bíblicos y sin el Camino', () => {
    const p = leerPartida({ ...partidaV1(), version: 2, mazoReiniciado: true })
    expect(p).toEqual({
      ...partidaV1(),
      version: VERSION_PARTIDA,
      mazoReiniciado: true,
      temas: TEMAS_BIBLICOS,
      incluirCamino: false,
      dibujarEn: 'papel',
    })
  })

  it('una partida de v3 (antes de la pizarra) se sigue dibujando en papel', () => {
    const { dibujarEn: _, ...v3 } = { ...partidaActual(), version: 3 }
    expect(leerPartida(v3)).toEqual({ ...partidaActual(), dibujarEn: 'papel' })
  })

  it('si no se entiende dónde se dibuja, se dibuja en papel', () => {
    expect(leerPartida({ ...partidaActual(), dibujarEn: 'pared' })?.dibujarEn).toBe('papel')
  })

  it('una partida de la versión actual se lee igual', () => {
    const actual = partidaActual()
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

describe('leerPartida: temas y Camino', () => {
  it('ordena los temas y quita los que no existen o se repiten', () => {
    const p = leerPartida({ ...partidaActual(), temas: ['vida', 'nt', 'cielo', 'vida', 'profetas'] })!
    expect(p.temas).toEqual(['profetas', 'nt', 'vida'])
  })

  it('sin temas válidos se juega con los cuatro bíblicos', () => {
    for (const temas of [[], ['cielo'], 'vida', undefined])
      expect(leerPartida({ ...partidaActual(), temas, incluirCamino: false })!.temas).toEqual(TEMAS_BIBLICOS)
  })

  it('el Camino se apaga si no se juega con Vida Cristiana', () => {
    expect(leerPartida({ ...partidaActual(), temas: ['nt'], incluirCamino: true })!.incluirCamino).toBe(false)
    expect(leerPartida({ ...partidaActual(), temas: ['vida'], incluirCamino: 'sí' })!.incluirCamino).toBe(false)
  })

  it('una casilla de un tema que no está en la partida vuelve a la ruleta', () => {
    const p = leerPartida({ ...partidaActual(), temas: ['nt', 'vida'] })!
    expect(p).toMatchObject({ fase: 'turno', casilla: null, cartaId: null })
  })

  it('una carta del Camino en una partida sin el Camino vuelve a la ruleta', () => {
    const delCamino = CARTAS.find((c) => c.camino && c.prueba === 'pregunta')!
    const datos = {
      ...partidaActual(),
      casilla: { tema: 'vida', prueba: 'pregunta' },
      cartaId: delCamino.id,
    }
    expect(leerPartida(datos)!.fase).toBe('carta')
    expect(leerPartida({ ...datos, incluirCamino: false })!.fase).toBe('turno')
  })

  it('una victoria se comprueba con los temas de la partida', () => {
    const datos = { ...partidaActual(), fase: 'victoria', turno: 0, temas: ['nt'] }
    // La pareja 0 tiene nt:mimica: en corta, con solo el Nuevo Testamento, ha ganado.
    expect(leerPartida(datos)!.fase).toBe('victoria')
    expect(leerPartida({ ...datos, temas: ['nt', 'vida'] })!.fase).toBe('turno')
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
