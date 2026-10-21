import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Casilla, DibujarEn, Modo, Nivel, Partida, Tema } from '../types'
import { TEMAS, TIEMPOS_POR_DEFECTO, ordenarTemas } from '../game/config'
import { cartaPorId, sacarCarta } from '../game/mazo'
import { VERSION_PARTIDA, leerPartida, limpiarUsadas } from '../game/guardado'
import { casillasPendientes, claveCasilla, haGanado } from '../game/reglas'
import type { Dibujo } from '../game/pizarra'

// La clave no cambia entre versiones para no perder partidas: la versión va dentro (game/guardado.ts).
const CLAVE_GUARDADO = 'trivia-cristiano/partida/v1'

export type Pantalla = 'inicio' | 'configurar' | 'juego'

function cargar(): Partida | null {
  try {
    const texto = localStorage.getItem(CLAVE_GUARDADO)
    if (!texto) return null
    return leerPartida(JSON.parse(texto))
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
    return limpiarUsadas(JSON.parse(localStorage.getItem(`${CLAVE_GUARDADO}/usadas`) ?? '[]'))
  } catch {
    return []
  }
}

export const usePartidaStore = defineStore('partida', () => {
  const pantalla = ref<Pantalla>('inicio')
  const partida = ref<Partida | null>(cargar())

  watch(partida, guardar, { deep: true })

  /*
   * Lo que solo dura el turno y no se guarda: si en esta carta se dibuja en otro sitio que el
   * elegido para la partida, y el dibujo de la pizarra para verlo en el resultado.
   */
  const dibujarEnTurno = ref<DibujarEn | null>(null)
  const dibujo = ref<Dibujo | null>(null)
  const dibujarAhora = computed<DibujarEn>(() => dibujarEnTurno.value ?? partida.value?.dibujarEn ?? 'papel')

  function limpiarTurno() {
    dibujarEnTurno.value = null
    dibujo.value = null
  }

  const parejaActual = computed(() => (partida.value ? partida.value.parejas[partida.value.turno] : null))
  const carta = computed(() => cartaPorId(partida.value?.cartaId ?? null))
  const pendientes = computed(() =>
    partida.value && parejaActual.value
      ? casillasPendientes(parejaActual.value, partida.value.modo, partida.value.temas)
      : [],
  )
  const ganadora = computed(() =>
    partida.value
      ? (partida.value.parejas.find((p) => haGanado(p, partida.value!.modo, partida.value!.temas)) ?? null)
      : null,
  )

  function irA(destino: Pantalla) {
    pantalla.value = destino
  }

  /**
   * Empieza una partida con los temas elegidos (todos si no se elige ninguno).
   * El Camino solo se incluye si se juega con Vida Cristiana.
   */
  function nuevaPartida(
    parejas: { nombre: string; nivel: Nivel }[],
    modo: Modo,
    {
      temas = TEMAS,
      incluirCamino = false,
      dibujarEn = 'papel',
    }: { temas?: Tema[]; incluirCamino?: boolean; dibujarEn?: DibujarEn } = {},
  ) {
    limpiarTurno()
    const elegidos = ordenarTemas(temas)
    const temasPartida = elegidos.length > 0 ? elegidos : [...TEMAS]
    partida.value = {
      version: VERSION_PARTIDA,
      fase: 'turno',
      modo,
      temas: temasPartida,
      incluirCamino: incluirCamino && temasPartida.includes('vida'),
      dibujarEn,
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
      mazoReiniciado: false,
      pistaUsada: false,
      cambioUsado: false,
      usadas: partida.value?.usadas ?? cargarUsadas(),
      ultimoAcierto: null,
      tiempos: { ...TIEMPOS_POR_DEFECTO },
    }
    pantalla.value = 'juego'
  }

  /** La ruleta ha caído en una casilla: se saca la carta, distinta de `evitar` si se está cambiando. */
  function jugarCasilla(casilla: Casilla, evitar: string | null = null) {
    const p = partida.value
    const pareja = parejaActual.value
    if (!p || !pareja) return
    const sacada = sacarCarta(casilla.tema, casilla.prueba, pareja.nivel, p.usadas, {
      evitar,
      temas: p.temas,
      incluirCamino: p.incluirCamino,
    })
    p.casilla = casilla
    p.cartaId = sacada.carta.id
    dibujo.value = null
    p.cartaDeOtroTema = sacada.deOtroTema
    p.mazoReiniciado = sacada.reiniciado
    p.usadas = sacada.usadas
    p.pistaUsada = false
    p.ultimoAcierto = null
    p.fase = 'carta'
  }

  /**
   * Cambia la carta por otra de la misma casilla. Solo una vez por turno.
   * La descartada sigue contando como usada: ya la ha visto alguien.
   */
  function otraCarta() {
    const p = partida.value
    if (!p?.casilla || p.cambioUsado) return
    jugarCasilla(p.casilla, p.cartaId)
    p.cambioUsado = true
  }

  function usarPista() {
    if (partida.value) partida.value.pistaUsada = true
  }

  /** Dibujar en papel o en la pantalla solo en este turno, sin cambiar lo elegido para la partida. */
  function cambiarDibujarEn(donde: DibujarEn) {
    dibujarEnTurno.value = donde
  }

  function guardarDibujo(d: Dibujo | null) {
    dibujo.value = d
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
    p.fase = acierto && haGanado(pareja, p.modo, p.temas) ? 'victoria' : 'resultado'
  }

  function siguienteTurno() {
    const p = partida.value
    if (!p) return
    p.turno = (p.turno + 1) % p.parejas.length
    limpiarTurno()
    p.casilla = null
    p.cartaId = null
    p.cartaDeOtroTema = false
    p.mazoReiniciado = false
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
    dibujarAhora,
    dibujo,
    irA,
    nuevaPartida,
    jugarCasilla,
    otraCarta,
    usarPista,
    cambiarDibujarEn,
    guardarDibujo,
    resolver,
    siguienteTurno,
    terminar,
  }
})
