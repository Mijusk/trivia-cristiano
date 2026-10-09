<script setup lang="ts">
import { computed } from 'vue'
import type { Modo, Pareja } from '../types'
import { INFO_TEMA, META_POR_TEMA, TEMAS } from '../game/config'
import { progresoTema } from '../game/reglas'

/**
 * La "ficha" de cada pareja: un círculo con un cuarto por tema, dividido en
 * tantos huecos como quesitos pide el modo. Los huecos ganados se rellenan.
 */
const props = withDefaults(defineProps<{ pareja: Pareja; modo: Modo; tamano?: number }>(), { tamano: 44 })

const R = 50

function punto(radio: number, grados: number) {
  const rad = (grados * Math.PI) / 180
  return `${(radio * Math.sin(rad)).toFixed(2)} ${(-radio * Math.cos(rad)).toFixed(2)}`
}

function cuña(inicio: number, fin: number) {
  const grande = fin - inicio > 180 ? 1 : 0
  return `M0 0 L${punto(R, inicio)} A${R} ${R} 0 ${grande} 1 ${punto(R, fin)} Z`
}

const huecos = computed(() => {
  const meta = META_POR_TEMA[props.modo]
  const paso = 90 / meta
  return TEMAS.flatMap((tema, t) => {
    const ganados = progresoTema(props.pareja, tema)
    return Array.from({ length: meta }, (_, j) => ({
      clave: `${tema}-${j}`,
      d: cuña(t * 90 + j * paso, t * 90 + (j + 1) * paso),
      color: INFO_TEMA[tema].color,
      lleno: j < ganados,
    }))
  })
})

const etiqueta = computed(() =>
  TEMAS.map((t) => `${INFO_TEMA[t].nombre}: ${progresoTema(props.pareja, t)} de ${META_POR_TEMA[props.modo]}`).join('. '),
)
</script>

<template>
  <svg
    class="quesera"
    :width="tamano"
    :height="tamano"
    viewBox="-54 -54 108 108"
    role="img"
    :aria-label="etiqueta"
  >
    <circle r="53" class="borde" />
    <path
      v-for="h in huecos"
      :key="h.clave"
      :d="h.d"
      :style="{ fill: h.color }"
      :class="{ vacio: !h.lleno }"
    />
  </svg>
</template>

<style scoped>
.quesera {
  display: block;
  flex: none;
}

.borde {
  fill: var(--mesa);
  stroke: var(--sobre-mesa-suave);
  stroke-width: 3;
}

path {
  stroke: var(--mesa);
  stroke-width: 3;
  stroke-linejoin: round;
  transition: opacity 0.4s ease;
}

path.vacio {
  opacity: 0.18;
}
</style>
