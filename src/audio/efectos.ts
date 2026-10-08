/**
 * Sonidos del juego sintetizados con Web Audio, sin archivos.
 *
 * El arpa es una cuerda pulsada (algoritmo de Karplus-Strong) con un poco de
 * cuerpo y reverberación de sala. Las campanitas son senos con un parcial
 * inarmónico. Todo funciona igual con un AudioContext normal o con un
 * OfflineAudioContext (para generar muestras y probar).
 */

export interface Motor {
  ctx: BaseAudioContext
  /** Entrada de los efectos: va a la mezcla en seco y a la reverb. */
  bus: AudioNode
  /** Volumen general (silencio = 0). */
  master: GainNode
}

/** Escala de re mayor: es luminosa y en el arpa suena muy natural. */
const RE_MAYOR = [0, 2, 4, 5, 7, 9, 11]
const PENTATONICA = [0, 2, 4, 7, 9]
const RE = 62 // re4 en MIDI

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export function crearMotor(ctx: BaseAudioContext, destino: AudioNode = ctx.destination): Motor {
  const master = ctx.createGain()
  master.gain.value = 0.85

  // Un compresor suave evita picos molestos cuando suenan varias notas a la vez.
  const compresor = ctx.createDynamicsCompressor()
  compresor.threshold.value = -20
  compresor.knee.value = 14
  compresor.ratio.value = 3
  compresor.attack.value = 0.008
  compresor.release.value = 0.3

  // Un filtro que redondea los agudos: nada estridente.
  const suavizar = ctx.createBiquadFilter()
  suavizar.type = 'lowpass'
  suavizar.frequency.value = 6500
  suavizar.Q.value = 0.5

  master.connect(suavizar).connect(compresor).connect(destino)

  const reverb = ctx.createConvolver()
  reverb.buffer = impulsoSala(ctx, 3.2, 2.6)
  const humedo = ctx.createGain()
  humedo.gain.value = 0.38
  reverb.connect(humedo).connect(master)

  const seco = ctx.createGain()
  seco.gain.value = 0.9
  seco.connect(master)

  const bus = ctx.createGain()
  bus.connect(seco)
  bus.connect(reverb)

  return { ctx, bus, master }
}

/** Respuesta de una sala con eco suave: ruido estéreo que se apaga poco a poco. */
function impulsoSala(ctx: BaseAudioContext, duracion: number, caida: number): AudioBuffer {
  const sr = ctx.sampleRate
  const largo = Math.floor(sr * duracion)
  const buf = ctx.createBuffer(2, largo, sr)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    let suave = 0
    for (let i = 0; i < largo; i++) {
      const t = i / largo
      // Ruido algo filtrado para que la cola sea cálida y no "silbe".
      suave += 0.35 * (Math.random() * 2 - 1 - suave)
      d[i] = suave * (1 - t) ** caida
    }
  }
  return buf
}

/* ---------- Arpa: cuerda pulsada ---------- */

const cacheCuerdas = new WeakMap<BaseAudioContext, Map<string, { buffer: AudioBuffer; f0: number }>>()

function cuerda(ctx: BaseAudioContext, midi: number, brillo: number) {
  let cache = cacheCuerdas.get(ctx)
  if (!cache) cacheCuerdas.set(ctx, (cache = new Map()))
  const clave = `${midi}-${brillo}`
  const enCache = cache.get(clave)
  if (enCache) return enCache

  const sr = ctx.sampleRate
  const f = hz(midi)
  const n = Math.max(2, Math.floor(sr / f))
  const duracion = midi < 50 ? 4 : midi < 70 ? 3.2 : 2.2
  const largo = Math.floor(sr * duracion)
  const buffer = ctx.createBuffer(1, largo, sr)
  const d = buffer.getChannelData(0)

  // Excitación: un pellizco suave (ruido filtrado), sin componente continua.
  const anillo = new Float32Array(n)
  let previo = 0
  let media = 0
  for (let i = 0; i < n; i++) {
    previo += brillo * (Math.random() * 2 - 1 - previo)
    anillo[i] = previo
    media += previo
  }
  media /= n
  for (let i = 0; i < n; i++) anillo[i] -= media

  // Las cuerdas graves vibran más tiempo que las agudas, como en un arpa real.
  const amortiguacion = midi < 55 ? 0.9985 : midi < 72 ? 0.997 : 0.995
  let idx = 0
  let pico = 0
  for (let i = 0; i < largo; i++) {
    const a = anillo[idx]
    const b = anillo[(idx + 1) % n]
    anillo[idx] = amortiguacion * 0.5 * (a + b)
    d[i] = a
    pico = Math.max(pico, Math.abs(a))
    idx = (idx + 1) % n
  }
  // Normalizar y cerrar con un fundido para que no haya clics.
  const fundido = Math.floor(sr * 0.08)
  for (let i = 0; i < largo; i++) {
    d[i] /= pico || 1
    if (i > largo - fundido) d[i] *= (largo - i) / fundido
  }

  // El retardo real del lazo es n + 0.5 muestras: se corrige con playbackRate.
  const resultado = { buffer, f0: sr / (n + 0.5) }
  cache.set(clave, resultado)
  return resultado
}

