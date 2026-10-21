<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Modo, Nivel, Tema } from '../types'
import { INFO_MODO, INFO_NIVEL, INFO_TEMA, MODOS, NIVELES, TEMAS, descripcionModo, ordenarTemas } from '../game/config'
import { usePartidaStore } from '../stores/partida'

const store = usePartidaStore()

const MIN = 2
const MAX = 6

// Si hay una partida anterior, se reutilizan sus parejas para la revancha.
const parejas = reactive<{ nombre: string; nivel: Nivel }[]>(
  store.partida?.parejas.map((p) => ({ nombre: p.nombre, nivel: p.nivel })) ?? [
    { nombre: '', nivel: 'media' },
    { nombre: '', nivel: 'media' },
  ],
)
const modo = ref<Modo>(store.partida?.modo ?? 'corta')

// Todos los temas marcados por defecto; en la revancha, los de la partida anterior.
const temas = ref<Tema[]>([...(store.partida?.temas ?? TEMAS)])
const incluirCamino = ref(store.partida?.incluirCamino ?? false)
const conVida = computed(() => temas.value.includes('vida'))

/** No se puede desmarcar el último tema: hace falta al menos uno. */
const esUltimo = (t: Tema) => temas.value.length === 1 && temas.value[0] === t

function anadir() {
  if (parejas.length < MAX) parejas.push({ nombre: '', nivel: 'media' })
}

function quitar(i: number) {
  if (parejas.length > MIN) parejas.splice(i, 1)
}

function empezar() {
  const elegidos = ordenarTemas(temas.value)
  store.nuevaPartida(parejas, modo.value, {
    temas: elegidos,
    incluirCamino: incluirCamino.value && elegidos.includes('vida'),
  })
}
</script>

<template>
  <main class="pantalla">
    <header class="barra">
      <button class="btn-texto" @click="store.irA('inicio')">Volver</button>
      <h1>Nueva partida</h1>
    </header>

    <section aria-labelledby="titulo-parejas">
      <h2 id="titulo-parejas">Parejas</h2>
      <p class="ayuda">Cada pareja juega con su nivel, así pueden jugar juntos peques y mayores.</p>

      <ol class="parejas">
        <li v-for="(p, i) in parejas" :key="i" class="pareja">
          <div class="fila-nombre">
            <label class="visualmente-oculto" :for="`nombre-${i}`">Nombre de la pareja {{ i + 1 }}</label>
            <input
              :id="`nombre-${i}`"
              v-model="p.nombre"
              type="text"
              maxlength="24"
              autocomplete="off"
              :placeholder="`Pareja ${i + 1}`"
            />
            <button
              v-if="parejas.length > MIN"
              type="button"
              class="quitar"
              :aria-label="`Quitar ${p.nombre || `pareja ${i + 1}`}`"
              @click="quitar(i)"
            >
              ✕
            </button>
          </div>
          <fieldset class="niveles">
            <legend class="visualmente-oculto">Nivel de {{ p.nombre || `la pareja ${i + 1}` }}</legend>
            <label v-for="n in NIVELES" :key="n" :class="{ activo: p.nivel === n }">
              <input v-model="p.nivel" type="radio" :name="`nivel-${i}`" :value="n" class="visualmente-oculto" />
              {{ INFO_NIVEL[n].nombre }}
            </label>
          </fieldset>
        </li>
      </ol>

      <button v-if="parejas.length < MAX" type="button" class="btn btn-secundario btn-bloque" @click="anadir">
        Añadir pareja
      </button>
    </section>

    <section aria-labelledby="titulo-temas">
      <h2 id="titulo-temas">Temas</h2>
      <p class="ayuda">Elegid con qué temas jugáis. Hace falta al menos uno.</p>
      <fieldset class="temas">
        <legend class="visualmente-oculto">Temas de la partida</legend>
        <label
          v-for="t in TEMAS"
          :key="t"
          class="tema"
          :class="{ activo: temas.includes(t), bloqueado: esUltimo(t) }"
          :style="{ '--color-tema': INFO_TEMA[t].color }"
        >
          <input
            v-model="temas"
            type="checkbox"
            :value="t"
            class="visualmente-oculto"
            :disabled="esUltimo(t)"
            :aria-describedby="esUltimo(t) ? 'aviso-ultimo-tema' : undefined"
          />
          <span class="marca" aria-hidden="true" />
          <span class="texto-tema">
            <strong>{{ INFO_TEMA[t].nombre }}</strong>
            <span>{{ INFO_TEMA[t].descripcion }}</span>
          </span>
        </label>
      </fieldset>
      <p v-if="temas.length === 1" id="aviso-ultimo-tema" class="ayuda ayuda-abajo">
        Para quitar este tema, marca antes otro.
      </p>

      <label v-if="conVida" class="interruptor">
        <input v-model="incluirCamino" type="checkbox" role="switch" class="visualmente-oculto" />
        <span class="carril" aria-hidden="true"><span class="bola" /></span>
        <span>
          <strong>Incluir temas del Camino Neocatecumenal</strong>
          <span class="detalle">Se mezclan con las cartas de Vida Cristiana.</span>
        </span>
      </label>
    </section>

    <section aria-labelledby="titulo-modo">
      <h2 id="titulo-modo">Duración</h2>
      <fieldset class="modos">
        <legend class="visualmente-oculto">Duración de la partida</legend>
        <label v-for="m in MODOS" :key="m" class="modo" :class="{ activo: modo === m }">
          <input v-model="modo" type="radio" name="modo" :value="m" class="visualmente-oculto" />
          <strong>{{ INFO_MODO[m].nombre }}</strong>
          <span>{{ descripcionModo(m, temas.length) }}</span>
        </label>
      </fieldset>
    </section>

    <div class="acciones">
      <p v-if="store.partida" class="aviso">Al empezar se sustituye la partida guardada.</p>
      <button class="btn btn-principal btn-bloque" @click="empezar">Empezar partida</button>
    </div>
  </main>
