<script setup lang="ts">
import { FONDO, rutaSvg, type Dibujo } from '../game/pizarra'

/** El dibujo de la pizarra, ya terminado (en el resultado). */
defineProps<{ dibujo: Dibujo }>()
</script>

<template>
  <svg
    class="dibujo-vista"
    :viewBox="`0 0 1 ${dibujo.proporcion}`"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="El dibujo de este turno"
  >
    <rect width="1" :height="dibujo.proporcion" :fill="FONDO" />
    <path
      v-for="(t, i) in dibujo.trazos"
      :key="i"
      :d="rutaSvg(t.puntos)"
      :stroke="t.color"
      :stroke-width="t.grosor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.dibujo-vista {
  display: block;
  border-radius: 14px;
  box-shadow: var(--sombra-carta);
}
</style>