interface OpcionesNota {
  vol?: number
  brillo?: number
  pan?: number
  /** Añade un seno suave a la fundamental para dar cuerpo. */
  cuerpo?: number
}

export function arpa(m: Motor, midi: number, t: number, o: OpcionesNota = {}) {
  const { ctx } = m
  const vol = o.vol ?? 0.5
  const { buffer, f0 } = cuerda(ctx, midi, o.brillo ?? 0.45)
  const fuente = ctx.createBufferSource()
  fuente.buffer = buffer
  fuente.playbackRate.value = hz(midi) / f0

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.004)

  const pan = ctx.createStereoPanner()
  pan.pan.value = o.pan ?? 0

  fuente.connect(g).connect(pan).connect(m.bus)
  fuente.start(t)

  const cuerpo = o.cuerpo ?? 0.18
  if (cuerpo > 0) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = hz(midi)
    const gc = ctx.createGain()
    gc.gain.setValueAtTime(0, t)
    gc.gain.linearRampToValueAtTime(vol * cuerpo, t + 0.01)
    gc.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    osc.connect(gc).connect(pan)
    osc.start(t)
    osc.stop(t + 1.5)
  }
}

/* ---------- Campanita ---------- */

export function campana(m: Motor, midi: number, t: number, vol = 0.25, duracion = 2.2, pan = 0) {
  const { ctx } = m
  const salida = ctx.createStereoPanner()
  salida.pan.value = pan
  salida.connect(m.bus)
  // Fundamental, octava y un parcial inarmónico que da el timbre de campana.
  const parciales: [number, number, number][] = [
    [1, 1, 1],
    [2, 0.35, 0.6],
    [2.76, 0.18, 0.45],
    [5.4, 0.05, 0.25],
  ]
  for (const [ratio, amp, dur] of parciales) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = hz(midi) * ratio
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol * amp, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion * dur)
    osc.connect(g).connect(salida)
    osc.start(t)
    osc.stop(t + duracion * dur + 0.05)
  }
}

/* ---------- Soplo (carta que se desliza) ---------- */

