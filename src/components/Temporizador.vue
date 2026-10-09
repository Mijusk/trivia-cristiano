<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ restante: number; fraccion: number; terminado: boolean; enMarcha: boolean }>()

const R = 42
const circunferencia = 2 * Math.PI * R
const trazo = computed(() => circunferencia * (1 - props.fraccion))
const urgente = computed(() => props.enMarcha && props.restante <= 10)
</script>

<template>
  <div class="temporizador" :class="{ urgente, terminado }" role="timer" aria-live="off">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" :r="R" class="fondo" />
      <circle
        cx="50"
        cy="50"
        :r="R"
        class="progreso"
        :stroke-dasharray="circunferencia"
        :stroke-dashoffset="trazo"
      />
    </svg>
    <span class="numero">{{ terminado ? '¡Tiempo!' : restante }}</span>
  </div>
</template>

<style scoped>
.temporizador {
  position: relative;
  width: 112px;
  height: 112px;
  margin: 0 auto;
  display: grid;
  place-items: center;
}

svg {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.fondo {
  fill: none;
  stroke: var(--mesa-claro);
  stroke-width: 9;
}

.progreso {
  fill: none;
  stroke: var(--sobre-mesa);
  stroke-width: 9;
  stroke-linecap: round;
  transition: stroke 0.3s ease;
}

.numero {
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: 2.2rem;
  font-variant-numeric: tabular-nums;
}

.urgente .progreso {
  stroke: var(--tema-profetas);
}

.terminado .numero {
  font-size: 1.15rem;
  color: var(--fallo);
}

.terminado .progreso {
  stroke: var(--fallo);
}
</style>
