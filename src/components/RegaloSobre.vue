<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DEDICATORIA } from '../regalo/dedicatoria'
import { sonido } from '../audio/sonido'

/**
 * Pantalla de regalo: un sobre con lazo del que cuelga una etiqueta.
 * 1. Tocar la etiqueta: se suelta, gira y crece para leer la dedicatoria.
 * 2. Tocarla otra vez: sale volando hacia la derecha (por ahí aparece la de papel).
 * 3. Tirar del lazo: se deshace, el sobre se abre con flores y sale el juego.
 */
type Fase = 'colgando' | 'leyendo' | 'volando' | 'cerrado' | 'desatando' | 'abriendo' | 'revelando'

const emit = defineEmits<{ revelar: []; fin: [] }>()

const fase = ref<Fase>('colgando')
const raiz = ref<HTMLElement | null>(null)
const sobre = ref<SVGSVGElement | null>(null)
const etiqueta = ref<HTMLElement | null>(null)

/** Punto del sobre (en unidades del SVG) donde está el agujero de la etiqueta. */
const CUELGUE = { x: 190, y: 122 }
const ANCHO_SOBRE = 300
const ALTO_SOBRE = 204

const temporizadores: number[] = []
const despues = (ms: number, fn: () => void) => temporizadores.push(window.setTimeout(fn, ms))

/* ---------- La etiqueta cuelga exactamente del cordel ---------- */

function colocarEtiqueta() {
  const svg = sobre.value
  const et = etiqueta.value
  const r0 = raiz.value
  if (!svg || !et || !r0) return
  const r = svg.getBoundingClientRect()
  const x = r.left + (r.width * CUELGUE.x) / ANCHO_SOBRE
  const y = r.top + (r.height * CUELGUE.y) / ALTO_SOBRE
  r0.style.setProperty('--colgar-x', `${x - window.innerWidth / 2}px`)
  r0.style.setProperty('--colgar-y', `${y - window.innerHeight / 2}px`)
  r0.style.setProperty('--s-colgar', String((r.width * 0.3) / et.offsetWidth))
}

onMounted(() => {
  colocarEtiqueta()
  // Las fuentes pueden cambiar el tamaño; se recoloca cuando cargan.
  document.fonts?.ready.then(colocarEtiqueta)
  window.addEventListener('resize', colocarEtiqueta)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', colocarEtiqueta)
  temporizadores.forEach(clearTimeout)
  sonido.cajita(false)
})

/* ---------- 1 y 2: la etiqueta ---------- */

function tocarEtiqueta() {
  if (fase.value === 'colgando') {
    fase.value = 'leyendo'
    sonido.papel()
    sonido.giroEtiqueta()
    despues(900, () => sonido.cajita(true))
  } else if (fase.value === 'leyendo') {
    fase.value = 'volando'
    sonido.vuelo()
    despues(850, () => (fase.value = 'cerrado'))
  }
}

/* ---------- 3: tirar del lazo ---------- */

const tiron = ref({ x: 0, y: 0, fuerza: 0 })
let inicio: { x: number; y: number } | null = null
let movido = false
const DISTANCIA_PARA_SOLTAR = 140

function bajarLazo(e: PointerEvent) {
  if (fase.value !== 'cerrado') return
  inicio = { x: e.clientX, y: e.clientY }
  movido = false
  ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  sonido.cinta()
}

function moverLazo(e: PointerEvent) {
  if (!inicio || !sobre.value) return
  const dx = e.clientX - inicio.x
  const dy = e.clientY - inicio.y
  const d = Math.hypot(dx, dy)
  if (d > 8) movido = true
  // El cabo sigue al dedo, pero con resistencia y sin pasar de cierta longitud.
  const escala = ANCHO_SOBRE / sobre.value.getBoundingClientRect().width
  const limite = Math.min(d, DISTANCIA_PARA_SOLTAR * 1.2)
  const k = d ? (limite / d) * 0.6 * escala : 0
  tiron.value = { x: dx * k, y: dy * k, fuerza: Math.min(1, d / DISTANCIA_PARA_SOLTAR) }
}

