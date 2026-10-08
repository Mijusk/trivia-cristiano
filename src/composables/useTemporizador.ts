import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { sonido } from '../audio/sonido'

/** Cuenta atrás basada en la hora real, para que no se desvíe si el móvil va lento. */
export function useTemporizador(segundos: number) {
  const total = ref(segundos)
  const restanteMs = ref(segundos * 1000)
  const enMarcha = ref(false)
  const terminado = ref(false)
  let finEn = 0
  let intervalo: ReturnType<typeof setInterval> | undefined

  const restante = computed(() => Math.ceil(restanteMs.value / 1000))
  const fraccion = computed(() => restanteMs.value / (total.value * 1000))

  // Los últimos cinco segundos suenan; al acabar, un gong suave.
  watch(restante, (s, antes) => {
    if (!enMarcha.value || s === antes) return
    if (s > 0 && s <= 5) sonido.relojTic(s <= 2)
  })

  function tick() {
    restanteMs.value = Math.max(0, finEn - Date.now())
    if (restanteMs.value === 0) {
      parar()
      terminado.value = true
      sonido.tiempo()
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sin vibración */
      }
    }
  }

  function empezar() {
    if (enMarcha.value || terminado.value) return
    finEn = Date.now() + restanteMs.value
    enMarcha.value = true
    intervalo = setInterval(tick, 100)
  }

  function parar() {
    enMarcha.value = false
    if (intervalo) clearInterval(intervalo)
    intervalo = undefined
  }

  function reiniciar(nuevos = total.value) {
    parar()
    total.value = nuevos
    restanteMs.value = nuevos * 1000
    terminado.value = false
  }

  onBeforeUnmount(parar)

  return { restante, fraccion, enMarcha, terminado, empezar, parar, reiniciar }
}
