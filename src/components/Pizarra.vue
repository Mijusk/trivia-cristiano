<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { COLORES, FACTOR_GOMA, FONDO, GROSORES, pintarTrazo, redondear, type Dibujo, type Trazo } from '../game/pizarra'

/** Pizarra para dibujar con el dedo: colores, grosores, goma y deshacer. */
const modelo = defineModel<Dibujo>({ required: true })
const props = defineProps<{ bloqueada?: boolean }>()

const marco = ref<HTMLDivElement | null>(null)
const lienzo = ref<HTMLCanvasElement | null>(null)
const color = ref<string>(COLORES[0].color)
const grosor = ref<number>(GROSORES[1].grosor)
const goma = ref(false)

// Los trazos no son reactivos: se pintan a mano en el lienzo y se publican al acabar cada uno.
const trazos: Trazo[] = modelo.value.trazos.map((t) => ({ ...t, puntos: [...t.puntos] }))
const numTrazos = ref(trazos.length)
let ctx: CanvasRenderingContext2D | null = null
let ancho = 0
let alto = 0
/** El dedo que está dibujando: un segundo dedo (o la palma) no pinta. */
let dedo: number | null = null
let actual: Trazo | null = null

function publicar() {
  if (ancho) modelo.value = { proporcion: redondear(alto / ancho), trazos: trazos.slice() }
}

function repintar() {
  if (!ctx) return
  ctx.fillStyle = FONDO
  ctx.fillRect(0, 0, ancho, alto)
  for (const t of trazos) pintarTrazo(ctx, t, ancho)
}

/** Ajusta el lienzo al tamaño del marco (y a la densidad de la pantalla) y vuelve a pintar. */
function ajustar() {
  const m = marco.value
  const c = lienzo.value
  if (!m || !c) return
  const r = m.getBoundingClientRect()
  if (!r.width || !r.height) return
  ancho = r.width
  alto = r.height
  const dpr = window.devicePixelRatio || 1
  c.width = Math.round(ancho * dpr)
  c.height = Math.round(alto * dpr)
  ctx = c.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  repintar()
  publicar()
}

function punto(e: PointerEvent): [number, number] {
  const r = lienzo.value!.getBoundingClientRect()
  return [redondear((e.clientX - r.left) / ancho), redondear((e.clientY - r.top) / ancho)]
}

function bajar(e: PointerEvent) {
  if (props.bloqueada || dedo !== null || !ctx) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dedo = e.pointerId
  lienzo.value?.setPointerCapture?.(e.pointerId)
  actual = {
    color: goma.value ? FONDO : color.value,
    grosor: goma.value ? redondear(grosor.value * FACTOR_GOMA) : grosor.value,
    puntos: punto(e),
  }
  trazos.push(actual)
  numTrazos.value = trazos.length
  pintarTrazo(ctx, actual, ancho)
}

function mover(e: PointerEvent) {
  if (e.pointerId !== dedo || !actual || !ctx) return
  const antes = actual.puntos.length / 2
  // Los movimientos intermedios que el navegador agrupa: con ellos la línea sale más suave.
  const eventos = e.getCoalescedEvents?.() ?? []
  for (const ev of eventos.length ? eventos : [e]) {
    const [x, y] = punto(ev)
    const n = actual.puntos.length
    if (actual.puntos[n - 2] !== x || actual.puntos[n - 1] !== y) actual.puntos.push(x, y)
  }
  if (actual.puntos.length / 2 > antes) pintarTrazo(ctx, actual, ancho, antes)
}

function soltar(e?: PointerEvent) {
  if (dedo === null || (e && e.pointerId !== dedo)) return
  dedo = null
  actual = null
  publicar()
}

function deshacer() {
  if (!trazos.length) return
  trazos.pop()
  numTrazos.value = trazos.length
  repintar()
  publicar()
}

function elegirColor(c: string) {
  color.value = c
  goma.value = false
}