function soltarLazo() {
  if (!inicio) return
  inicio = null
  if (!movido || tiron.value.fuerza >= 0.6) desatar()
  else tiron.value = { x: 0, y: 0, fuerza: 0 }
}

function desatar() {
  if (fase.value !== 'cerrado') return
  fase.value = 'desatando'
  tiron.value = { x: 0, y: 0, fuerza: 0 }
  sonido.lazoSuelto()
  despues(900, () => {
    fase.value = 'abriendo'
    sonido.cajita(false)
    sonido.sobreAbre()
  })
  despues(1500, () => sonido.entrar(true))
  despues(2500, () => {
    fase.value = 'revelando'
    emit('revelar')
  })
  despues(3500, () => emit('fin'))
}

/* ---------- Pétalos y flores que salen al abrir ---------- */

const COLORES = ['#f06292', '#ff8a65', '#ffd54f', '#b39ddb', '#ffffff', '#f48fb1', '#80deea']
const petalos = Array.from({ length: 26 }, (_, i) => {
  const angulo = (-165 + Math.random() * 150) * (Math.PI / 180)
  const distancia = 30 + Math.random() * 32
  return {
    id: i,
    color: COLORES[i % COLORES.length],
    estilo: {
      '--dx': `${Math.cos(angulo) * distancia}vmin`,
      '--dy': `${Math.sin(angulo) * distancia - 6}vmin`,
      '--giro': `${(Math.random() - 0.5) * 540}deg`,
      '--retraso': `${Math.random() * 0.35}s`,
      '--tam': `${14 + Math.random() * 16}px`,
    },
  }
})

const pista = computed(() => {
  switch (fase.value) {
    case 'colgando':
      return 'Toca la tarjeta'
    case 'leyendo':
      return 'Toca la tarjeta para seguir'
    case 'cerrado':
      return 'Tira del lazo'
    default:
      return ''
  }
})

const estiloTiron = computed(() => ({
  '--fuerza': String(tiron.value.fuerza),
}))

/** El cabo se estira desde el nudo hasta donde está el dedo. */
const cabo = computed(() => {
  const { x, y } = tiron.value
  const px = 238 + x
  const py = 150 + y
  return {
    d: `M208 110 L${px} ${py} L${px - 8} ${py + 1} L${px - 6} ${py + 10} L212 114 Z`,
    cx: 232 + x,
    cy: 150 + y,
  }
})
</script>

