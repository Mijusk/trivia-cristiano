<script setup lang="ts">
import { computed } from 'vue'
import { usePartidaStore } from '../stores/partida'
import Quesera from './Quesera.vue'

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
      <Quesera :pareja="ganadora" :modo="partida.modo" :tamano="180" class="ficha" />
      <p class="gana">Ha ganado</p>
      <h1>{{ ganadora.nombre }}</h1>
    </div>
    <div class="acciones">
      <button class="btn btn-principal btn-bloque" @click="revancha">Jugar otra vez</button>
      <button class="btn btn-secundario btn-bloque" @click="salir">Terminar</button>
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

@keyframes gira {
  from {
    transform: rotate(-360deg) scale(0.4);
  }
}
</style>
