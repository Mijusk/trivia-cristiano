import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Casilla, CasillaKey } from '../types'
import { TEMAS } from '../game/config'
import { VERSION_PARTIDA } from '../game/guardado'
import { usePartidaStore } from './partida'

const CLAVE = 'trivia-cristiano/partida/v1'

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
  return usePartidaStore()
}

const PAREJAS = [
  { nombre: 'Ana y Juan', nivel: 'peques' as const },
  { nombre: '', nivel: 'experta' as const },
]
const CASILLA: Casilla = { tema: 'nt', prueba: 'pregunta' }

beforeEach(() => {
  almacen = almacenEnMemoria()
  vi.stubGlobal('localStorage', almacen)
})

describe('partida', () => {
  it('empieza una partida nueva en la ruleta de la primera pareja', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    expect(store.pantalla).toBe('juego')
    expect(store.partida).toMatchObject({ version: VERSION_PARTIDA, fase: 'turno', turno: 0, modo: 'corta' })
    expect(store.parejaActual?.nombre).toBe('Ana y Juan')
    // Sin nombre se llama por su número.
    expect(store.partida!.parejas[1].nombre).toBe('Pareja 2')
    expect(store.pendientes).toHaveLength(16)
  })

  it('jugar una casilla saca una carta del nivel de la pareja', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.jugarCasilla(CASILLA)
    expect(store.partida!.fase).toBe('carta')
    expect(store.carta).toMatchObject({ tema: 'nt', prueba: 'pregunta', nivel: 'peques' })
    expect(store.partida!.usadas).toEqual([store.carta!.id])
  })

  it('se puede cambiar de carta una sola vez, y nunca por la misma', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.jugarCasilla(CASILLA)
    const primera = store.partida!.cartaId
    store.otraCarta()
    const segunda = store.partida!.cartaId
    expect(segunda).not.toBe(primera)
    expect(store.partida!.cambioUsado).toBe(true)
    // La descartada sigue contando como usada.
    expect(store.partida!.usadas).toEqual([primera, segunda])

    store.otraCarta()
    expect(store.partida!.cartaId).toBe(segunda)
  })

  it('acertar da el quesito; fallar no', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'media')
    store.jugarCasilla(CASILLA)
    store.resolver(false)
    expect(store.partida).toMatchObject({ fase: 'resultado', ultimoAcierto: false })
    expect(store.parejaActual!.ganadas).toEqual([])

    store.resolver(true)
    expect(store.parejaActual!.ganadas).toEqual(['nt:pregunta'])
  })

  it('el turno pasa a la siguiente pareja y vuelve a la primera', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.jugarCasilla(CASILLA)
    store.usarPista()
    store.otraCarta()
    store.resolver(true)
    store.siguienteTurno()
    expect(store.partida).toMatchObject({
      turno: 1,
      fase: 'turno',
      casilla: null,
      cartaId: null,
      pistaUsada: false,
      cambioUsado: false,
      mazoReiniciado: false,
      ultimoAcierto: null,
    })
    store.siguienteTurno()
    expect(store.partida!.turno).toBe(0)
  })

  it('el último quesito que falta da la victoria', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.parejaActual!.ganadas = TEMAS.filter((t) => t !== 'nt').map((t) => `${t}:mimica` as CasillaKey)
    store.jugarCasilla(CASILLA)
    store.resolver(true)
    expect(store.partida!.fase).toBe('victoria')
    expect(store.ganadora?.nombre).toBe('Ana y Juan')
  })

  it('avisa cuando el mazo de la prueba y el nivel vuelve a empezar', () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'completa')
    const vistas = new Set<string>()
    while (!store.partida!.mazoReiniciado) {
      store.jugarCasilla(CASILLA)
      if (!store.partida!.mazoReiniciado) vistas.add(store.partida!.cartaId!)
    }
    // Antes de reiniciar han salido todas las de peques sin repetir (40 preguntas, 10 por tema).
    expect(vistas.size).toBe(40)
  })
})

describe('guardado', () => {
  it('guarda la partida en cada cambio y se puede continuar al volver', async () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.jugarCasilla(CASILLA)
    await nextTick()
    expect(JSON.parse(almacen.getItem(CLAVE)!).version).toBe(VERSION_PARTIDA)

    const otraVez = abrirJuego()
    expect(otraVez.partida).toEqual(store.partida)
    expect(otraVez.carta?.id).toBe(store.carta?.id)
  })

  it('una partida guardada con la versión 1 se continúa', () => {
    almacen.setItem(
      CLAVE,
      JSON.stringify({
        version: 1,
        fase: 'turno',
        modo: 'media',
        parejas: [{ id: 'a', nombre: 'A', nivel: 'media', ganadas: ['nt:mimica'] }],
        turno: 0,
        casilla: null,
        cartaId: null,
        cartaDeOtroTema: false,
        pistaUsada: false,
        cambioUsado: false,
        usadas: ['mimica-3'],
        ultimoAcierto: null,
        tiempos: { pregunta: 30, actuar: 60 },
      }),
    )
    const store = abrirJuego()
    expect(store.partida).toMatchObject({ version: VERSION_PARTIDA, usadas: ['mimica-3'] })
    expect(store.parejaActual!.ganadas).toEqual(['nt:mimica'])
  })

  it('un guardado roto no impide abrir el juego', () => {
    almacen.setItem(CLAVE, '{esto no es json')
    expect(abrirJuego().partida).toBeNull()
  })

  it('al terminar se borra la partida pero se recuerdan las cartas usadas', async () => {
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.jugarCasilla(CASILLA)
    const usada = store.partida!.cartaId!
    store.terminar()
    await nextTick()
    expect(store.pantalla).toBe('inicio')
    expect(almacen.getItem(CLAVE)).toBeNull()

    // La siguiente partida no vuelve a sacar esa carta enseguida.
    const nueva = abrirJuego()
    nueva.nuevaPartida(PAREJAS, 'corta')
    expect(nueva.partida!.usadas).toEqual([usada])
  })

  it('sin almacenamiento (modo privado) la partida sigue en memoria', async () => {
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
    const store = abrirJuego()
    store.nuevaPartida(PAREJAS, 'corta')
    store.jugarCasilla(CASILLA)
    await nextTick()
    expect(store.partida!.fase).toBe('carta')
    expect(() => store.terminar()).not.toThrow()
  })
})
