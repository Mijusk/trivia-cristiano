import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { MAX_COMENTARIO, URL_AVISOS, enviarAviso, leerAvisos, type Aviso, type Motivo } from '../game/avisos'

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

/**
 * Cartas con algún error que se marcan durante la partida para revisarlas luego. Sobreviven a las
 * partidas y, si el envío está configurado, se mandan a la hoja de avisos; los que no salen (sin
 * conexión) se reintentan al abrir el juego y al volver la conexión.
 */
export const useAvisosStore = defineStore('avisos', () => {
  const avisos = ref<Aviso[]>(cargar())
  const envioActivo = !!URL_AVISOS

  watch(avisos, guardar, { deep: true })

  const avisoDe = (cartaId: string) => avisos.value.find((a) => a.cartaId === cartaId)

  let enviando = false
  let otraVuelta = false
  /** Manda los avisos pendientes, uno detrás de otro. Si falla uno (sin conexión), para. */
  async function enviarPendientes() {
    if (!envioActivo) return
    if (enviando) {
      otraVuelta = true
      return
    }
    enviando = true
    let fallo = false
    try {
      for (const a of avisos.value.filter((a) => !a.enviado)) {
        if (!(await enviarAviso(a))) {
          fallo = true
          break
        }
        // Si mientras tanto se ha cambiado o quitado, no se toca: el cambio sale en la siguiente vuelta.
        if (avisoDe(a.cartaId) === a) a.enviado = true
      }
    } finally {
      enviando = false
    }
    if (otraVuelta && !fallo) {
      otraVuelta = false
      await enviarPendientes()
    }
  }

  /** Marca la carta; si ya tenía aviso, lo sustituye (y se vuelve a enviar con el cambio). */
  function avisar(cartaId: string, motivo: Motivo, comentario = '') {
    const aviso: Aviso = {
      cartaId,
      motivo,
      comentario: comentario.trim().slice(0, MAX_COMENTARIO),
      fecha: new Date().toISOString(),
      enviado: false,
    }
    avisos.value = [...avisos.value.filter((a) => a.cartaId !== cartaId), aviso]
    void enviarPendientes()
  }

  function quitar(cartaId: string) {
    avisos.value = avisos.value.filter((a) => a.cartaId !== cartaId)
  }

  function borrarTodos() {
    avisos.value = []
  }

  if (envioActivo) {
    void enviarPendientes()
    if (typeof window !== 'undefined') window.addEventListener('online', () => void enviarPendientes())
  }

  /*
   * El botón de avisar sale con su frase la primera vez que cada pareja llega al resultado; después,
   * solo el icono. No se guarda: al recargar, vuelve a salir una vez.
   */
  const frasesVistas = new Set<string>()
  function verFrase(parejaId: string): boolean {
    if (frasesVistas.has(parejaId)) return false
    frasesVistas.add(parejaId)
    return true
  }

  return { avisos, envioActivo, avisoDe, avisar, quitar, borrarTodos, enviarPendientes, verFrase }
})