<template>
  <div ref="raiz" class="regalo" :class="`fase-${fase}`" :style="estiloTiron">
    <div class="escenario">
      <svg
        ref="sobre"
        class="sobre"
        viewBox="0 0 300 204"
        role="img"
        aria-label="Un sobre verde con un lazo dorado y flores"
      >
        <defs>
          <symbol id="flor" viewBox="-10 -10 20 20">
            <g fill="currentColor">
              <ellipse cx="0" cy="-4.6" rx="3.3" ry="4.8" />
              <ellipse cx="0" cy="-4.6" rx="3.3" ry="4.8" transform="rotate(72)" />
              <ellipse cx="0" cy="-4.6" rx="3.3" ry="4.8" transform="rotate(144)" />
              <ellipse cx="0" cy="-4.6" rx="3.3" ry="4.8" transform="rotate(216)" />
              <ellipse cx="0" cy="-4.6" rx="3.3" ry="4.8" transform="rotate(288)" />
            </g>
            <circle r="2.4" fill="#ffcf4a" />
            <circle r="1.1" fill="#e89a1c" />
          </symbol>
          <symbol id="hoja" viewBox="-6 -12 12 24">
            <path d="M0 11 Q-6 0 0 -11 Q6 0 0 11 Z" fill="currentColor" />
            <path d="M0 9 L0 -8" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" />
          </symbol>
          <linearGradient id="esmeralda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#14775a" />
            <stop offset="1" stop-color="#0c5541" />
          </linearGradient>
          <linearGradient id="esmeralda-solapa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1a8a68" />
            <stop offset="1" stop-color="#127055" />
          </linearGradient>
          <linearGradient id="oro-v" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#b9852b" />
            <stop offset="0.35" stop-color="#f3d27c" />
            <stop offset="0.65" stop-color="#e4b551" />
            <stop offset="1" stop-color="#b47f26" />
          </linearGradient>
          <linearGradient id="oro-h" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b9852b" />
            <stop offset="0.35" stop-color="#f3d27c" />
            <stop offset="0.65" stop-color="#e4b551" />
            <stop offset="1" stop-color="#b47f26" />
          </linearGradient>
          <radialGradient id="oro-lazo" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stop-color="#f8e2a0" />
            <stop offset="0.6" stop-color="#e2b04e" />
            <stop offset="1" stop-color="#a8741f" />
          </radialGradient>
        </defs>

        <!-- Sombra sobre la mesa -->
        <ellipse class="sombra" cx="150" cy="214" rx="140" ry="9" />

        <!-- Interior del sobre -->
        <rect x="0" y="0" width="300" height="204" rx="10" fill="#073b2c" />

        <!-- Solapa abierta (queda por detrás de la carta) -->
        <path class="solapa-abierta" d="M2 0 L150 -104 L298 0 Z" fill="url(#esmeralda-solapa)" />

        <!-- La carta de dentro, que sube al abrir -->
        <g class="carta">
          <rect x="20" y="12" width="260" height="178" rx="6" fill="#fffaf1" />
          <g transform="translate(150 52)">
            <circle r="17" fill="#23264d" />
            <path d="M0 0 L0 -15 A15 15 0 0 1 15 0 Z" fill="#3ba55c" />
            <path d="M0 0 L15 0 A15 15 0 0 1 0 15 Z" fill="#3d7be0" />
            <path d="M0 0 L0 15 A15 15 0 0 1 -15 0 Z" fill="#f5b700" />
            <path d="M0 0 L-15 0 A15 15 0 0 1 0 -15 Z" fill="#e5484d" />
          </g>
          <text x="150" y="92" text-anchor="middle" class="carta-titulo">Trivia Cristiano</text>
        </g>

        <!-- Cara del sobre con sus pliegues y flores -->
        <g class="bolsillo">
          <rect x="0" y="0" width="300" height="204" rx="10" fill="url(#esmeralda)" />
          <path d="M4 200 L150 116 L296 200" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="1.4" />
          <path d="M4 200 L150 116 L296 200" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" transform="translate(0 1.5)" />
          <g class="ramo">
            <use href="#hoja" x="6" y="150" width="14" height="28" color="#5fbf8a" transform="rotate(-35 13 164)" />
            <use href="#hoja" x="40" y="160" width="12" height="24" color="#4caf7d" transform="rotate(40 46 172)" />
            <use href="#hoja" x="22" y="140" width="10" height="20" color="#7cd3a0" transform="rotate(-8 27 150)" />
            <use href="#flor" x="4" y="160" width="30" height="30" color="#f06292" />
            <use href="#flor" x="28" y="170" width="24" height="24" color="#ffd54f" />
            <use href="#flor" x="18" y="146" width="20" height="20" color="#ff8a65" />
            <use href="#flor" x="46" y="182" width="16" height="16" color="#b39ddb" />
            <use href="#flor" x="0" y="186" width="14" height="14" color="#ffffff" />
          </g>
          <g class="ramo-pequeno">
            <use href="#hoja" x="276" y="160" width="10" height="20" color="#5fbf8a" transform="rotate(25 281 170)" />
            <use href="#flor" x="270" y="176" width="20" height="20" color="#f48fb1" />
            <use href="#flor" x="258" y="186" width="13" height="13" color="#ffd54f" />
            <use href="#flor" x="284" y="190" width="11" height="11" color="#ffffff" />
          </g>
        </g>

        <!-- Solapa cerrada -->
        <path
          class="solapa-cerrada"
          d="M0 8 Q0 0 8 0 L292 0 Q300 0 300 8 L150 114 Z"
          fill="url(#esmeralda-solapa)"
          stroke="rgba(0,0,0,0.12)"
          stroke-width="1"
        />

        <!-- La cinta dorada que envuelve el sobre -->
        <rect class="cinta cinta-v" x="196" y="-2" width="16" height="208" fill="url(#oro-v)" />
        <rect class="cinta cinta-h" x="-2" y="96" width="304" height="16" fill="url(#oro-h)" />

        <!-- Cordel de la etiqueta -->
        <path class="cordel" d="M203 108 Q196 118 190 122" fill="none" stroke="#8a6a3c" stroke-width="1.3" stroke-linecap="round" />

        <!-- El lazo y sus cabos -->
        <g class="lazo">
          <g class="cabo-quieto">
            <path d="M200 110 L182 150 L189 148 L192 157 L206 113 Z" fill="url(#oro-lazo)" />
          </g>
          <g class="lazo-lazadas">
            <path d="M204 104 C186 78 158 84 166 102 C172 116 194 112 204 104 Z" fill="url(#oro-lazo)" />
            <path d="M204 104 C222 78 250 84 242 102 C236 116 214 112 204 104 Z" fill="url(#oro-lazo)" />
            <path d="M204 104 C190 92 176 94 175 101" fill="none" stroke="rgba(120,80,20,0.35)" stroke-width="1.2" />
            <path d="M204 104 C218 92 232 94 233 101" fill="none" stroke="rgba(120,80,20,0.35)" stroke-width="1.2" />
            <ellipse cx="204" cy="105" rx="8" ry="7" fill="url(#oro-lazo)" />
          </g>
          <!-- El cabo del que se tira -->
          <g
            class="cabo-tirar"
            role="button"
            tabindex="0"
            aria-label="Tirar del lazo para abrir el regalo"
            @pointerdown="bajarLazo"
            @pointermove="moverLazo"
            @pointerup="soltarLazo"
            @pointercancel="soltarLazo"
            @keydown.enter.prevent="desatar"
            @keydown.space.prevent="desatar"
          >
            <path :d="cabo.d" fill="url(#oro-lazo)" />
            <circle :cx="cabo.cx" :cy="cabo.cy" r="26" fill="transparent" />
          </g>
        </g>
      </svg>
    </div>

    <!-- La etiqueta de cartón kraft -->
    <button
      ref="etiqueta"
      type="button"
      class="etiqueta"
      :aria-label="fase === 'colgando' ? `Tarjeta para ${DEDICATORIA.para}: tócala para leerla` : 'Seguir'"
      :disabled="fase !== 'colgando' && fase !== 'leyendo'"
      @click="tocarEtiqueta"
    >
      <span class="balanceo">
        <span class="giro">
          <!-- Cara de delante: «Para Paula» -->
          <span class="cara cara-delante">
            <span class="ojal" />
            <span class="para">Para</span>
            <span class="nombre">{{ DEDICATORIA.para }}</span>
            <svg class="ramito" viewBox="0 0 60 40" aria-hidden="true">
              <use href="#hoja" x="2" y="10" width="12" height="24" color="#6b8f4e" transform="rotate(-50 8 22)" />
              <use href="#flor" x="10" y="12" width="22" height="22" color="#e85d8a" />
              <use href="#flor" x="28" y="18" width="16" height="16" color="#f2a541" />
              <use href="#flor" x="40" y="10" width="12" height="12" color="#9b7fd1" />
            </svg>
          </span>
          <!-- Cara de detrás: la dedicatoria -->
          <span class="cara cara-detras">
            <span class="ojal" />
            <span class="saludo">{{ DEDICATORIA.saludo }}</span>
            <span class="mensaje">{{ DEDICATORIA.mensaje }}</span>
            <span class="cita">«{{ DEDICATORIA.cita }}»</span>
            <span class="referencia">{{ DEDICATORIA.referencia }}</span>
            <span class="firma">{{ DEDICATORIA.firma }}</span>
          </span>
        </span>
      </span>
    </button>

    <!-- Pétalos y flores al abrir -->
    <div class="petalos" aria-hidden="true">
      <svg v-for="p in petalos" :key="p.id" class="petalo" viewBox="-10 -10 20 20" :style="p.estilo" :color="p.color">
        <use href="#flor" x="-10" y="-10" width="20" height="20" />
      </svg>
    </div>

    <p class="pista" :class="{ visible: pista }" aria-live="polite">
      <span v-if="fase === 'cerrado'" class="flecha" aria-hidden="true">⟶</span>
      {{ pista }}
    </p>
  </div>
