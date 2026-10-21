<script setup lang="ts">
import { computed } from 'vue'
import { INFO_PRUEBA, INFO_TEMA } from '../game/config'
import { temaCompleto } from '../game/reglas'
import { usePartidaStore } from '../stores/partida'
import Quesera from './Quesera.vue'
import AvisarCarta from './AvisarCarta.vue'
import { useAvisosStore } from '../stores/avisos'
import DibujoVista from './DibujoVista.vue'

const store = usePartidaStore()
// La frase del botón de avisar solo sale la primera vez que cada pareja llega aquí.
const fraseAviso = useAvisosStore().verFrase(store.parejaActual!.id)
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
  return c.adivinar
})
</script>

<template>
  <section class="resultado" :class="[acierto ? 'bien' : 'mal', { 'con-dibujo': store.dibujo }]" aria-live="polite">
    <AvisarCarta v-if="store.carta" :carta="store.carta" :frase="fraseAviso" class="aviso-arriba" />
    <div class="centro">
      <Quesera :pareja="pareja" :modo="partida.modo" :temas="partida.temas" :tamano="store.dibujo ? 96 : 150" class="ficha" />
      <h1 v-if="acierto">¡Quesito para {{ pareja.nombre }}!</h1>
      <h1 v-else>Esta vez no</h1>
      <p v-if="acierto" class="detalle">
        {{ INFO_PRUEBA[casilla.prueba].nombre }} de {{ INFO_TEMA[casilla.tema].nombre }}.
        <template v-if="completado"> Tema completado.</template>
      </p>
      <p v-else class="detalle">Era: <strong>{{ solucion }}</strong></p>
      <DibujoVista v-if="store.dibujo" :dibujo="store.dibujo" class="dibujo" :style="{ aspectRatio: `1 / ${store.dibujo.proporcion}` }" />
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

.aviso-arriba {
  margin-top: -10px;
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

/* El dibujo de la pizarra, sin pasarse de alto para que quepa todo sin hacer scroll */
.dibujo {
  height: min(36dvh, 340px);
  max-width: 100%;
  margin-top: 4px;
}

@media (max-height: 760px) {
  .con-dibujo .centro {
    gap: 10px;
  }

  .con-dibujo h1 {
    font-size: 1.6rem;
  }

  .con-dibujo .dibujo {
    height: 24dvh;
  }
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
