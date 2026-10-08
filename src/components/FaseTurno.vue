<script setup lang="ts">
import { ref } from 'vue'
import type { Casilla } from '../types'
import { INFO_NIVEL, INFO_PRUEBA, INFO_TEMA } from '../game/config'
import { usePartidaStore } from '../stores/partida'
import Ruleta from './Ruleta.vue'

const store = usePartidaStore()
const ruleta = ref<InstanceType<typeof Ruleta> | null>(null)
const girando = ref(false)
const resultado = ref<Casilla | null>(null)

function alEmpezar() {
  girando.value = true
  resultado.value = null
}

function sacarCarta() {
  if (resultado.value) store.jugarCasilla(resultado.value)
}

function alTerminar(casilla: Casilla) {
  girando.value = false
  resultado.value = casilla
}
</script>

<template>
  <section class="turno" aria-live="polite">
    <div class="quien">
      <p class="le-toca">Le toca a</p>
      <h1>{{ store.parejaActual?.nombre }}</h1>
      <p class="nivel">Nivel {{ INFO_NIVEL[store.parejaActual?.nivel ?? 'media'].nombre }}</p>
    </div>

    <Ruleta ref="ruleta" :casillas="store.pendientes" @empieza="alEmpezar" @resultado="alTerminar" />

    <div class="acciones">
      <div v-if="resultado" class="salio" :style="{ '--color-tema': INFO_TEMA[resultado.tema].color }">
        <span class="icono" aria-hidden="true">{{ INFO_PRUEBA[resultado.prueba].icono }}</span>
        <span>
          <strong>{{ INFO_PRUEBA[resultado.prueba].nombre }}</strong>
          <span class="tema">{{ INFO_TEMA[resultado.tema].nombre }}</span>
        </span>
      </div>

      <button v-if="resultado" class="btn btn-principal btn-bloque" @click="sacarCarta">
        Sacar carta
      </button>
      <button v-else class="btn btn-principal btn-bloque" :disabled="girando" @click="ruleta?.girar()">
        {{ girando ? 'Girando…' : 'Girar la ruleta' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.turno {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quien {
  text-align: center;
}

.le-toca {
  margin: 0;
  color: var(--sobre-mesa-suave);
}

h1 {
  font-size: clamp(2rem, 9vw, 2.6rem);
  overflow-wrap: anywhere;
}

.nivel {
  margin: 4px 0 0;
  font-size: 0.92rem;
  color: var(--sobre-mesa-suave);
}

.salio {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--carta);
  color: var(--tinta);
  border-left: 12px solid var(--color-tema);
  animation: aparece 0.35s cubic-bezier(0.2, 1.4, 0.4, 1);
}

.salio .icono {
  font-size: 2rem;
}

.salio strong {
  display: block;
  font-family: var(--fuente-titulo);
  font-size: 1.3rem;
}

.salio .tema {
  color: var(--tinta-suave);
}

@keyframes aparece {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
}
</style>