</template>

<style scoped>
.regalo {
  --w: min(92vw, 540px, calc((100dvh - 150px) * 1.47));
  --et-w: min(86vw, 390px, 58dvh);
  --tinta-regalo: #4a2a3a;
  --kraft: #c9a47b;

  position: fixed;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 42%, #fff7f2 0%, #f6e4dd 45%, #e8cbc2 100%);
  color: var(--tinta-regalo);
  font-family: 'Lora', Georgia, serif;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transition: opacity 1s ease;
}

/* ---------- El sobre ---------- */

.escenario {
  width: var(--w);
  aspect-ratio: 300 / 204;
  transition: transform 1s cubic-bezier(0.3, 0, 0.2, 1), filter 0.6s ease, opacity 0.6s ease;
  animation: llega 1.1s cubic-bezier(0.2, 0.9, 0.3, 1.1) backwards;
}

.sobre {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 18px 28px rgba(90, 40, 40, 0.22));
}

.sombra {
  fill: rgba(80, 30, 30, 0.12);
}

.carta-titulo {
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: 15px;
  fill: #23264d;
}

/* Partes que se mueven (las transformaciones van en el espacio del SVG) */
.solapa-abierta,
.solapa-cerrada,
.carta,
.cinta,
.lazo-lazadas,
.cabo-quieto,
.cabo-tirar,
.cordel {
  transform-box: view-box;
}

