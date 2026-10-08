<script setup lang="ts">
import { usePartidaStore } from './stores/partida'
import InicioView from './views/InicioView.vue'
import ConfigurarView from './views/ConfigurarView.vue'
import JuegoView from './views/JuegoView.vue'

const store = usePartidaStore()
</script>

<template>
  <ConfigurarView v-if="store.pantalla === 'configurar'" />
  <JuegoView v-else-if="store.pantalla === 'juego' && store.partida" />
  <InicioView v-else />
</template>
