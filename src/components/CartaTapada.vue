<script setup lang="ts">
import { ref } from 'vue'

/**
 * Carta boca abajo: solo se ve mientras se mantiene pulsada, para que la
 * pareja que tiene que adivinar no la lea por encima del hombro.
 */
const props = defineProps<{ color: string }>()
const emit = defineEmits<{ vista: [] }>()

const visible = ref(false)

function mostrar() {
  visible.value = true
  emit('vista')
}

function ocultar() {
  visible.value = false
}

function teclado(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (e.type === 'keydown') mostrar()
    else ocultar()
  }
}
</script>

<template>
  <button
    type="button"
    class="carta-tapada carta"
    :class="{ visible }"
    :style="{ '--color-tema': props.color }"
    aria-label="Mantén pulsado para ver la carta"
    @pointerdown.prevent="mostrar"
    @pointerup="ocultar"
    @pointerleave="ocultar"
    @pointercancel="ocultar"
    @contextmenu.prevent
    @keydown="teclado"
    @keyup="teclado"
  >
    <span v-if="!visible" class="dorso">
      <span class="dorso-texto">Mantén pulsado para ver</span>
    </span>
    <span v-else class="cara">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.carta-tapada {
  display: block;
  width: 100%;
  min-height: 220px;
  padding: 0;
  border: 0;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  text-align: center;
}

.dorso {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 24px;
  background:
    repeating-linear-gradient(45deg, transparent 0 14px, rgba(255, 255, 255, 0.14) 14px 28px),
    var(--color-tema);
}

.dorso-texto {
  background: var(--carta);
  color: var(--tinta);
  font-family: var(--fuente-titulo);
  font-weight: 800;
  padding: 0.6em 1.1em;
  border-radius: 999px;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
}

.cara {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 24px 20px;
  border-top: 10px solid var(--color-tema);
}
</style>
