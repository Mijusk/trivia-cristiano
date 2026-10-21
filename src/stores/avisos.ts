import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { MAX_COMENTARIO, leerAvisos, type Aviso, type Motivo } from '../game/avisos'

const CLAVE_AVISOS = 'trivia-cristiano/avisos/v1'

function cargar(): Aviso[] {
  try {
    return leerAvisos(JSON.parse(localStorage.getItem(CLAVE_AVISOS) ?? '[]'))
  } catch {
    return []
  }
}

function guardar(avisos: Aviso[]) {
  try {
    if (avisos.length) localStorage.setItem(CLAVE_AVISOS, JSON.stringify(avisos))
    else localStorage.removeItem(CLAVE_AVISOS)
  } catch {
    // Sin almacenamiento: los avisos duran mientras la página esté abierta.
  }
}

/** Cartas con algún error que se marcan durante la partida para revisarlas luego. Sobreviven a las partidas. */
export const useAvisosStore = defineStore('avisos', () => {
  const avisos = ref<Aviso[]>(cargar())

  watch(avisos, guardar, { deep: true })

  const avisoDe = (cartaId: string) => avisos.value.find((a) => a.cartaId === cartaId)

  /** Marca la carta; si ya tenía aviso, lo sustituye. */
  function avisar(cartaId: string, motivo: Motivo, comentario = '') {
    const aviso: Aviso = {
      cartaId,
      motivo,
      comentario: comentario.trim().slice(0, MAX_COMENTARIO),
      fecha: new Date().toISOString(),
    }
    avisos.value = [...avisos.value.filter((a) => a.cartaId !== cartaId), aviso]
  }

  function quitar(cartaId: string) {
    avisos.value = avisos.value.filter((a) => a.cartaId !== cartaId)
  }

  function borrarTodos() {
    avisos.value = []
  }

  return { avisos, avisoDe, avisar, quitar, borrarTodos }
})
