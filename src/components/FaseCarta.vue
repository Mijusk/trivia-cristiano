<script setup lang="ts">
import { computed, ref } from 'vue'
import { INFO_PRUEBA, INFO_TEMA, TEXTO_TIPO, TIEMPOS_POR_DEFECTO } from '../game/config'
import { useTemporizador } from '../composables/useTemporizador'
import { usePartidaStore } from '../stores/partida'
import CartaTapada from './CartaTapada.vue'
import Temporizador from './Temporizador.vue'

const store = usePartidaStore()

const carta = computed(() => store.carta!)
const casilla = computed(() => store.partida!.casilla!)
const esPregunta = computed(() => carta.value.prueba === 'pregunta')
const colorTema = computed(() => INFO_TEMA[casilla.value.tema].color)
const prueba = computed(() => INFO_PRUEBA[casilla.value.prueba])
const pistaUsada = computed(() => store.partida!.pistaUsada)
const cambioUsado = computed(() => store.partida!.cambioUsado)

const tiempos = store.partida!.tiempos
const segundos = esPregunta.value
  ? tiempos.pregunta
  : carta.value.prueba === 'mimica'
    ? (tiempos.mimica ?? TIEMPOS_POR_DEFECTO.mimica)
    : tiempos.actuar
const reloj = useTemporizador(segundos)

const vista = ref(false)
const respuestaVisible = ref(false)

const haEmpezado = computed(() => reloj.enMarcha.value || reloj.terminado.value || respuestaVisible.value)
const puedeResolver = computed(() => (esPregunta.value ? respuestaVisible.value : vista.value))

/* Pista en preguntas: en peques quita una opción falsa; en el resto muestra las tres opciones. */
const esPeques = computed(() => carta.value.nivel === 'peques')
const opcionesVisibles = computed(() => esPregunta.value && (esPeques.value || pistaUsada.value || respuestaVisible.value))

/** La opción falsa que quita la pista en peques. Depende del id para que no cambie al recargar. */
const opcionQuitada = computed(() => {
  const c = carta.value
  if (c.prueba !== 'pregunta' || !esPeques.value || !pistaUsada.value) return null
  const falsas = c.opciones.filter((o) => o !== c.respuesta)
  const semilla = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return falsas[semilla % falsas.length] ?? null
})

/* Dibujar y mímica tienen pista; en describir no hace falta porque quien describe puede hablar. */
const tienePista = computed(() => carta.value.prueba !== 'describir')
const textoBotonPista = computed(() => {
  if (!esPregunta.value) return 'Pista'
  return esPeques.value ? 'Pista: quitar una opción' : 'Pista: ver opciones'
})
const pistaDisponible = computed(() => tienePista.value && !pistaUsada.value && !respuestaVisible.value)

function verRespuesta() {
  reloj.parar()
  respuestaVisible.value = true
}

const verbo: Record<string, string> = { dibujar: 'dibujar', describir: 'describir', mimica: 'hacer la mímica' }
</script>

