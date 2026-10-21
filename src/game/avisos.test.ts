import { describe, expect, it, vi } from 'vitest'
import { INFO_MOTIVO, MAX_COMENTARIO, datosEnvio, enviarAviso, exportarAvisos, leerAvisos, textoCarta, type Aviso } from './avisos'
import { INFO_NIVEL, INFO_TEMA } from './config'
import { CARTAS } from './mazo'

const pregunta = CARTAS.find((c) => c.prueba === 'pregunta')!
const describir = CARTAS.find((c) => c.prueba === 'describir')!
const dibujar = CARTAS.find((c) => c.prueba === 'dibujar')!

const aviso = (cartaId: string, extra: Partial<Aviso> = {}): Aviso => ({
  cartaId,
  motivo: 'dato',
  comentario: '',
  fecha: '2026-10-21T10:00:00.000Z',
  enviado: false,
  ...extra,
})

describe('leerAvisos', () => {
  it('lee una lista válida', () => {
    const lista = [aviso(pregunta.id), aviso(dibujar.id, { motivo: 'otro', comentario: 'Hola' })]
    expect(leerAvisos(lista)).toEqual(lista)
  })

  it('devuelve una lista vacía si lo guardado no es una lista', () => {
    expect(leerAvisos(null)).toEqual([])
    expect(leerAvisos({ cartaId: pregunta.id })).toEqual([])
    expect(leerAvisos('texto')).toEqual([])
  })

  it('descarta los avisos de cartas que ya no existen o con un motivo desconocido', () => {
    const lista = [aviso('pregunta-99999'), aviso(pregunta.id, { motivo: 'raro' as never }), 7, null, aviso(dibujar.id)]
    expect(leerAvisos(lista)).toEqual([aviso(dibujar.id)])
  })

  it('deja un solo aviso por carta, el último', () => {
    const lista = [aviso(pregunta.id), aviso(dibujar.id), aviso(pregunta.id, { motivo: 'redaccion' })]
    expect(leerAvisos(lista)).toEqual([aviso(dibujar.id), aviso(pregunta.id, { motivo: 'redaccion' })])
  })

  it('arregla comentarios y fechas que no son texto y recorta los largos', () => {
    const [a] = leerAvisos([{ cartaId: pregunta.id, motivo: 'dato', comentario: 3, fecha: null }])
    expect(a).toEqual({ cartaId: pregunta.id, motivo: 'dato', comentario: '', fecha: '', enviado: false })
    const [b] = leerAvisos([aviso(pregunta.id, { comentario: 'x'.repeat(MAX_COMENTARIO + 50) })])
    expect(b.comentario).toHaveLength(MAX_COMENTARIO)
  })
})

describe('textoCarta', () => {
  it('da la pregunta con su respuesta, la palabra o lo que hay que adivinar', () => {
    if (pregunta.prueba !== 'pregunta' || describir.prueba !== 'describir' || dibujar.prueba !== 'dibujar') throw new Error()
    expect(textoCarta(pregunta)).toBe(`${pregunta.pregunta} → ${pregunta.respuesta}`)
    expect(textoCarta(describir)).toBe(describir.palabra)
    expect(textoCarta(dibujar)).toBe(dibujar.adivinar)
  })
})

describe('exportarAvisos', () => {
  it('pone una línea por aviso con el id, el tema, la prueba, el nivel, el motivo y el comentario', () => {
    const texto = exportarAvisos([aviso(dibujar.id, { comentario: '  Falta un dato  ' }), aviso(describir.id, { motivo: 'repetida' })])
    const lineas = texto.split('\n')
    expect(lineas[0]).toBe('Trivia Cristiano · cartas con aviso (2)')
    expect(lineas[2]).toMatch(new RegExp(`^\\[${dibujar.id} · .+ · Dibujar · .+\\] `))
    expect(lineas[2]).toContain(textoCarta(dibujar))
    expect(lineas[2]).toMatch(new RegExp(`— ${INFO_MOTIVO.dato}: Falta un dato$`))
    expect(lineas[3]).toMatch(new RegExp(`— ${INFO_MOTIVO.repetida}$`))
  })

  it('se salta los avisos de cartas que ya no existen', () => {
    expect(exportarAvisos([aviso('mimica-99999')])).toBe('Trivia Cristiano · cartas con aviso (0)\n')
  })
})

describe('envío a la hoja de avisos', () => {
  it('manda los datos para encontrar la carta, con textos legibles', () => {
    expect(datosEnvio(aviso(dibujar.id, { motivo: 'repetida', comentario: 'Igual que otra' }))).toEqual({
      cartaId: dibujar.id,
      tema: INFO_TEMA[dibujar.tema].nombre,
      prueba: 'Dibujar',
      nivel: INFO_NIVEL[dibujar.nivel].nombre,
      texto: textoCarta(dibujar),
      referencia: dibujar.referencia ?? '',
      motivo: INFO_MOTIVO.repetida,
      comentario: 'Igual que otra',
      fecha: '2026-10-21T10:00:00.000Z',
    })
    expect(datosEnvio(aviso('dibujar-99999'))).toBeNull()
  })

  it('hace un POST de texto (sin cabeceras que pidan permiso a Google) y da true si sale', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetch)
    expect(await enviarAviso(aviso(pregunta.id), 'https://script.example/exec')).toBe(true)
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe('https://script.example/exec')
    expect(opciones).toMatchObject({ method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
    expect(JSON.parse(opciones.body)).toMatchObject({ cartaId: pregunta.id, motivo: INFO_MOTIVO.dato })
    vi.unstubAllGlobals()
  })

  it('da false sin conexión, sin URL o si la carta ya no existe', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetch)
    expect(await enviarAviso(aviso(pregunta.id), 'https://script.example/exec')).toBe(false)
    expect(await enviarAviso(aviso(pregunta.id), '')).toBe(false)
    expect(await enviarAviso(aviso('pregunta-99999'), 'https://script.example/exec')).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
