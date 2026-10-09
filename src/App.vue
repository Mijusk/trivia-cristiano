<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePartidaStore } from './stores/partida'
import { sonido } from './audio/sonido'
import InicioView from './views/InicioView.vue'
import ConfigurarView from './views/ConfigurarView.vue'
import JuegoView from './views/JuegoView.vue'
import RegaloSobre from './components/RegaloSobre.vue'
import { marcarRegaloAbierto, regaloVisible } from './regalo/estado'

const store = usePartidaStore()

// Música de arpa en la portada y al configurar; silencio durante la partida.
watch(
  () => store.pantalla,
  (p) => sonido.musica(p !== 'juego'),
  { immediate: true },
)

// El navegador solo deja sonar audio tras el primer toque: ahí suena la entrada.
// Si está el regalo, la entrada la hace él al abrirse el sobre.
const alPrimerToque = () => {
  if (!regaloVisible.value) sonido.entrar()
}

// El regalo tapa todo; la portada se monta justo cuando se abre el sobre,
// para que su animación de entrada se vea en ese momento.
const portadaLista = ref(!regaloVisible.value)

watch(regaloVisible, (visible) => {
  if (visible) sonido.musica(false)
})

function alRevelar() {
  store.irA('inicio')
  portadaLista.value = true
}

function alTerminarRegalo() {
  regaloVisible.value = false
  marcarRegaloAbierto()
  sonido.musica(store.pantalla !== 'juego')
}
onMounted(() => document.addEventListener('pointerdown', alPrimerToque, { once: true }))
onBeforeUnmount(() => document.removeEventListener('pointerdown', alPrimerToque))
</script>

<template>
  <template v-if="portadaLista">
    <ConfigurarView v-if="store.pantalla === 'configurar'" />
    <JuegoView v-else-if="store.pantalla === 'juego' && store.partida" />
    <InicioView v-else />
  </template>
  <RegaloSobre v-if="regaloVisible" @revelar="alRevelar" @fin="alTerminarRegalo" />
</template>
