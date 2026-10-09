import { ref } from 'vue'

/**
 * El regalo sale solo la primera vez que se abre el juego en un navegador.
 * Para volver a verlo: abrir la web con «?regalo» al final, o mantener
 * pulsado el logo de la portada.
 */
const CLAVE = 'trivia-cristiano/regalo-abierto'

function forzadoPorEnlace(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('regalo')
  } catch {
    return false
  }
}

function yaAbierto(): boolean {
  try {
    return localStorage.getItem(CLAVE) === 'si'
  } catch {
    return false
  }
}

export const regaloVisible = ref(forzadoPorEnlace() || !yaAbierto())

export function marcarRegaloAbierto() {
  try {
    localStorage.setItem(CLAVE, 'si')
  } catch {
    /* sin almacenamiento */
  }
}

export function volverAVerRegalo() {
  regaloVisible.value = true
}
