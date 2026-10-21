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