function soplo(m: Motor, t: number, vol = 0.12, dur = 0.32) {
  const { ctx } = m
  const largo = Math.floor(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, largo, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1
  const fuente = ctx.createBufferSource()
  fuente.buffer = buf
  const filtro = ctx.createBiquadFilter()
  filtro.type = 'bandpass'
  filtro.Q.value = 1.2
  filtro.frequency.setValueAtTime(700, t)
  filtro.frequency.exponentialRampToValueAtTime(2800, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.35)
  g.gain.linearRampToValueAtTime(0, t + dur)
  fuente.connect(filtro).connect(g).connect(m.bus)
  fuente.start(t)
}

/* ---------- Efectos del juego ---------- */

const notaEscala = (grado: number, escala = RE_MAYOR, base = RE) =>
  base + 12 * Math.floor(grado / escala.length) + escala[((grado % escala.length) + escala.length) % escala.length]

/** Entrada al juego: glissando de arpa hacia arriba que se posa en un acorde. */
export function entrada(m: Motor, t: number) {
  const notas = [-7, -5, -3, -2, 0, 2, 4, 5, 7, 9, 11, 12, 14].map((g) => notaEscala(g))
  notas.forEach((n, i) => arpa(m, n, t + i * 0.075, { vol: 0.32 + i * 0.012, pan: -0.5 + i / notas.length, brillo: 0.4 }))
  const fin = t + notas.length * 0.075 + 0.1
  ;[RE - 24, RE - 12, RE - 5, RE + 4, RE + 12].forEach((n, i) => arpa(m, n, fin + i * 0.03, { vol: 0.34, brillo: 0.32 }))
  campana(m, RE + 24, fin + 0.05, 0.08, 3)
}

/** Tic de la ruleta al pasar por cada casilla: una cuerda aguda muy corta. */
export function tic(m: Motor, t: number, intensidad = 1) {
  const n = notaEscala(14 + Math.floor(Math.random() * 3), PENTATONICA)
  arpa(m, n, t, { vol: 0.2 * intensidad, brillo: 0.28, cuerpo: 0, pan: (Math.random() - 0.5) * 0.4 })
}

/** La ruleta se para: dos notas de campana. */
export function ruletaPara(m: Motor, t: number) {
  campana(m, RE + 19, t, 0.18, 2)
  campana(m, RE + 24, t + 0.11, 0.16, 2.4)
  arpa(m, RE + 7, t, { vol: 0.25, brillo: 0.3 })
}

/** Sacar carta: un soplo y una nota. */
export function carta(m: Motor, t: number) {
  soplo(m, t)
  arpa(m, RE + 12, t + 0.12, { vol: 0.18, brillo: 0.3, cuerpo: 0.1 })
}

/** Pedir pista: un destello de tres notas agudas. */
export function pista(m: Motor, t: number) {
  ;[19, 21, 24].forEach((g, i) => campana(m, notaEscala(g, PENTATONICA, RE - 12), t + i * 0.07, 0.07, 1.4, -0.3 + i * 0.3))
}

/** Acierto: arpegio ascendente de re mayor rematado con una campanita. */
export function acierto(m: Motor, t: number) {
  ;[RE, RE + 4, RE + 7, RE + 12, RE + 16].forEach((n, i) => arpa(m, n, t + i * 0.085, { vol: 0.38, pan: -0.3 + i * 0.15, brillo: 0.45 }))
  arpa(m, RE - 12, t, { vol: 0.3, brillo: 0.3 })
  campana(m, RE + 24, t + 0.42, 0.12, 2.6)
}

/** Fallo: dos notas que bajan, suaves y sin dramatismo. */
export function fallo(m: Motor, t: number) {
  arpa(m, RE + 4, t, { vol: 0.3, brillo: 0.22 })
  arpa(m, RE - 1, t + 0.22, { vol: 0.3, brillo: 0.22 })
  arpa(m, RE - 13, t + 0.22, { vol: 0.22, brillo: 0.2 })
}

/** Últimos segundos del reloj: un toque de madera muy discreto. */
export function relojTic(m: Motor, t: number, agudo = false) {
  arpa(m, agudo ? RE + 26 : RE + 24, t, { vol: 0.12, brillo: 0.18, cuerpo: 0 })
}

/** Se acaba el tiempo: un gong suave y grave. */
export function tiempo(m: Motor, t: number) {
  campana(m, RE - 10, t, 0.32, 3.2)
  campana(m, RE - 3, t + 0.02, 0.14, 2.6)
}

/** Victoria: gran glissando de arpa y acorde final con campanas. */
export function victoria(m: Motor, t: number) {
  const notas = Array.from({ length: 16 }, (_, i) => notaEscala(i - 7))
  notas.forEach((n, i) => arpa(m, n, t + i * 0.055, { vol: 0.3 + i * 0.01, pan: -0.6 + (i / 16) * 1.2 }))
  const fin = t + 16 * 0.055 + 0.15
  ;[RE - 24, RE - 12, RE - 5, RE, RE + 4, RE + 7, RE + 12].forEach((n, i) =>
    arpa(m, n, fin + i * 0.045, { vol: 0.32, brillo: 0.35 }),
  )
  ;[RE + 19, RE + 24, RE + 28].forEach((n, i) => campana(m, n, fin + 0.35 + i * 0.16, 0.11, 3))
}

/* ---------- Música del menú ---------- */

/** Progresión I – vi – IV – V en re mayor (re, si menor, sol, la). */
const ACORDES = [
  { raiz: 50, tipo: [0, 4, 7] },
  { raiz: 47, tipo: [0, 3, 7] },
  { raiz: 43, tipo: [0, 4, 7] },
  { raiz: 45, tipo: [0, 4, 7] },
]

export const PULSO_MUSICA = 0.42 // segundos por corchea (unas 71 negras por minuto)
const PASOS_POR_ACORDE = 8

/**
 * Programa el paso `paso` de la música en el instante `t`. Es generativa: los
 * arpegios varían un poco cada vez, pero siempre dentro del acorde.
 */
export function pasoMusica(m: Motor, t: number, paso: number) {
  const acorde = ACORDES[Math.floor(paso / PASOS_POR_ACORDE) % ACORDES.length]
  const p = paso % PASOS_POR_ACORDE
  const tonos = acorde.tipo
  const humano = (Math.random() - 0.5) * 0.02

  if (p === 0) {
    arpa(m, acorde.raiz, t, { vol: 0.24, brillo: 0.22, cuerpo: 0.25 })
    arpa(m, acorde.raiz + 12 + tonos[2], t + 0.02, { vol: 0.12, brillo: 0.25 })
  }

  // Arpegio que sube y baja por las notas del acorde.
  const patron = [0, 1, 2, 3, 4, 3, 2, 1]
  const grado = patron[p]
  if (p !== 0 && !(p === 7 && Math.random() < 0.4)) {
    const octava = Math.floor(grado / 3)
    const midi = acorde.raiz + 24 + 12 * octava + tonos[grado % 3]
    arpa(m, midi, t + humano, { vol: 0.13 + Math.random() * 0.04, brillo: 0.3, pan: -0.35 + (p / 8) * 0.7, cuerpo: 0.12 })
  }

  // De vez en cuando, un destello agudo de la pentatónica.
  if (p === 5 && Math.random() < 0.3) {
    const n = notaEscala(10 + Math.floor(Math.random() * 4), PENTATONICA)
    arpa(m, n, t + PULSO_MUSICA * 0.5, { vol: 0.07, brillo: 0.3, pan: 0.5, cuerpo: 0 })
  }
}