<template>
  <section class="fase-carta" :style="{ '--color-tema': colorTema }">
    <header class="cabecera">
      <span class="icono" aria-hidden="true">{{ prueba.icono }}</span>
      <div>
        <h1>{{ prueba.nombre }}</h1>
        <p class="tema">{{ INFO_TEMA[casilla.tema].nombre }}</p>
      </div>
    </header>

    <!-- Pregunta: la ve toda la pareja -->
    <template v-if="carta.prueba === 'pregunta'">
      <article class="carta carta-pregunta">
        <p class="texto-pregunta">{{ carta.pregunta }}</p>
        <ol v-if="opcionesVisibles" class="opciones" type="A">
          <li
            v-for="op in carta.opciones"
            :key="op"
            :class="{
              correcta: respuestaVisible && op === carta.respuesta,
              descartada: (respuestaVisible && op !== carta.respuesta) || op === opcionQuitada,
              quitada: op === opcionQuitada,
            }"
          >
            {{ op }}
          </li>
        </ol>
        <div v-if="respuestaVisible" class="respuesta">
          <span class="etiqueta">Respuesta</span>
          <strong>{{ carta.respuesta }}</strong>
          <span v-if="carta.referencia" class="referencia">{{ carta.referencia }}</span>
        </div>
      </article>
    </template>

    <!-- Dibujar, describir y mímica: solo la ve quien actúa -->
    <template v-else>
      <p class="instruccion">
        Pasa el móvil a quien va a {{ verbo[carta.prueba] }}. {{ prueba.instruccion }}
        Tu pareja tiene que decir lo que pone en grande.
      </p>
      <CartaTapada :color="colorTema" @vista="vista = true">
        <span class="contenido-tapado">
          <template v-if="carta.prueba === 'describir'">
            <strong class="palabra">{{ carta.palabra }}</strong>
            <span v-if="carta.prohibidas.length" class="prohibidas">
              <span class="etiqueta">No puedes decir</span>
              <span class="lista-prohibidas">
                <span v-for="w in carta.prohibidas" :key="w">{{ w }}</span>
              </span>
            </span>
          </template>
          <template v-else>
            <strong class="palabra">{{ carta.adivinar }}</strong>
            <span v-if="carta.escena" class="escena">{{ carta.escena }}</span>
          </template>
          <span v-if="carta.referencia" class="referencia">{{ carta.referencia }}</span>
        </span>
      </CartaTapada>
      <p v-if="carta.prueba !== 'describir' && carta.tipo" class="tipo-carta">
        Es {{ TEXTO_TIPO[carta.tipo] }}
      </p>
      <p v-if="pistaUsada && carta.prueba !== 'describir'" class="pista-texto">
        <span class="etiqueta-pista">Pista</span> {{ carta.pista }}
      </p>
    </template>

    <Temporizador
      :restante="reloj.restante.value"
      :fraccion="reloj.fraccion.value"
      :terminado="reloj.terminado.value"
      :en-marcha="reloj.enMarcha.value"
    />

    <div class="acciones">
      <template v-if="esPregunta">
        <button v-if="!reloj.enMarcha.value && !respuestaVisible && !reloj.terminado.value" class="btn btn-secundario btn-bloque" @click="reloj.empezar()">
          Empezar tiempo
        </button>
        <button v-if="!respuestaVisible" class="btn btn-principal btn-bloque" @click="verRespuesta">Ver respuesta</button>
      </template>
      <template v-else>
        <button
          v-if="!reloj.enMarcha.value && !reloj.terminado.value"
          class="btn btn-principal btn-bloque"
          :disabled="!vista"
          @click="reloj.empezar()"
        >
          {{ vista ? 'Empezar tiempo' : 'Primero mira la carta' }}
        </button>
      </template>

      <div v-if="puedeResolver && (esPregunta || haEmpezado)" class="acciones-fila">
        <button class="btn btn-fallo" @click="store.resolver(false)">{{ esPregunta ? 'Fallada' : 'No lo adivinó' }}</button>
        <button class="btn btn-acierto" @click="store.resolver(true)">{{ esPregunta ? 'Acertada' : '¡Adivinado!' }}</button>
      </div>

      <div class="extras">
        <button v-if="pistaDisponible" class="btn-texto" @click="store.usarPista()">{{ textoBotonPista }}</button>
        <button v-if="!haEmpezado && !cambioUsado" class="btn-texto" @click="store.otraCarta()">
          Cambiar carta (1 por turno)
        </button>
      </div>
      <p v-if="store.partida?.cartaDeOtroTema" class="nota">
        No quedaban cartas de este tema para vuestro nivel, así que sale una de otro. El quesito cuenta igual.
      </p>
    </div>
  </section>
</template>

<style scoped>
.fase-carta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cabecera .icono {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  flex: none;
  border-radius: 50%;
  background: var(--color-tema);
  font-size: 1.9rem;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 1.9rem;
}

.tema {
  margin: 2px 0 0;
  color: var(--sobre-mesa-suave);
}

.carta-pregunta {
  padding: 22px 20px;
  border-top: 10px solid var(--color-tema);
}

.texto-pregunta {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.35;
}

.opciones {
  margin: 16px 0 0;
  padding-left: 1.6em;
  display: grid;
  gap: 8px;
  font-size: 1.1rem;
}

.opciones li {
  padding: 6px 8px;
  border-radius: 8px;
  transition: opacity 0.3s ease, background 0.3s ease;
}

.opciones li::marker {
  font-weight: 700;
  color: var(--tinta-suave);
}

.opciones .correcta {
  background: color-mix(in srgb, var(--acierto) 20%, transparent);
  font-weight: 700;
}

.opciones .descartada {
  opacity: 0.4;
}

.opciones .quitada {
  text-decoration: line-through;
}

.escena {
  max-width: 30ch;
  font-size: 1rem;
  color: var(--tinta-suave);
  line-height: 1.35;
}

.tipo-carta {
  margin: 0;
  text-align: center;
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: 1.35rem;
}

.pista-texto {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--mesa-claro);
  font-size: 1.1rem;
  font-weight: 700;
}

.etiqueta-pista {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--tema-profetas);
  color: var(--tinta);
  font-size: 0.85rem;
}

.extras {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 20px;
}

.respuesta {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 2px dashed #d9dbe8;
  display: grid;
  gap: 2px;
  font-size: 1.15rem;
}

.etiqueta {
  font-size: 0.85rem;
  color: var(--tinta-suave);
}

.referencia {
  font-size: 0.9rem;
  color: var(--tinta-suave);
  font-style: italic;
}

.instruccion {
  margin: 0;
  color: var(--sobre-mesa-suave);
}

.contenido-tapado {
  display: grid;
  gap: 14px;
  justify-items: center;
}

.palabra {
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: clamp(1.6rem, 7.5vw, 2.2rem);
  line-height: 1.15;
}

.prohibidas {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.lista-prohibidas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.lista-prohibidas span {
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--fallo) 14%, transparent);
  color: #b3262b;
  font-weight: 700;
  text-decoration: line-through;
}

.nota {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--sobre-mesa-suave);
}
</style>