// Si se acaba el tiempo con el dedo en la pizarra, el trazo se queda como está.
watch(
  () => props.bloqueada,
  (b) => {
    if (b) soltar()
  },
)

let observador: ResizeObserver | undefined
onMounted(() => {
  ajustar()
  observador = new ResizeObserver(ajustar)
  if (marco.value) observador.observe(marco.value)
})
onBeforeUnmount(() => observador?.disconnect())

/** Tamaño de la punta en los botones de grosor, como se verá en una pizarra de móvil. */
const punta = (g: number) => `${Math.max(4, Math.round(g * 360))}px`
</script>

<template>
  <div class="pizarra" :class="{ bloqueada }">
    <div ref="marco" class="marco">
      <canvas
        ref="lienzo"
        class="lienzo"
        aria-label="Pizarra: dibuja con el dedo"
        @pointerdown.prevent="bajar"
        @pointermove="mover"
        @pointerup="soltar"
        @pointercancel="soltar"
        @lostpointercapture="soltar"
        @contextmenu.prevent
      />
      <slot />
    </div>

    <div class="herramientas" role="toolbar" aria-label="Herramientas de la pizarra">
      <div class="fila">
        <button
          v-for="c in COLORES"
          :key="c.color"
          type="button"
          class="color"
          :class="{ activo: !goma && color === c.color }"
          :style="{ '--c': c.color }"
          :aria-label="c.nombre"
          :aria-pressed="!goma && color === c.color"
          @click="elegirColor(c.color)"
        />
        <button type="button" class="herramienta" :class="{ activo: goma }" :aria-pressed="goma" @click="goma = !goma">
          Goma
        </button>
      </div>
      <div class="fila">
        <button
          v-for="g in GROSORES"
          :key="g.grosor"
          type="button"
          class="herramienta grosor"
          :class="{ activo: grosor === g.grosor }"
          :aria-label="`Trazo ${g.nombre.toLowerCase()}`"
          :aria-pressed="grosor === g.grosor"
          @click="grosor = g.grosor"
        >
          <span class="punta" :style="{ width: punta(g.grosor), height: punta(g.grosor), background: goma ? '#c9cbe0' : color }" />
        </button>
        <button type="button" class="herramienta deshacer" :disabled="numTrazos === 0 || bloqueada" @click="deshacer">
          ↶ Deshacer
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pizarra {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.marco {
  position: relative;
  flex: 1;
  min-height: 200px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: var(--sombra-carta);
}

.lienzo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: crosshair;
}

.bloqueada .lienzo {
  cursor: default;
}

.bloqueada .herramientas {
  opacity: 0.45;
  pointer-events: none;
}

.herramientas {
  display: grid;
  gap: 8px;
}

.fila {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color {
  flex: 1 1 0;
  min-width: 0;
  max-width: 44px;
  aspect-ratio: 1;
  padding: 0;
  border: 3px solid var(--mesa-borde);
  border-radius: 50%;
  background: var(--c);
  cursor: pointer;
}

.color.activo {
  border-color: var(--sobre-mesa);
  box-shadow: 0 0 0 2px var(--mesa), 0 0 0 4px var(--sobre-mesa);
}

.herramienta {
  min-height: 42px;
  padding: 0 14px;
  display: inline-grid;
  place-items: center;
  border: 2px solid var(--mesa-borde);
  border-radius: 999px;
  background: var(--mesa-claro);
  color: var(--sobre-mesa);
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
}

.herramienta.activo {
  border-color: var(--sobre-mesa);
  background: var(--sobre-mesa);
  color: var(--tinta);
}

.herramienta:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fila:first-child .herramienta {
  margin-left: auto;
}

.grosor {
  width: 52px;
  padding: 0;
}

.punta {
  display: block;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.deshacer {
  flex: 1;
}

@media (max-height: 760px) {
  .herramientas {
    gap: 6px;
  }

  .color {
    max-width: 38px;
  }

  .herramienta {
    min-height: 38px;
  }
}
</style>
