<script setup lang="ts">
import { usePartidaStore } from '../stores/partida'
import { INFO_PRUEBA, INFO_TEMA, PRUEBAS, TEMAS } from '../game/config'

const store = usePartidaStore()
</script>

<template>
  <main class="pantalla inicio">
    <header class="cabecera">
      <svg class="logo" viewBox="-54 -54 108 108" aria-hidden="true">
        <circle r="53" fill="var(--mesa)" stroke="var(--sobre-mesa)" stroke-width="3" />
        <path d="M0 0 L0 -50 A50 50 0 0 1 50 0 Z" fill="var(--tema-pentateuco)" />
        <path d="M0 0 L50 0 A50 50 0 0 1 0 50 Z" fill="var(--tema-historicos)" />
        <path d="M0 0 L0 50 A50 50 0 0 1 -50 0 Z" fill="var(--tema-profetas)" />
        <path d="M0 0 L-50 0 A50 50 0 0 1 0 -50 Z" fill="var(--tema-nt)" />
        <g stroke="var(--mesa)" stroke-width="4"><line x1="0" y1="-52" x2="0" y2="52" /><line x1="-52" y1="0" x2="52" y2="0" /></g>
      </svg>
      <h1>Trivia Cristiano</h1>
      <p class="lema">El juego bíblico por parejas. Preguntas, dibujos, palabras y mímica.</p>
    </header>

    <section class="como-se-juega" aria-labelledby="titulo-reglas">
      <h2 id="titulo-reglas">Cómo se juega</h2>
      <p>
        Cada pareja tira su ruleta en su turno. Si acertáis, ganáis ese quesito; si no, pasa el turno.
        Gana la primera pareja que complete los cuatro temas.
      </p>
      <ul class="temas">
        <li v-for="t in TEMAS" :key="t">
          <span class="punto" :style="{ background: INFO_TEMA[t].color }" />
          <span><strong>{{ INFO_TEMA[t].nombre }}</strong> <span class="libros">{{ INFO_TEMA[t].libros }}</span></span>
        </li>
      </ul>
      <ul class="pruebas">
        <li v-for="p in PRUEBAS" :key="p">
          <span class="icono" aria-hidden="true">{{ INFO_PRUEBA[p].icono }}</span>
          <span><strong>{{ INFO_PRUEBA[p].nombre }}.</strong> {{ INFO_PRUEBA[p].instruccion }}</span>
        </li>
      </ul>
      <p>
        En dibujar, describir y mímica solo vale si tu pareja dice exactamente lo que pone en grande en la carta.
        Las preguntas, los dibujos y las mímicas tienen una pista, y en cada turno se puede cambiar de carta una vez.
      </p>
      <p class="nota">Para dibujar necesitaréis papel y boli.</p>
    </section>

    <div class="acciones">
      <button v-if="store.partida" class="btn btn-principal btn-bloque" @click="store.irA('juego')">
        Continuar partida
      </button>
      <button
        class="btn btn-bloque"
        :class="store.partida ? 'btn-secundario' : 'btn-principal'"
        @click="store.irA('configurar')"
      >
        Nueva partida
      </button>
    </div>
  </main>
</template>

<style scoped>
.cabecera {
  text-align: center;
  padding-top: 12px;
}

.logo {
  width: 108px;
  height: 108px;
  margin-bottom: 14px;
}

h1 {
  font-size: clamp(2.4rem, 11vw, 3.2rem);
}

.lema {
  margin: 10px auto 0;
  max-width: 28ch;
  color: var(--sobre-mesa-suave);
}

.como-se-juega {
  background: var(--mesa-claro);
  border-radius: var(--radio-carta);
  padding: 18px;
}

h2 {
  font-size: 1.3rem;
  margin-bottom: 8px;
}

p {
  margin: 0 0 12px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  display: grid;
  gap: 8px;
}

.temas li,
.pruebas li {
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

.libros {
  color: var(--sobre-mesa-suave);
  font-size: 0.9rem;
}

.icono {
  width: 14px;
  flex: none;
  text-align: center;
}

.nota {
  margin: 0;
  color: var(--sobre-mesa-suave);
  font-size: 0.92rem;
}
</style>
