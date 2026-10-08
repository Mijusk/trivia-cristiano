<script setup lang="ts">
import { sonido, sonidoActivado } from '../audio/sonido'
</script>

<template>
  <button
    type="button"
    class="boton-sonido"
    :aria-pressed="sonidoActivado"
    :aria-label="sonidoActivado ? 'Silenciar el sonido' : 'Activar el sonido'"
    @click="sonido.alternar()"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <template v-if="sonidoActivado">
        <path d="M15.5 9a4 4 0 0 1 0 6" class="onda" />
        <path d="M18 6.5a7.5 7.5 0 0 1 0 11" class="onda" />
      </template>
      <path v-else d="M16 9.5l5 5M21 9.5l-5 5" class="onda" />
    </svg>
  </button>
</template>

<style scoped>
.boton-sonido {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: var(--sobre-mesa);
  cursor: pointer;
}

svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.onda {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>
