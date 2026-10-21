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
  <dialog ref="dialogo" class="dialogo" aria-labelledby="titulo-reglas" @close="abierto = false" @click="cerrarSiFondo">
    <div class="contenido">
      <header class="dialogo-cabecera">
        <h2 id="titulo-reglas">Cómo se juega</h2>
        <button class="dialogo-cerrar" aria-label="Cerrar las reglas" @click="abierto = false">✕</button>
      </header>

      <section>
        <h3>El turno</h3>
        <p>
          Cada pareja gira su ruleta, que solo tiene las casillas que le faltan. Si acertáis, ganáis ese quesito.
          Aciertes o no, el turno pasa a la siguiente pareja.
        </p>
        <p>Gana la primera pareja que complete todos los temas de la partida.</p>
      </section>

      <section>
        <h3>Los temas</h3>
        <ul class="temas">
          <li v-for="t in TEMAS" :key="t">
            <span class="punto" :style="{ background: INFO_TEMA[t].color }" />
            <span><strong>{{ INFO_TEMA[t].nombre }}</strong> <span class="suave">{{ INFO_TEMA[t].descripcion }}</span></span>
          </li>
        </ul>
        <p>
          Al preparar la partida se eligen los temas con los que se juega (al menos uno); la ruleta y la ficha solo
          tienen esos. Con Vida Cristiana se pueden incluir también cartas del Camino Neocatecumenal, que se mezclan
          con las demás de ese tema.
        </p>
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
          Todas las cartas tienen una pista. En las preguntas muestra o reduce las opciones; en dibujar y mímica se lee
          en voz alta; en describir son ideas para quien describe, y salen dentro de la carta. En cada turno podéis
          cambiar de carta una vez: en Peques, antes de empezar el reloj; en Media y Experta, durante los primeros
          15 segundos desde que se ve la carta. La carta nueva empieza con su tiempo menos la penalización.
        </p>
        <p>
          Las ayudas cuestan tiempo según el nivel de la pareja: en Media, cambiar de carta quita un 20&nbsp;% y la
          pista un 15&nbsp;%; en Experta, un 30&nbsp;% y un 20&nbsp;%. En Peques son gratis.
        </p>
        <p>
          En Media y Experta el reloj arranca solo 3 segundos después de ver la carta: en las preguntas, en cuanto
          aparece; en el resto, la primera vez que quien actúa la mantiene pulsada. En Peques se arranca con el botón.
        </p>
        <p>
          Para dibujar, al preparar la partida se elige si se hace en papel o en la pantalla. En la pantalla, quien
          dibuja mira la carta y, cuando empieza el tiempo, el móvil se convierte en una pizarra con colores, grosores,
          goma y deshacer; el dibujo sale luego en el resultado. En cada carta se puede cambiar solo para ese turno.
        </p>
      </section>

      <button class="btn btn-principal btn-bloque" @click="abierto = false">Entendido</button>
    </div>
  </dialog>
</template>

<style scoped>
.contenido {
  padding: 20px 20px 22px;
  display: grid;
  gap: 18px;
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
</style>
