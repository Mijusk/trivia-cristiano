<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  INFO_PRUEBA,
  INFO_TEMA,
  PENALIZACION,
  SEGUNDOS_LECTURA,
  SEGUNDOS_PARA_CAMBIAR,
  SEGUNDOS_MINIMOS,
  TEXTO_TIPO,
  TIEMPOS_POR_DEFECTO,
  resaltarClaves,
} from '../game/config'
import { useTemporizador } from '../composables/useTemporizador'
import { usePartidaStore } from '../stores/partida'
import CartaTapada from './CartaTapada.vue'
import Temporizador from './Temporizador.vue'
import { sonido } from '../audio/sonido'

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

/* Coste de las ayudas según el nivel de la pareja que juega (en peques es 0). */
const nivelPareja = store.parejaActual!.nivel
const costeCambio = Math.round(segundos * PENALIZACION[nivelPareja].cambio)
const costePista = Math.round(segundos * PENALIZACION[nivelPareja].pista)

// Si esta carta viene de un cambio (o se recarga con la pista ya pedida), empieza con menos tiempo.
const inicial = Math.max(
  SEGUNDOS_MINIMOS,
  segundos - (store.partida!.cambioUsado ? costeCambio : 0) - (store.partida!.pistaUsada ? costePista : 0),
)
const reloj = useTemporizador(segundos, inicial)

/* Aviso «−9 s» que salta del reloj al pagar una ayuda. */
const restado = ref<{ id: number; seg: number } | null>(null)
function avisarRestado(seg: number) {
  if (seg > 0) restado.value = { id: Date.now(), seg }
}

/*
 * En media y experta el reloj arranca solo tras unos segundos de lectura: en las
 * preguntas, desde que aparece la carta; en las tapadas, desde que quien actúa
 * la mira por primera vez. En peques se arranca con el botón.
 */
const conVentana = nivelPareja !== 'peques'
const autoArranque = conVentana
const lectura = ref(0)
let cuentaLectura: ReturnType<typeof setInterval> | undefined

/*
 * Cambiar de carta: en peques, gratis y antes de empezar el reloj; en media y
 * experta, durante los primeros segundos (contados desde el mismo momento).
 */
const quedaParaCambiar = ref(conVentana ? SEGUNDOS_PARA_CAMBIAR : 0)
let cuentaCambio: ReturnType<typeof setInterval> | undefined

/** Ya se ha visto la carta: arrancan la lectura y la ventana para cambiar. */
const yaVista = ref(false)
function cartaVista() {
  if (yaVista.value) return
  yaVista.value = true
  if (conVentana) {
    cuentaCambio = setInterval(() => {
      quedaParaCambiar.value--
      if (quedaParaCambiar.value <= 0) clearInterval(cuentaCambio)
    }, 1000)
  }
  if (!autoArranque) return
  lectura.value = SEGUNDOS_LECTURA
  cuentaLectura = setInterval(() => {
    lectura.value--
    if (lectura.value <= 0) {
      clearInterval(cuentaLectura)
      if (!respuestaVisible.value && !reloj.enMarcha.value && !reloj.terminado.value) reloj.empezar()
    }
  }, 1000)
}

onMounted(() => {
  if (store.partida!.cambioUsado) avisarRestado(segundos - inicial)
  // La pregunta la ve toda la pareja en cuanto aparece.
  if (esPregunta.value) cartaVista()
})
onBeforeUnmount(() => {
  clearInterval(cuentaLectura)
  clearInterval(cuentaCambio)
})

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

/*
 * Todas las cartas tienen pista. En dibujar y mímica se lee en voz alta para
 * quien adivina; en describir es para quien describe y sale dentro de la carta tapada.
 */
const esDescribir = computed(() => carta.value.prueba === 'describir')
const textoBotonPista = computed(() =>
  esDescribir.value ? 'Ideas para describir' : esPregunta.value ? (esPeques.value ? 'Quitar una opción' : 'Ver opciones') : 'Pista',
)
const puedeCambiar = computed(() => {
  if (cambioUsado.value || respuestaVisible.value) return false
  return conVentana ? quedaParaCambiar.value > 0 : !haEmpezado.value
})
const pistaDisponible = computed(() => !pistaUsada.value && !respuestaVisible.value)

