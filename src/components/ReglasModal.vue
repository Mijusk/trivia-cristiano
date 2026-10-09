<script setup lang="ts">
import { ref, watch } from 'vue'
import { INFO_PRUEBA, INFO_TEMA, PRUEBAS, TEMAS } from '../game/config'

const abierto = defineModel<boolean>({ default: false })
const dialogo = ref<HTMLDialogElement | null>(null)

watch(abierto, (v) => {
  const d = dialogo.value
  if (!d) return
  if (v && !d.open) d.showModal()
  if (!v && d.open) d.close()
})

function cerrarSiFondo(e: MouseEvent) {
  // Cerrar al tocar fuera de la tarjeta.
  if (e.target === dialogo.value) abierto.value = false
}
</script>

<template>
  <dialog ref="dialogo" class="reglas" aria-labelledby="titulo-reglas" @close="abierto = false" @click="cerrarSiFondo">
    <div class="contenido">
      <header>
        <h2 id="titulo-reglas">Cómo se juega</h2>
        <button class="cerrar" aria-label="Cerrar las reglas" @click="abierto = false">✕</button>
      </header>

      <section>
        <h3>El turno</h3>
        <p>
          Cada pareja gira su ruleta, que solo tiene las casillas que le faltan. Si acertáis, ganáis ese quesito.
          Aciertes o no, el turno pasa a la siguiente pareja.
        </p>
        <p>Gana la primera pareja que complete los cuatro temas.</p>
      </section>

      <section>
        <h3>Los temas</h3>
        <ul class="temas">
          <li v-for="t in TEMAS" :key="t">
            <span class="punto" :style="{ background: INFO_TEMA[t].color }" />
            <span><strong>{{ INFO_TEMA[t].nombre }}</strong> <span class="suave">{{ INFO_TEMA[t].libros }}</span></span>
          </li>
        </ul>
      </section>

      <section>
        <h3>Las pruebas</h3>
        <ul class="pruebas">
          <li v-for="p in PRUEBAS" :key="p">
            <span class="icono" aria-hidden="true">{{ INFO_PRUEBA[p].icono }}</span>
            <span><strong>{{ INFO_PRUEBA[p].nombre }}.</strong> {{ INFO_PRUEBA[p].instruccion }}</span>
          </li>
        </ul>
        <p>
          En dibujar, describir y mímica la carta sale tapada: solo la ve quien actúa. En describir y mímica vale
          si tu pareja dice exactamente lo que pone en grande; en dibujar basta con las palabras resaltadas.
        </p>
        <p>En dibujar y mímica todos ven si es un animal, un personaje, un objeto o una escena.</p>
      </section>

      <section>
        <h3>Ayudas</h3>
        <p>
          Las preguntas, los dibujos y las mímicas tienen una pista por carta. En cada turno podéis cambiar de carta
          una vez: en Peques, antes de empezar el reloj; en Media y Experta, durante los primeros 15 segundos desde
          que aparece la carta. La carta nueva empieza con su tiempo menos la penalización.
        </p>
        <p>
          Las ayudas cuestan tiempo según el nivel de la pareja: en Media, cambiar de carta quita un 20&nbsp;% y la
          pista un 15&nbsp;%; en Experta, un 30&nbsp;% y un 20&nbsp;%. En Peques son gratis.
        </p>
        <p>En las preguntas de Media y Experta el reloj arranca solo tras 3 segundos para leer.</p>
        <p class="suave">Para dibujar necesitaréis papel y boli.</p>
      </section>

      <button class="btn btn-principal btn-bloque" @click="abierto = false">Entendido</button>
    </div>
  </dialog>
</template>

<style scoped>
.reglas {
  width: min(100% - 32px, 460px);
  max-height: min(100dvh - 48px, 760px);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: var(--radio-carta);
  background: var(--carta);
  color: var(--tinta);
  box-shadow: var(--sombra-carta);
}

.reglas::backdrop {
  background: rgba(10, 10, 30, 0.7);
  backdrop-filter: blur(2px);
}

.reglas[open] {
  animation: entra 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.contenido {
  padding: 20px 20px 22px;
  display: grid;
  gap: 18px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  font-size: 1.6rem;
}

h3 {
  font-size: 1.1rem;
  margin-bottom: 6px;
}

p {
  margin: 0 0 8px;
}

.cerrar {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: #eceef8;
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
  display: grid;
  gap: 8px;
}

li {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.punto {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex: none;
  transform: translateY(2px);
}

.icono {
  width: 18px;
  flex: none;
  text-align: center;
}

.suave {
  color: var(--tinta-suave);
  font-size: 0.92rem;
}

@keyframes entra {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
}
</style>
