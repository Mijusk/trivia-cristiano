import { ref, watch } from 'vue'
import * as fx from './efectos'

const CLAVE = 'trivia-cristiano/sonido'

function leerPreferencia(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== 'off'
  } catch {
    return true
  }
}

/** ¿Está el sonido activado? Se guarda en el navegador. */
export const sonidoActivado = ref(leerPreferencia())

let motor: fx.Motor | null = null
let ctx: AudioContext | null = null
let haSonadoEntrada = false

watch(sonidoActivado, (v) => {
  try {
    localStorage.setItem(CLAVE, v ? 'on' : 'off')
  } catch {
    /* sin almacenamiento */
  }
  if (motor && ctx) {
    motor.master.gain.cancelScheduledValues(ctx.currentTime)
    motor.master.gain.setTargetAtTime(v ? 0.85 : 0, ctx.currentTime, 0.08)
  }
  if (!v) pararMusica()
  else if (musicaPedida) empezarMusica()
})

/**
 * Los navegadores no dejan sonar nada hasta que la persona toca la pantalla.
 * Esto crea el contexto de audio en el primer toque.
 */
function asegurar(): fx.Motor | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx({ latencyHint: 'interactive' })
    motor = fx.crearMotor(ctx)
    motor.master.gain.value = sonidoActivado.value ? 0.85 : 0
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return motor
}

function tocar(efecto: (m: fx.Motor, t: number) => void, retraso = 0) {
  if (!sonidoActivado.value) return
  const m = asegurar()
  if (!m || !ctx) return
  efecto(m, ctx.currentTime + 0.02 + retraso)
}

/* ---------- Música del menú ---------- */

let musicaPedida = false
let temporizador: ReturnType<typeof setInterval> | undefined
let siguiente = 0
let paso = 0
let ganancia: GainNode | null = null

function empezarMusica() {
  if (!sonidoActivado.value || temporizador) return
  const m = asegurar()
  if (!m || !ctx) return

  // La música pasa por su propio volumen para poder hacer fundidos.
  ganancia = ctx.createGain()
  ganancia.gain.setValueAtTime(0, ctx.currentTime)
  ganancia.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 2.5)
  ganancia.connect(m.bus)
  const motorMusica: fx.Motor = { ctx, bus: ganancia, master: m.master }

  siguiente = ctx.currentTime + (haSonadoEntrada ? 0.1 : 2.4)
  paso = 0
  // Se programan las notas un poco por adelantado para que el ritmo no tiemble.
  temporizador = setInterval(() => {
    if (!ctx) return
    while (siguiente < ctx.currentTime + 0.4) {
      fx.pasoMusica(motorMusica, siguiente, paso++)
      siguiente += fx.PULSO_MUSICA
    }
  }, 120)
}

function pararMusica() {
  if (temporizador) clearInterval(temporizador)
  temporizador = undefined
  if (ganancia && ctx) {
    const g = ganancia
    g.gain.cancelScheduledValues(ctx.currentTime)
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2)
    setTimeout(() => g.disconnect(), 1500)
  }
  ganancia = null
}

/* ---------- API para el juego ---------- */

export const sonido = {
  alternar() {
    sonidoActivado.value = !sonidoActivado.value
    if (sonidoActivado.value) asegurar()
  },

  /** Primer toque en la portada: suena el arpa de entrada y arranca la música. */
  entrar() {
    if (haSonadoEntrada) return
    if (!sonidoActivado.value) return
    haSonadoEntrada = true
    tocar(fx.entrada)
    if (musicaPedida) {
      pararMusica()
      empezarMusica()
    }
  },

  /** La música suena en la portada y al configurar; se apaga durante la partida. */
  musica(encendida: boolean) {
    musicaPedida = encendida
    if (encendida && ctx) empezarMusica()
    if (!encendida) pararMusica()
  },

  tic: (intensidad = 1) => tocar((m, t) => fx.tic(m, t, intensidad)),
  ruletaPara: () => tocar(fx.ruletaPara),
  carta: () => tocar(fx.carta),
  pista: () => tocar(fx.pista),
  acierto: () => tocar(fx.acierto),
  fallo: () => tocar(fx.fallo),
  relojTic: (agudo = false) => tocar((m, t) => fx.relojTic(m, t, agudo)),
  tiempo: () => tocar(fx.tiempo),
  victoria: () => tocar(fx.victoria),
}
