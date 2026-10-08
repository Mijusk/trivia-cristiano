<script setup lang="ts">
import { computed } from 'vue'
import { INFO_PRUEBA, INFO_TEMA } from '../game/config'
import { temaCompleto } from '../game/reglas'
import { usePartidaStore } from '../stores/partida'
import Quesera from './Quesera.vue'

const store = usePartidaStore()
const partida = computed(() => store.partida!)
const pareja = computed(() => store.parejaActual!)
const acierto = computed(() => partida.value.ultimoAcierto === true)
const casilla = computed(() => partida.value.casilla!)
const siguiente = computed(() => partida.value.parejas[(partida.value.turno + 1) % partida.value.parejas.length])
const completado = computed(() => acierto.value && temaCompleto(pareja.value, casilla.value.tema, partida.value.modo))

const solucion = computed(() => {
  const c = store.carta
  if (!c) return ''
  if (c.prueba === 'pregunta') return c.respuesta
  if (c.prueba === 'describir') return c.palabra
  return c.texto
})
</script>

<template>
  <section class="resultado" :class="acierto ? 'bien' : 'mal'" aria-live="polite">
    <div class="centro">
      <Quesera :pareja="pareja" :modo="partida.modo" :tamano="150" class="ficha" />
      <h1 v-if="acierto">¡Quesito para {{ pareja.nombre }}!</h1>
      <h1 v-else>Esta vez no</h1>
      <p v-if="acierto" class="detalle">
        {{ INFO_PRUEBA[casilla.prueba].nombre }} de {{ INFO_TEMA[casilla.tema].nombre }}.
        <template v-if="completado"> Tema completado.</template>
      </p>
      <p v-else class="detalle">Era: <strong>{{ solucion }}</strong></p>
    </div>

    <div class="acciones">
      <button class="btn btn-principal btn-bloque" @click="store.siguienteTurno()">
        Turno de {{ siguiente.nombre }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.resultado {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.centro {
  margin: auto 0;
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 14px;
}

.bien .ficha {
  animation: salto 0.6s cubic-bezier(0.2, 1.6, 0.4, 1);
}

h1 {
  font-size: clamp(1.8rem, 8vw, 2.4rem);
  overflow-wrap: anywhere;
}

.detalle {
  margin: 0;
  color: var(--sobre-mesa-suave);
  font-size: 1.1rem;
}

.detalle strong {
  color: var(--sobre-mesa);
}

@keyframes salto {
  from {
    transform: scale(0.7) rotate(-20deg);
  }
}
</style>