</template>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 {
  font-size: 1.6rem;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 4px;
}

.ayuda {
  margin: 0 0 12px;
  color: var(--sobre-mesa-suave);
  font-size: 0.95rem;
}

.parejas {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  display: grid;
  gap: 12px;
}

.pareja {
  background: var(--mesa-claro);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.fila-nombre {
  display: flex;
  gap: 8px;
}

input[type='text'] {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 2px solid var(--mesa-borde);
  background: var(--mesa);
  color: var(--sobre-mesa);
  font: inherit;
  font-weight: 700;
}

input[type='text']::placeholder {
  color: var(--sobre-mesa-suave);
  font-weight: 400;
}

.quitar {
  width: 48px;
  flex: none;
  border: 0;
  border-radius: 12px;
  background: var(--mesa);
  cursor: pointer;
}

fieldset {
  border: 0;
  margin: 0;
  padding: 0;
}

.niveles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.niveles label {
  min-height: 44px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--mesa);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

.niveles label.activo {
  background: var(--sobre-mesa);
  color: var(--tinta);
}

.niveles label:focus-within,
.modo:focus-within,
.tema:focus-within,
.interruptor:focus-within {
  outline: 3px solid var(--tema-profetas);
  outline-offset: 2px;
}

.modos {
  display: grid;
  gap: 8px;
}

.modo {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--mesa-claro);
  box-shadow: inset 0 0 0 2px transparent;
  cursor: pointer;
}

.modo span {
  color: var(--sobre-mesa-suave);
  font-size: 0.93rem;
}

.modo.activo {
  box-shadow: inset 0 0 0 3px var(--tema-profetas);
}

.temas {
  display: grid;
  gap: 8px;
}

.tema {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--mesa-claro);
  box-shadow: inset 6px 0 0 var(--color-tema);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.tema.activo {
  opacity: 1;
}

.tema.bloqueado {
  cursor: not-allowed;
}

.marca {
  width: 26px;
  height: 26px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 3px solid var(--color-tema);
  background: var(--mesa);
}

.tema.activo .marca {
  background: var(--color-tema);
}

.tema.activo .marca::after {
  content: '';
  width: 6px;
  height: 12px;
  margin-top: -3px;
  border: solid var(--mesa);
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

.texto-tema {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.texto-tema span {
  color: var(--sobre-mesa-suave);
  font-size: 0.88rem;
}

.ayuda-abajo {
  margin: 8px 0 0;
}

.interruptor {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--mesa-claro);
  cursor: pointer;
}

.interruptor strong {
  display: block;
}

.interruptor .detalle {
  color: var(--sobre-mesa-suave);
  font-size: 0.88rem;
}

.carril {
  position: relative;
  width: 50px;
  height: 30px;
  flex: none;
  border-radius: 999px;
  background: var(--mesa);
  box-shadow: inset 0 0 0 2px var(--mesa-borde);
  transition: background 0.15s ease;
}

.bola {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--sobre-mesa-suave);
  transition: transform 0.15s ease, background 0.15s ease;
}

.interruptor input:checked + .carril {
  background: var(--tema-vida);
  box-shadow: none;
}

.interruptor input:checked + .carril .bola {
  transform: translateX(20px);
  background: var(--sobre-mesa);
}

.aviso {
  margin: 0;
  text-align: center;
  color: var(--sobre-mesa-suave);
  font-size: 0.92rem;
}
</style>
