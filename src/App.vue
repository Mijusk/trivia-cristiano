<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { usePartidaStore } from './stores/partida'
import { sonido } from './audio/sonido'
import InicioView from './views/InicioView.vue'
import ConfigurarView from './views/ConfigurarView.vue'
import JuegoView from './views/JuegoView.vue'

const store = usePartidaStore()

// Música de arpa en la portada y al configurar; silencio durante la partida.
watch(
  () => store.pantalla,
  (p) => sonido.musica(p !== 'juego'),
  { immediate: true },
)

// El navegador solo deja sonar audio tras el primer toque: ahí suena la entrada.
const alPrimerToque = () => sonido.entrar()
onMounted(() => document.addEventListener('pointerdown', alPrimerToque, { once: true }))
onBeforeUnmount(() => document.removeEventListener('pointerdown', alPrimerToque))
</script>

<template>
  <ConfigurarView v-if="store.pantalla === 'configurar'" />
  <JuegoView v-else-if="store.pantalla === 'juego' && store.partida" />
  <InicioView v-else />
</template>
