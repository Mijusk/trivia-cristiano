import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { CARTAS } from '../game/mazo'
import { useAvisosStore } from './avisos'

const CLAVE = 'trivia-cristiano/avisos/v1'
const [A, B] = CARTAS.map((c) => c.id)

/** localStorage en memoria: en Node no existe. */
function almacenEnMemoria() {
  const datos = new Map<string, string>()
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, String(v)),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
  }
}

let almacen: ReturnType<typeof almacenEnMemoria>

/** Crea el store desde cero, leyendo lo que haya en el almacén. */
function abrirJuego() {
  setActivePinia(createPinia())
  return useAvisosStore()
}

beforeEach(() => {
  almacen = almacenEnMemoria()
  vi.stubGlobal('localStorage', almacen)
})

describe('avisos de cartas', () => {
  it('empieza sin avisos', () => {
    expect(abrirJuego().avisos).toEqual([])
  })

  it('guarda el aviso y lo recupera al volver a abrir el juego', async () => {
    const avisos = abrirJuego()
    avisos.avisar(A, 'dato', '  Pone otro capítulo  ')
    await nextTick()
    expect(almacen.datos.has(CLAVE)).toBe(true)

    const otra = abrirJuego()
    expect(otra.avisos).toHaveLength(1)
    expect(otra.avisoDe(A)).toMatchObject({ cartaId: A, motivo: 'dato', comentario: 'Pone otro capítulo' })
    expect(otra.avisoDe(B)).toBeUndefined()
  })

  it('avisar otra vez de la misma carta sustituye el aviso', () => {
    const avisos = abrirJuego()
    avisos.avisar(A, 'dato')
    avisos.avisar(B, 'otro')
    avisos.avisar(A, 'redaccion', 'Mejor así')
    expect(avisos.avisos.map((a) => [a.cartaId, a.motivo])).toEqual([
      [B, 'otro'],
      [A, 'redaccion'],
    ])
  })

  it('quita un aviso y, al borrarlos todos, limpia el almacén', async () => {
    const avisos = abrirJuego()
    avisos.avisar(A, 'dato')
    avisos.avisar(B, 'repetida')
    avisos.quitar(A)
    expect(avisos.avisos.map((a) => a.cartaId)).toEqual([B])
    avisos.borrarTodos()
    await nextTick()
    expect(avisos.avisos).toEqual([])
    expect(almacen.datos.has(CLAVE)).toBe(false)
  })

  it('ignora un guardado roto', () => {
    almacen.setItem(CLAVE, '{no es json')
    expect(abrirJuego().avisos).toEqual([])
  })

  it('sigue funcionando sin almacenamiento', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    })
    const avisos = abrirJuego()
    avisos.avisar(A, 'dato')
    await nextTick()
    expect(avisos.avisos).toHaveLength(1)
  })
})

describe('envío de los avisos', () => {
  const URL = 'https://script.example/exec'

  /** El store con el envío configurado: la URL se lee al cargar el módulo. */
  async function abrirConEnvio() {
    vi.stubEnv('VITE_URL_AVISOS', URL)
    vi.resetModules()
    const { createPinia: crear, setActivePinia: activar } = await import('pinia')
    const { useAvisosStore: usar } = await import('./avisos')
    activar(crear())
    return usar()
  }
  const esperar = () => new Promise((r) => setTimeout(r, 0))

  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('sin URL no se envía nada', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const avisos = abrirJuego()
    avisos.avisar(A, 'dato')
    await esperar()
    expect(avisos.envioActivo).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('al avisar se envía y queda marcado como enviado', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetch)
    const avisos = await abrirConEnvio()
    avisos.avisar(A, 'dato', 'Revisad la cita')
    expect(avisos.avisoDe(A)!.enviado).toBe(false)
    await esperar()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(URL)
    expect(avisos.avisoDe(A)!.enviado).toBe(true)
  })

  it('sin conexión se queda pendiente y se envía al abrir el juego otra vez', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const avisos = await abrirConEnvio()
    avisos.avisar(A, 'dato')
    avisos.avisar(B, 'otro')
    await esperar()
    await nextTick()
    expect(avisos.avisos.every((a) => !a.enviado)).toBe(true)

    const fetch = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetch)
    const otra = await abrirConEnvio()
    await esperar()
    await esperar()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(otra.avisos.every((a) => a.enviado)).toBe(true)
  })

  it('cambiar un aviso ya enviado lo vuelve a enviar', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetch)
    const avisos = await abrirConEnvio()
    avisos.avisar(A, 'dato')
    await esperar()
    avisos.avisar(A, 'redaccion', 'Mejor así')
    await esperar()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetch.mock.calls[1][1].body).comentario).toBe('Mejor así')
    expect(avisos.avisoDe(A)!.enviado).toBe(true)
  })

  it('un cambio hecho mientras se envía el anterior también sale', async () => {
    let soltar: () => void = () => {}
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => new Promise((r) => (soltar = () => r(new Response(null)))))
      .mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetch)
    const avisos = await abrirConEnvio()
    avisos.avisar(A, 'dato')
    avisos.avisar(A, 'otro', 'Segundo')
    soltar()
    await esperar()
    await esperar()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetch.mock.calls[1][1].body).comentario).toBe('Segundo')
    expect(avisos.avisoDe(A)!.enviado).toBe(true)
  })
})

describe('frase del botón de avisar', () => {
  it('sale una vez por pareja', () => {
    const avisos = abrirJuego()
    expect(avisos.verFrase('p0')).toBe(true)
    expect(avisos.verFrase('p0')).toBe(false)
    expect(avisos.verFrase('p1')).toBe(true)
  })
})
