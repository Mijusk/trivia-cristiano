<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Carta } from '../types'
import { INFO_MOTIVO, MAX_COMENTARIO, MOTIVOS, textoCarta, type Motivo } from '../game/avisos'
import { useAvisosStore } from '../stores/avisos'

/** `frase`: con el texto al lado del icono (la primera vez de cada pareja); si no, solo el icono. */
const props = defineProps<{ carta: Carta; frase?: boolean }>()

const avisos = useAvisosStore()
const aviso = computed(() => avisos.avisoDe(props.carta.id))

const abierto = ref(false)
const dialogo = ref<HTMLDialogElement | null>(null)
const motivo = ref<Motivo | null>(null)
const comentario = ref('')

watch(abierto, (v) => {
  const d = dialogo.value
  if (!d) return
  if (v && !d.open) d.showModal()
  if (!v && d.open) d.close()
})

function abrir() {
  // Si ya tenía aviso, se abre con lo que se puso para poder cambiarlo.
  motivo.value = aviso.value?.motivo ?? null
  comentario.value = aviso.value?.comentario ?? ''
  abierto.value = true
}

function guardar() {
  if (!motivo.value) return
  avisos.avisar(props.carta.id, motivo.value, comentario.value)
  abierto.value = false
}

function quitar() {
  avisos.quitar(props.carta.id)
  abierto.value = false
}

function cerrarSiFondo(e: MouseEvent) {
  if (e.target === dialogo.value) abierto.value = false
}
</script>

<template>
  <button
    type="button"
    class="avisar"
    :class="{ hecho: aviso, solo: !frase }"
    :aria-label="aviso ? 'Carta avisada: cambiar el aviso' : 'Avisar de un error en esta carta'"
    @click="abrir"
  >
    <span aria-hidden="true">⚠️</span>
    <span v-if="frase" aria-hidden="true">{{ aviso ? 'Carta avisada' : '¿Error en la carta?' }}</span>
    <span v-else-if="aviso" class="check" aria-hidden="true">✓</span>
  </button>

  <dialog ref="dialogo" class="dialogo" aria-labelledby="titulo-avisar" @close="abierto = false" @click="cerrarSiFondo">
    <form class="contenido" @submit.prevent="guardar">
      <header class="dialogo-cabecera">
        <h2 id="titulo-avisar">Avisar de esta carta</h2>
        <button type="button" class="dialogo-cerrar" aria-label="Cerrar" @click="abierto = false">✕</button>
      </header>

      <p class="carta-texto">
        <span class="id">{{ carta.id }}</span>
        {{ textoCarta(carta) }}
      </p>

      <fieldset>
        <legend>¿Qué le pasa?</legend>
        <label v-for="m in MOTIVOS" :key="m" class="motivo">
          <input v-model="motivo" type="radio" name="motivo" :value="m" />
          <span>{{ INFO_MOTIVO[m] }}</span>
        </label>
      </fieldset>

      <label class="comentario">
        <span>Comentario <span class="suave">(opcional)</span></span>
        <textarea v-model="comentario" rows="3" :maxlength="MAX_COMENTARIO" placeholder="Por ejemplo: en la Biblia pone otra cosa" />
      </label>

      <p v-if="avisos.envioActivo" class="suave">
        Les llega a quienes hacen el juego para revisarla. Sin conexión, se envía en cuanto vuelva.
      </p>
      <p v-else class="suave">Se guarda en este dispositivo. Desde la portada puedes ver la lista, copiarla o compartirla.</p>

      <div class="botones">
        <button type="submit" class="btn btn-principal btn-bloque" :disabled="!motivo">
          {{ aviso ? 'Guardar cambios' : 'Guardar aviso' }}
        </button>
        <button v-if="aviso" type="button" class="btn-texto quitar" @click="quitar">Quitar el aviso</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
/* Pequeño y arriba, lejos del botón grande de abajo, para no pulsarlo sin querer */
.avisar {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--mesa-claro);
  color: var(--sobre-mesa-suave);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

.avisar.solo {
  min-width: 40px;
  justify-content: center;
  padding: 0 10px;
}

.avisar.hecho {
  color: var(--tema-profetas);
}

.check {
  font-weight: 800;
}

.contenido {
  padding: 20px 20px 22px;
  display: grid;
  gap: 16px;
}

h2 {
  font-size: 1.5rem;
}

p {
  margin: 0;
}

.carta-texto {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f2f3fa;
  overflow-wrap: anywhere;
}

.id {
  display: block;
  color: var(--tinta-suave);
  font-size: 0.8rem;
}

fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

legend {
  font-weight: 700;
  margin-bottom: 6px;
}

.motivo {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 40px;
  cursor: pointer;
}

.motivo input {
  width: 20px;
  height: 20px;
  flex: none;
  accent-color: var(--mesa);
}

.comentario {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

textarea {
  font: inherit;
  font-weight: 400;
  padding: 10px 12px;
  border: 2px solid #d9dbea;
  border-radius: 12px;
  resize: vertical;
}

.suave {
  color: var(--tinta-suave);
  font-size: 0.9rem;
  font-weight: 400;
}

.botones {
  display: grid;
  gap: 4px;
}

.quitar {
  color: var(--fallo);
}
</style>
