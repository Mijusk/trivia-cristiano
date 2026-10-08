import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Casilla, Modo, Nivel, Partida } from '../types'
import { TIEMPOS_POR_DEFECTO } from '../game/config'
import { cartaPorId, sacarCarta } from '../game/mazo'
import { casillasPendientes, claveCasilla, haGanado } from '../game/reglas'

const CLAVE_GUARDADO = 'trivia-cristiano/partida/v1'

export type Pantalla = 'inicio' | 'configurar' | 'juego'

function cargar(): Partida | null {
  try {
    const texto = localStorage.getItem(CLAVE_GUARDADO)
    if (!texto) return null
    const partida = JSON.parse(texto) as Partida
    return partida.version === 1 && Array.isArray(partida.parejas) ? partida : null
  } catch {
    return null
  }
}

function guardar(partida: Partida | null) {
  try {
    if (partida) localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(partida))
    else localStorage.removeItem(CLAVE_GUARDADO)
  } catch {
    // Sin almacenamiento (modo privado, etc.): la partida sigue en memoria.
  }
}

/** Cartas que salieron en partidas anteriores, para no repetirlas pronto. */
function cargarUsadas(): string[] {
  try {
    const lista = JSON.parse(localStorage.getItem(`${CLAVE_GUARDADO}/usadas`) ?? '[]')
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

export const usePartidaStore = defineStore('partida', () => {
  const pantalla = ref<Pantalla>('inicio')
  const partida = ref<Partida | null>(cargar())

  watch(partida, guardar, { deep: true })

  const parejaActual = computed(() => (partida.value ? partida.value.parejas[partida.value.turno] : null))
  const carta = computed(() => cartaPorId(partida.value?.cartaId ?? null))
  const pendientes = computed(() =>
    partida.value && parejaActual.value ? casillasPendientes(parejaActual.value, partida.value.modo) : [],
  )
  const ganadora = computed(() =>
    partida.value ? (partida.value.parejas.find((p) => haGanado(p, partida.value!.modo)) ?? null) : null,
  )

  function irA(destino: Pantalla) {
    pantalla.value = destino
  }

  function nuevaPartida(parejas: { nombre: string; nivel: Nivel }[], modo: Modo) {
    partida.value = {
      version: 1,
      fase: 'turno',
      modo,
      parejas: parejas.map((p, i) => ({
        id: `p${i}-${Date.now().toString(36)}`,
        nombre: p.nombre.trim() || `Pareja ${i + 1}`,
        nivel: p.nivel,
        ganadas: [],
      })),
      turno: 0,
      casilla: null,
      cartaId: null,
      cartaDeOtroTema: false,
      pistaUsada: false,
      cambioUsado: false,
      usadas: partida.value?.usadas ?? cargarUsadas(),
      ultimoAcierto: null,
      tiempos: { ...TIEMPOS_POR_DEFECTO },
    }
    pantalla.value = 'juego'
  }

  /** La ruleta ha caído en una casilla: se saca la carta. */
  function jugarCasilla(casilla: Casilla) {
    const p = partida.value
    const pareja = parejaActual.value
    if (!p || !pareja) return
    const { carta, deOtroTema } = sacarCarta(casilla.tema, casilla.prueba, pareja.nivel, p.usadas)
    p.casilla = casilla
    p.cartaId = carta.id
    p.cartaDeOtroTema = deOtroTema
    p.usadas.push(carta.id)
    p.pistaUsada = false
    p.ultimoAcierto = null
    p.fase = 'carta'
  }

  /** Cambia la carta por otra de la misma casilla. Solo una vez por turno. */
  function otraCarta() {
    const p = partida.value
    if (!p?.casilla || p.cambioUsado) return
    jugarCasilla(p.casilla)
    p.cambioUsado = true
  }

  function usarPista() {
    if (partida.value) partida.value.pistaUsada = true
  }

  function resolver(acierto: boolean) {
    const p = partida.value
    const pareja = parejaActual.value
    if (!p || !pareja || !p.casilla) return
    p.ultimoAcierto = acierto
    if (acierto) {
      const clave = claveCasilla(p.casilla)
      if (!pareja.ganadas.includes(clave)) pareja.ganadas.push(clave)
    }
    p.fase = acierto && haGanado(pareja, p.modo) ? 'victoria' : 'resultado'
  }

  function siguienteTurno() {
    const p = partida.value
    if (!p) return
    p.turno = (p.turno + 1) % p.parejas.length
    p.casilla = null
    p.cartaId = null
    p.cartaDeOtroTema = false
    p.pistaUsada = false
    p.cambioUsado = false
    p.ultimoAcierto = null
    p.fase = 'turno'
  }

  /** Termina la partida pero recuerda las cartas usadas para no repetirlas en la siguiente. */
  function terminar() {
    const usadas = partida.value?.usadas ?? []
    partida.value = null
    try {
      localStorage.setItem(`${CLAVE_GUARDADO}/usadas`, JSON.stringify(usadas))
    } catch {
      /* sin almacenamiento */
    }
    pantalla.value = 'inicio'
  }

  return {
    pantalla,
    partida,
    parejaActual,
    carta,
    pendientes,
    ganadora,
    irA,
    nuevaPartida,
    jugarCasilla,
    otraCarta,
    usarPista,
    resolver,
    siguienteTurno,
    terminar,
  }
})