function pedirPista() {
  store.usarPista()
  avisarRestado(reloj.restar(costePista, SEGUNDOS_MINIMOS))
  sonido.pista()
}

function resolver(acertada: boolean) {
  store.resolver(acertada)
  if (store.partida?.fase === 'victoria') sonido.victoria()
  else if (acertada) sonido.acierto()
  else sonido.fallo()
}

function verla() {
  vista.value = true
  cartaVista()
}

function verRespuesta() {
  clearInterval(cuentaLectura)
  lectura.value = 0
  reloj.parar()
  respuestaVisible.value = true
}

const trozosDibujo = computed(() =>
  carta.value.prueba === 'dibujar' ? resaltarClaves(carta.value.adivinar, carta.value.claves) : [],
)

const verbo: Record<string, string> = { dibujar: 'dibujar', describir: 'describir', mimica: 'hacer la mímica' }
</script>

<template>
  <section class="fase-carta" :style="{ '--color-tema': colorTema }">
    <header class="cabecera">
      <span class="icono" aria-hidden="true">{{ prueba.icono }}</span>
      <div class="titulos">
        <h1>{{ prueba.nombre }}</h1>
        <p class="tema">{{ INFO_TEMA[casilla.tema].nombre }}</p>
      </div>
      <div class="reloj">
        <Temporizador
          :restante="reloj.restante.value"
          :fraccion="reloj.fraccion.value"
          :terminado="reloj.terminado.value"
          :en-marcha="reloj.enMarcha.value"
        />
        <span v-if="restado" :key="restado.id" class="restado" aria-live="polite">−{{ restado.seg }} s</span>
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
        <template v-if="carta.prueba === 'dibujar'">Tu pareja tiene que decir las palabras resaltadas.</template>
        <template v-else>Tu pareja tiene que decir lo que pone en grande.</template>
      </p>
      <CartaTapada :color="colorTema" @vista="verla">
        <span class="contenido-tapado">
          <template v-if="carta.prueba === 'describir'">
            <strong class="palabra">{{ carta.palabra }}</strong>
            <span v-if="carta.prohibidas.length" class="prohibidas">
              <span class="etiqueta">No puedes decir</span>
              <span class="lista-prohibidas">
                <span v-for="w in carta.prohibidas" :key="w">{{ w }}</span>
              </span>
            </span>
            <span v-if="pistaUsada" class="ideas">
              <span class="etiqueta-pista">Ideas</span>
              {{ carta.pista }}
            </span>
          </template>
          <template v-else-if="carta.prueba === 'dibujar'">
            <strong class="palabra dibujo">
              <template v-for="(t, i) in trozosDibujo" :key="i">
                <mark v-if="t.clave" class="clave">{{ t.texto }}</mark>
                <span v-else class="relleno">{{ t.texto }}</span>
              </template>
            </strong>
            <span v-if="carta.escena" class="escena">Dibuja: {{ carta.escena }}</span>
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
      <p v-if="pistaUsada && esDescribir" class="nota-ideas">Las ideas salen dentro de la carta: mantenla pulsada.</p>
    </template>

    <div class="acciones">
      <!-- Ayudas, justo encima del botón principal -->
      <div v-if="pistaDisponible || puedeCambiar" class="chips">
        <button v-if="pistaDisponible" type="button" class="chip" @click="pedirPista">
          <span aria-hidden="true">💡</span> {{ textoBotonPista }}
          <small v-if="costePista > 0">−{{ costePista }} s</small>
        </button>
        <button v-if="puedeCambiar" type="button" class="chip" @click="store.otraCarta()">
          <span aria-hidden="true">🔄</span> Cambiar carta
          <small v-if="conVentana">−{{ costeCambio }} s · quedan {{ quedaParaCambiar }} s</small>
          <small v-else>1 por turno</small>
        </button>
      </div>

      <p v-if="lectura > 0 && !respuestaVisible" class="lectura" aria-live="polite">
        {{ esPregunta ? 'Leed la pregunta: el' : 'El' }} tiempo empieza en {{ lectura }}…
      </p>

      <template v-if="esPregunta">
        <button
          v-if="!autoArranque && !reloj.enMarcha.value && !respuestaVisible && !reloj.terminado.value"
          class="btn btn-secundario btn-bloque"
          @click="reloj.empezar()"
        >
          Empezar tiempo
        </button>
        <button v-if="!respuestaVisible" class="btn btn-principal btn-bloque" @click="verRespuesta">Ver respuesta</button>
      </template>
      <template v-else>
        <button
          v-if="!autoArranque && !reloj.enMarcha.value && !reloj.terminado.value"
          class="btn btn-principal btn-bloque"
          :disabled="!vista"
          @click="reloj.empezar()"
        >
          {{ vista ? 'Empezar tiempo' : 'Primero mira la carta' }}
        </button>
        <p v-else-if="autoArranque && !vista" class="lectura">Mantén pulsada la carta: el tiempo empieza {{ SEGUNDOS_LECTURA }} s después.</p>
      </template>

      <div v-if="puedeResolver && (esPregunta || haEmpezado)" class="acciones-fila">
        <button class="btn btn-fallo" @click="resolver(false)">{{ esPregunta ? 'Fallada' : 'No lo adivinó' }}</button>
        <button class="btn btn-acierto" @click="resolver(true)">{{ esPregunta ? 'Acertada' : '¡Adivinado!' }}</button>
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
  gap: 12px;
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
}

