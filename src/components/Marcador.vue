<script setup lang="ts">
import type { Modo, Pareja } from '../types'
import Quesera from './Quesera.vue'

defineProps<{ parejas: Pareja[]; modo: Modo; turno: number }>()
</script>

<template>
  <ol class="marcador" aria-label="Marcador">
    <li v-for="(p, i) in parejas" :key="p.id" :class="{ actual: i === turno }" :aria-current="i === turno ? 'true' : undefined">
      <Quesera :pareja="p" :modo="modo" :tamano="38" />
      <span class="nombre">{{ p.nombre }}</span>
    </li>
  </ol>
</template>

<style scoped>
.marcador {
  list-style: none;
  margin: 0;
  padding: 2px 2px 6px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  background: var(--mesa-claro);
  flex: none;
  opacity: 0.7;
}

li.actual {
  opacity: 1;
  box-shadow: inset 0 0 0 2px var(--sobre-mesa);
}

.nombre {
  font-weight: 700;
  font-size: 0.92rem;
  max-width: 9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
