<script setup lang="ts">
import { usePartidaStore } from '../stores/partida'
import Marcador from '../components/Marcador.vue'
import FaseTurno from '../components/FaseTurno.vue'
import FaseCarta from '../components/FaseCarta.vue'
import FaseResultado from '../components/FaseResultado.vue'
import FaseVictoria from '../components/FaseVictoria.vue'
import ReglasModal from '../components/ReglasModal.vue'
import BotonSonido from '../components/BotonSonido.vue'
import { ref } from 'vue'

const store = usePartidaStore()
const reglasAbiertas = ref(false)
</script>

<template>
  <main v-if="store.partida" class="pantalla juego">
    <header class="barra">
      <Marcador :parejas="store.partida.parejas" :modo="store.partida.modo" :turno="store.partida.turno" />
      <BotonSonido class="sonido-juego" />
      <button class="salir" aria-label="Ver las reglas" @click="reglasAbiertas = true">?</button>
      <button class="salir" aria-label="Salir al inicio (la partida queda guardada)" @click="store.irA('inicio')">
        Salir
      </button>
    </header>

    <FaseTurno v-if="store.partida.fase === 'turno'" :key="`turno-${store.partida.turno}`" />
    <FaseCarta v-else-if="store.partida.fase === 'carta'" :key="store.partida.cartaId ?? 'carta'" />
    <FaseResultado v-else-if="store.partida.fase === 'resultado'" />
    <FaseVictoria v-else />
    <ReglasModal v-model="reglasAbiertas" />
  </main>
</template>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.barra > :first-child {
  flex: 1;
  min-width: 0;
}

.sonido-juego {
  background: var(--mesa-claro);
}

.salir {
  flex: none;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--mesa-claro);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
