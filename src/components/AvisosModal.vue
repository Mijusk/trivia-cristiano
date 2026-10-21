<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { INFO_MOTIVO, exportarAvisos, textoCarta } from '../game/avisos'
import { INFO_PRUEBA, INFO_TEMA } from '../game/config'
import { cartaPorId } from '../game/mazo'
import { useAvisosStore } from '../stores/avisos'

const abierto = defineModel<boolean>({ default: false })
const dialogo = ref<HTMLDialogElement | null>(null)
const avisos = useAvisosStore()
const mensaje = ref('')
const confirmarBorrado = ref(false)

const lista = computed(() =>
  [...avisos.avisos].reverse().flatMap((a) => {
    const carta = cartaPorId(a.cartaId)
    return carta ? [{ aviso: a, carta }] : []
  }),
)
const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

watch(abierto, (v) => {
  const d = dialogo.value
  if (!d) return
  mensaje.value = ''
  confirmarBorrado.value = false
  if (v && !d.open) d.showModal()
  if (!v && d.open) d.close()
})

// Si se borran todos, no queda nada que enseñar.
watch(
  () => avisos.avisos.length,
  (n) => {
    if (n === 0) abierto.value = false
  },
)

async function copiar() {
  const texto = exportarAvisos(avisos.avisos)
  try {
    await navigator.clipboard.writeText(texto)
    mensaje.value = 'Lista copiada. Pégala donde quieras.'
  } catch {
    // Sin permiso para el portapapeles: se copia con una selección temporal.
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    dialogo.value?.append(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    mensaje.value = ok ? 'Lista copiada. Pégala donde quieras.' : 'No se ha podido copiar.'
  }
}

async function compartir() {
  try {
    await navigator.share({ title: 'Cartas con aviso', text: exportarAvisos(avisos.avisos) })
  } catch {
    // Cancelado por el usuario: no hace falta decir nada.
  }
}

function borrarTodos() {
  if (!confirmarBorrado.value) {
    confirmarBorrado.value = true
    return
  }
  avisos.borrarTodos()
}

function cerrarSiFondo(e: MouseEvent) {
  if (e.target === dialogo.value) abierto.value = false
}
</script>

<template>
  <dialog ref="dialogo" class="dialogo" aria-labelledby="titulo-avisos" @close="abierto = false" @click="cerrarSiFondo">
    <div class="contenido">
      <header class="dialogo-cabecera">
        <h2 id="titulo-avisos">Cartas con aviso ({{ lista.length }})</h2>
        <button class="dialogo-cerrar" aria-label="Cerrar la lista" @click="abierto = false">✕</button>
      </header>

      <p class="suave">Cartas que habéis marcado durante las partidas para revisarlas.</p>

      <ul>
        <li v-for="{ aviso, carta } in lista" :key="aviso.cartaId">
          <div class="cabeza">
            <span class="punto" :style="{ background: INFO_TEMA[carta.tema].color }" />
            <span class="id">{{ carta.id }} · {{ INFO_PRUEBA[carta.prueba].nombre }}</span>
            <button class="btn-texto quitar" :aria-label="`Quitar el aviso de ${carta.id}`" @click="avisos.quitar(aviso.cartaId)">
              Quitar
            </button>
          </div>
          <p class="texto">{{ textoCarta(carta) }}</p>
          <p class="motivo">
            {{ INFO_MOTIVO[aviso.motivo] }}<template v-if="aviso.comentario">: <em>{{ aviso.comentario }}</em></template>
          </p>
        </li>
      </ul>

      <div class="botones">
        <div :class="puedeCompartir ? 'acciones-fila' : ''">
          <button class="btn btn-principal btn-bloque" @click="copiar">Copiar</button>
          <button v-if="puedeCompartir" class="btn btn-principal btn-bloque" @click="compartir">Compartir</button>
        </div>
        <p v-if="mensaje" class="mensaje" role="status">{{ mensaje }}</p>
        <button class="btn-texto borrar" @click="borrarTodos">
          {{ confirmarBorrado ? '¿Seguro? Toca otra vez para borrarlos todos' : 'Borrar todos los avisos' }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.contenido {
  padding: 20px 20px 22px;
  display: grid;
  gap: 14px;
}

h2 {
  font-size: 1.5rem;
}

p {
  margin: 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

li {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f2f3fa;
  display: grid;
  gap: 4px;
  overflow-wrap: anywhere;
}

.cabeza {
  display: flex;
  align-items: center;
  gap: 8px;
}

.punto {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
}

.id {
  flex: 1;
  color: var(--tinta-suave);
  font-size: 0.85rem;
}

.quitar {
  padding: 0.2em;
  color: var(--tinta-suave);
  font-size: 0.9rem;
}

.motivo {
  color: var(--tinta-suave);
  font-size: 0.92rem;
}

.suave {
  color: var(--tinta-suave);
  font-size: 0.92rem;
}

.botones {
  display: grid;
  gap: 8px;
}

.mensaje {
  text-align: center;
  color: var(--acierto);
  font-weight: 700;
}

.borrar {
  color: var(--fallo);
}
</style>