.solapa-abierta {
  transform-origin: 150px 0;
  transform: scaleY(0);
  transition: transform 0.35s ease-out 0.33s;
}

.solapa-cerrada {
  transform-origin: 150px 0;
  transition: transform 0.33s ease-in;
}

.carta {
  transition: transform 0.9s cubic-bezier(0.2, 0.85, 0.25, 1) 0.55s;
}

.cinta {
  transition: transform 0.8s cubic-bezier(0.5, 0, 0.75, 0) 0.2s, opacity 0.5s ease 0.45s;
}

.lazo-lazadas {
  transform-origin: 204px 105px;
  transform: scale(calc(1 - var(--fuerza) * 0.22));
  transition: transform 0.25s ease;
}

.cabo-tirar {
  cursor: grab;
  touch-action: none;
  outline: none;
}

.cabo-tirar:focus-visible path {
  stroke: #fff;
  stroke-width: 2;
}

.cordel {
  transition: opacity 0.3s ease;
}

/* Mientras cuelga la etiqueta o se lee, el cabo no se puede tocar */
.regalo:not(.fase-cerrado) .cabo-tirar {
  pointer-events: none;
}

/* El cabo invita a tirar cuando ya se puede */
.fase-cerrado .cabo-tirar {
  animation: invita 1.6s ease-in-out infinite;
}

.fase-cerrado .cabo-tirar:active {
  cursor: grabbing;
  animation: none;
}

/* Al leer, el sobre queda en segundo plano */
.fase-leyendo .escenario {
  filter: blur(3px);
  opacity: 0.45;
  transform: scale(0.96);
}

.fase-leyendo .cordel,
.fase-volando .cordel,
.fase-cerrado .cordel,
.fase-desatando .cordel,
.fase-abriendo .cordel,
.fase-revelando .cordel {
  opacity: 0;
}

/* Se deshace el lazo */
.fase-desatando .lazo-lazadas,
.fase-abriendo .lazo-lazadas,
.fase-revelando .lazo-lazadas {
  transform: translateY(26px) rotate(-25deg) scale(0.2);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.45s ease 0.15s;
}

.fase-desatando .cabo-quieto,
.fase-abriendo .cabo-quieto,
.fase-revelando .cabo-quieto,
.fase-desatando .cabo-tirar,
.fase-abriendo .cabo-tirar,
.fase-revelando .cabo-tirar {
  transform: translate(40px, 70px) rotate(20deg);
  opacity: 0;
  transition: transform 0.6s ease-in, opacity 0.4s ease 0.2s;
}

