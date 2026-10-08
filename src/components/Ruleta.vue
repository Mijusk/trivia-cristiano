<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Casilla } from '../types'
import { sonido } from '../audio/sonido'
import { INFO_PRUEBA, INFO_TEMA } from '../game/config'

/**
 * Ruleta con una porción por cada casilla pendiente de la pareja. El color es
 * el tema y el icono la prueba. Primero se decide la casilla al azar y luego
 * se anima la rueda para que se pare justo en ella.
 */
const props = defineProps<{ casillas: Casilla[] }>()
const emit = defineEmits<{ empieza: []; resultado: [casilla: Casilla] }>()

const R = 150
const rotacion = ref(0)
const girando = ref(false)
const elegida = ref<number | null>(null)
let seguridad: ReturnType<typeof setTimeout> | undefined
let pendiente = -1

const giro = ref<SVGGElement | null>(null)
let animacion = 0

/** Mientras gira, suena un tic cada vez que una casilla pasa por el indicador. */
function seguirTics() {
  let ultima = -1
  const paso = () => {
    const el = giro.value
    if (!el || !girando.value) return
    const m = getComputedStyle(el).transform
    const partes = m.startsWith('matrix(') ? m.slice(7, -1).split(',').map(Number) : null
    if (partes) {
      const grados = (Math.atan2(partes[1], partes[0]) * 180) / Math.PI
      const bajoIndicador = ((360 - grados) % 360 + 360) % 360
      const casilla = Math.floor(bajoIndicador / angulo.value)
      if (ultima !== -1 && casilla !== ultima) sonido.tic()
      ultima = casilla
    }
    animacion = requestAnimationFrame(paso)
  }
  animacion = requestAnimationFrame(paso)
}

const n = computed(() => props.casillas.length)
const angulo = computed(() => 360 / Math.max(1, n.value))

function punto(radio: number, grados: number) {
  const rad = (grados * Math.PI) / 180
  return `${(radio * Math.sin(rad)).toFixed(2)} ${(-radio * Math.cos(rad)).toFixed(2)}`
}

const porciones = computed(() =>
  props.casillas.map((c, i) => {
    const inicio = i * angulo.value
    const fin = inicio + angulo.value
    const centro = inicio + angulo.value / 2
    const grande = angulo.value > 180 ? 1 : 0
    return {
      clave: `${c.tema}:${c.prueba}`,
      d: `M0 0 L${punto(R, inicio)} A${R} ${R} 0 ${grande} 1 ${punto(R, fin)} Z`,
      color: INFO_TEMA[c.tema].color,
      icono: INFO_PRUEBA[c.prueba].icono,
      centro,
      tamanoIcono: n.value > 12 ? 20 : n.value > 6 ? 26 : 32,
    }
  }),
)

function girar() {
  if (girando.value || n.value === 0) return
  const i = Math.floor(Math.random() * n.value)
  const a = angulo.value
  // Un poco de variación para que no pare siempre en el centro de la porción.
  const destino = (i + 0.5) * a + (Math.random() - 0.5) * a * 0.6
  const vueltas = Math.ceil(rotacion.value / 360) * 360 + 360 * 5
  elegida.value = null
  girando.value = true
  rotacion.value = vueltas + (360 - destino)
  emit('empieza')
  if (n.value > 1) seguirTics()
  // Por si el navegador no avisa del final de la animación.
  pendiente = i
  clearTimeout(seguridad)
  seguridad = setTimeout(() => terminar(i), 5200)
}


function alTerminarTransicion(e: TransitionEvent) {
  if (e.propertyName === 'transform') terminar(pendiente)
}

function terminar(i: number) {
  if (!girando.value) return
  clearTimeout(seguridad)
  cancelAnimationFrame(animacion)
  girando.value = false
  elegida.value = i
  sonido.ruletaPara()
  try {
    navigator.vibrate?.(60)
  } catch {
    /* sin vibración */
  }
  emit('resultado', props.casillas[i])
}

defineExpose({ girar, girando })
</script>

<template>
  <div class="ruleta">
    <svg class="indicador" viewBox="0 0 40 34" aria-hidden="true">
      <path d="M4 2 H36 L20 32 Z" />
    </svg>
    <svg class="rueda" viewBox="-160 -160 320 320" role="img" :aria-label="`Ruleta con ${n} casillas`">
      <circle r="158" class="aro" />
      <g
        ref="giro"
        class="giro"
        :style="{ transform: `rotate(${rotacion}deg)` }"
        @transitionend="alTerminarTransicion"
      >
        <circle v-if="n === 1" :r="R" :style="{ fill: porciones[0].color }" />
        <template v-else>
          <path
            v-for="(p, i) in porciones"
            :key="p.clave"
            :d="p.d"
            :style="{ fill: p.color }"
            :class="{ apagada: elegida !== null && elegida !== i }"
          />
        </template>
        <text
          v-for="p in porciones"
          :key="`i-${p.clave}`"
          :transform="`rotate(${p.centro}) translate(0 ${-R * 0.7}) rotate(${-p.centro})`"
          :font-size="p.tamanoIcono"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ p.icono }}
        </text>
      </g>
      <circle r="26" class="centro" />
    </svg>
  </div>
</template>

<style scoped>
.ruleta {
  position: relative;
  width: min(100%, 340px);
  margin: 0 auto;
}

.rueda {
  display: block;
  width: 100%;
  height: auto;
}

.aro {
  fill: var(--mesa-claro);
  stroke: var(--sobre-mesa);
  stroke-width: 4;
}

.giro {
  transform-origin: 0 0;
  transition: transform 4.2s cubic-bezier(0.12, 0.7, 0.16, 1);
}

path {
  stroke: var(--mesa);
  stroke-width: 2.5;
  stroke-linejoin: round;
  transition: opacity 0.3s ease;
}

path.apagada {
  opacity: 0.35;
}

.centro {
  fill: var(--mesa);
  stroke: var(--sobre-mesa);
  stroke-width: 4;
}

.indicador {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 34px;
  transform: translateX(-50%);
  z-index: 1;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.35));
}

.indicador path {
  fill: var(--sobre-mesa);
  stroke: var(--mesa);
  stroke-width: 3;
  stroke-linejoin: round;
}
</style>