.titulos {
  flex: 1;
  min-width: 0;
}

/* El reloj va en la cabecera, a la derecha, para que todo quepa sin hacer scroll. */
.cabecera .reloj :deep(.temporizador) {
  width: 78px;
  height: 78px;
}

.cabecera .reloj :deep(.numero) {
  font-size: 1.6rem;
}

.cabecera .reloj :deep(.terminado .numero) {
  font-size: 0.85rem;
}

.cabecera .icono {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 50%;
  background: var(--color-tema);
  font-size: 1.9rem;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 1.7rem;
}

.tema {
  margin: 2px 0 0;
  color: var(--sobre-mesa-suave);
}

.carta-pregunta {
  padding: 18px 18px;
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

.dibujo .relleno {
  color: var(--tinta-suave);
  font-weight: 600;
}

.clave {
  background: color-mix(in srgb, var(--color-tema) 30%, transparent);
  color: var(--tinta);
  padding: 0 0.15em;
  border-radius: 6px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
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
  font-size: 1.2rem;
}

/* Carta tapada algo más baja en móviles pequeños */
@media (max-height: 760px) {
  .fase-carta :deep(.carta-tapada),
  .fase-carta :deep(.dorso),
  .fase-carta :deep(.cara) {
    min-height: 180px;
  }
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

.reloj {
  position: relative;
  flex: none;
}

.restado {
  position: absolute;
  right: 70%;
  top: 20%;
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--fallo);
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
  pointer-events: none;
  animation: restar 1.4s ease-out forwards;
}

/* Ayudas en forma de chip, encima del botón principal */
.chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.chip {
  flex: 1 1 140px;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2px 6px;
  min-height: 44px;
  padding: 6px 14px;
  border: 2px solid color-mix(in srgb, var(--sobre-mesa) 30%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--sobre-mesa) 8%, transparent);
  color: var(--sobre-mesa);
  font-family: var(--fuente-titulo);
  font-weight: 800;
  font-size: 0.95rem;
  line-height: 1.15;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.2s ease;
}

.chip:active {
  transform: scale(0.97);
  background: color-mix(in srgb, var(--sobre-mesa) 16%, transparent);
}

.chip small {
  font-family: var(--fuente-texto);
  font-weight: 600;
  font-size: 0.78rem;
  opacity: 0.8;
}

.ideas {
  max-width: 32ch;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--tema-profetas) 22%, transparent);
  font-size: 0.98rem;
  line-height: 1.35;
  text-align: left;
}

.nota-ideas {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--sobre-mesa-suave);
}

.lectura {
  margin: 0;
  text-align: center;
  font-weight: 700;
  color: var(--sobre-mesa-suave);
}

@keyframes restar {
  0% {
    opacity: 0;
    transform: translate(10px, 10px) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translate(-6px, 0) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-16px, 34px) scale(1);
  }
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
  font-size: 0.95rem;
  line-height: 1.4;
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