.fase-desatando .cinta-v,
.fase-abriendo .cinta-v,
.fase-revelando .cinta-v {
  transform: translateY(240px);
  opacity: 0;
}

.fase-desatando .cinta-h,
.fase-abriendo .cinta-h,
.fase-revelando .cinta-h {
  transform: translateX(340px);
  opacity: 0;
}

/* Se abre el sobre y sube la carta */
.fase-abriendo .solapa-cerrada,
.fase-revelando .solapa-cerrada {
  transform: scaleY(0);
}

.fase-abriendo .solapa-abierta,
.fase-revelando .solapa-abierta {
  transform: scaleY(1);
}

.fase-abriendo .carta,
.fase-revelando .carta {
  transform: translateY(-96px);
}

/* Final: la escena se acerca y se funde con la portada */
.fase-revelando {
  opacity: 0;
}

.fase-revelando .escenario {
  transform: scale(1.35) translateY(8%);
}

/* ---------- La etiqueta ---------- */

.etiqueta {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: var(--et-w);
  aspect-ratio: 0.76;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  /* El punto de giro es el agujero de la cara de delante (arriba a la derecha) */
  transform-origin: 88% 7%;
  transform: translate(calc(var(--colgar-x, 0px) - 88%), calc(var(--colgar-y, 0px) - 7%)) scale(var(--s-colgar, 0.3));
  transition: transform 0.95s cubic-bezier(0.25, 1.25, 0.35, 1);
  animation: aparece-etiqueta 0.6s ease 0.9s backwards;
  -webkit-tap-highlight-color: transparent;
}

.etiqueta:disabled {
  cursor: default;
}

.etiqueta:focus-visible {
  outline: none;
}

.etiqueta:focus-visible .cara {
  box-shadow: 0 0 0 4px #fff, 0 0 0 7px var(--tinta-regalo);
}

.fase-leyendo .etiqueta {
  transform: translate(-50%, calc(-50% - 14px)) scale(1);
}

.fase-volando .etiqueta,
.fase-cerrado .etiqueta,
.fase-desatando .etiqueta,
.fase-abriendo .etiqueta,
.fase-revelando .etiqueta {
  transform: translate(calc(50vw + 30%), calc(-50% - 22vh)) rotate(28deg) scale(0.85);
  transition: transform 0.8s cubic-bezier(0.55, 0, 0.8, 0.2);
}

.fase-cerrado .etiqueta,
.fase-desatando .etiqueta,
.fase-abriendo .etiqueta,
.fase-revelando .etiqueta {
  visibility: hidden;
}

.balanceo {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: 88% 7%;
  perspective: 1400px;
}

.fase-colgando .balanceo {
  animation: balanceo 3.2s ease-in-out infinite;
}

.giro {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.9s cubic-bezier(0.3, 0.9, 0.3, 1) 0.08s;
}

.fase-leyendo .giro,
.fase-volando .giro,
.fase-cerrado .giro,
.fase-desatando .giro,
.fase-abriendo .giro,
.fase-revelando .giro {
  transform: rotateY(180deg);
}

.cara {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 3%;
  background-color: var(--kraft);
  /* Fibra de cartón kraft: ruido generado con un filtro SVG, sin imágenes */
  background-image:
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0 0.09  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23f)' opacity='0.45'/></svg>"),
    linear-gradient(165deg, #d7b68e 0%, #c69f74 55%, #bb9268 100%);
  background-size: 180px 180px, 100% 100%;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 215, 0.25),
    inset 0 0 calc(var(--et-w) * 0.08) rgba(110, 70, 30, 0.25),
    0 12px 30px rgba(80, 40, 30, 0.28);
  font-size: calc(var(--et-w) * 0.043);
  color: #3e2a1c;
  text-align: left;
}

