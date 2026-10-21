<script setup lang="ts">
import { computed } from 'vue'
import { usePartidaStore } from '../stores/partida'
import Quesera from './Quesera.vue'
import AvisarCarta from './AvisarCarta.vue'
import DibujoVista from './DibujoVista.vue'

const store = usePartidaStore()
const partida = computed(() => store.partida!)
const ganadora = computed(() => store.ganadora ?? store.parejaActual!)

function revancha() {
  // Se va a configurar con las mismas parejas; la partida se sustituye al empezar.
  store.irA('configurar')
}

function salir() {
  store.terminar()
}
</script>

<template>
  <section class="victoria" aria-live="polite">
    <div class="centro">
      <Quesera :pareja="ganadora" :modo="partida.modo" :temas="partida.temas" :tamano="180" class="ficha" />
      <p class="gana">Ha ganado</p>
      <h1>{{ ganadora.nombre }}</h1>
      <DibujoVista v-if="store.dibujo" :dibujo="store.dibujo" class="dibujo" :style="{ aspectRatio: `1 / ${store.dibujo.proporcion}` }" />
    </div>
    <div class="acciones">
      <button class="btn btn-principal btn-bloque" @click="revancha">Jugar otra vez</button>
      <button class="btn btn-secundario btn-bloque" @click="salir">Terminar</button>
      <!-- La carta con la que se ganó, por si tenía algún error. -->
      <AvisarCarta v-if="store.carta" :carta="store.carta" />
    </div>
  </section>
</template>

<style scoped>
.victoria {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.centro {
  margin: auto 0;
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.ficha {
  animation: gira 1.2s cubic-bezier(0.2, 1.2, 0.4, 1);
  margin-bottom: 10px;
}

.gana {
  margin: 0;
  color: var(--sobre-mesa-suave);
  font-size: 1.1rem;
}

h1 {
  font-size: clamp(2.4rem, 12vw, 3.4rem);
  overflow-wrap: anywhere;
}

.dibujo {
  height: min(24dvh, 220px);
  max-width: 100%;
  margin-top: 6px;
}

@keyframes gira {
  from {
    transform: rotate(-360deg) scale(0.4);
  }
}
</style>