/* Agujero con su refuerzo, recortado de verdad en la cartulina */
.cara-delante {
  align-items: center;
  justify-content: center;
  gap: 0.2em;
  clip-path: polygon(0 0, 80% 0, 100% 10%, 100% 100%, 0 100%);
  -webkit-mask: radial-gradient(circle at 88% 7%, transparent calc(var(--et-w) * 0.032), #000 calc(var(--et-w) * 0.034));
  mask: radial-gradient(circle at 88% 7%, transparent calc(var(--et-w) * 0.032), #000 calc(var(--et-w) * 0.034));
}

.cara-detras {
  transform: rotateY(180deg);
  padding: 16% 10% 9% 11%;
  gap: 0.75em;
  clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 10%);
  -webkit-mask: radial-gradient(circle at 12% 7%, transparent calc(var(--et-w) * 0.032), #000 calc(var(--et-w) * 0.034));
  mask: radial-gradient(circle at 12% 7%, transparent calc(var(--et-w) * 0.032), #000 calc(var(--et-w) * 0.034));
}

.ojal {
  position: absolute;
  width: calc(var(--et-w) * 0.11);
  aspect-ratio: 1;
  top: 7%;
  border-radius: 50%;
  translate: -50% -50%;
  background: radial-gradient(circle, transparent 29%, #e9d7b8 31%, #dcc49d 58%, rgba(0, 0, 0, 0) 61%);
  box-shadow: 0 0 0 0.5px rgba(90, 60, 30, 0.15);
}

.cara-delante .ojal {
  left: 88%;
}

.cara-detras .ojal {
  left: 12%;
}

.para {
  font-style: italic;
  font-size: 1.4em;
  opacity: 0.8;
  margin-top: 6%;
}

.nombre {
  font-family: 'Dancing Script', cursive;
  font-weight: 700;
  font-size: 4.2em;
  line-height: 1;
  color: #5a2f3c;
}

.ramito {
  position: absolute;
  left: 7%;
  bottom: 6%;
  width: 34%;
}

.saludo {
  font-family: 'Dancing Script', cursive;
  font-weight: 700;
  font-size: 2.3em;
  line-height: 1;
  color: #5a2f3c;
}

.mensaje {
  font-size: 1.12em;
  line-height: 1.55;
}

.cita {
  font-style: italic;
  font-size: 1em;
  line-height: 1.55;
  padding-left: 0.9em;
  border-left: 2px solid rgba(90, 47, 60, 0.35);
}

.referencia {
  margin-top: -0.4em;
  padding-left: 0.9em;
  font-size: 0.85em;
  opacity: 0.75;
}

.firma {
  margin-top: auto;
  font-family: 'Dancing Script', cursive;
  font-weight: 700;
  font-size: 2.4em;
  line-height: 1;
  color: #5a2f3c;
  transform: rotate(-6deg);
  transform-origin: left center;
}

/* ---------- Pétalos ---------- */

.petalos {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.petalo {
  position: absolute;
  left: 50%;
  top: 46%;
  width: var(--tam);
  height: var(--tam);
  margin: calc(var(--tam) / -2) 0 0 calc(var(--tam) / -2);
  opacity: 0;
}

.fase-abriendo .petalo,
.fase-revelando .petalo {
  animation: brota 1.8s cubic-bezier(0.15, 0.7, 0.3, 1) calc(0.35s + var(--retraso)) both;
}

/* ---------- Indicaciones ---------- */

.pista {
  position: fixed;
  left: 0;
  right: 0;
  bottom: max(28px, env(safe-area-inset-bottom));
  margin: 0;
  text-align: center;
  font-style: italic;
  font-size: 1.15rem;
  color: var(--tinta-regalo);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.pista.visible {
  opacity: 0.75;
  animation: respira 2.4s ease-in-out infinite;
}

.flecha {
  display: inline-block;
  margin-right: 0.3em;
  font-style: normal;
}

/* ---------- Animaciones ---------- */

@keyframes llega {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.94);
  }
}

@keyframes aparece-etiqueta {
  from {
    opacity: 0;
  }
}

@keyframes balanceo {
  0%,
  100% {
    transform: rotate(-4deg);
  }
  50% {
    transform: rotate(4deg);
  }
}

@keyframes invita {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 3px 4px;
  }
}

@keyframes brota {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.3) rotate(0deg);
  }
  15% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(1) rotate(var(--giro));
  }
}

@keyframes respira {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 0.85;
  }
}

@media (max-width: 600px) {
  .pista {
    font-size: 1rem;
  }
}
</style>
