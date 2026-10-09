<script setup lang="ts">
import { ref } from 'vue'
import { usePartidaStore } from '../stores/partida'
import PortadaEscena from '../components/PortadaEscena.vue'
import ReglasModal from '../components/ReglasModal.vue'
import BotonSonido from '../components/BotonSonido.vue'
import { volverAVerRegalo } from '../regalo/estado'

const store = usePartidaStore()
const reglasAbiertas = ref(false)

// Mantener pulsado el logo un segundo vuelve a mostrar el regalo.
let pulsacion: ReturnType<typeof setTimeout> | undefined
function empezarPulsacion() {
  pulsacion = setTimeout(volverAVerRegalo, 1000)
}
function cancelarPulsacion() {
  clearTimeout(pulsacion)
}
</script>

<template>
  <main class="portada">
    <section class="cielo">
      <div class="estrellas" aria-hidden="true" />
      <BotonSonido class="sonido" />

      <header class="titulo">
        <svg
          class="logo"
          viewBox="-54 -54 108 108"
          aria-hidden="true"
          @pointerdown="empezarPulsacion"
          @pointerup="cancelarPulsacion"
          @pointerleave="cancelarPulsacion"
          @pointercancel="cancelarPulsacion"
          @contextmenu.prevent
        >
          <circle r="53" fill="var(--mesa)" stroke="var(--sobre-mesa)" stroke-width="3" />
          <path d="M0 0 L0 -50 A50 50 0 0 1 50 0 Z" fill="var(--tema-pentateuco)" />
          <path d="M0 0 L50 0 A50 50 0 0 1 0 50 Z" fill="var(--tema-historicos)" />
          <path d="M0 0 L0 50 A50 50 0 0 1 -50 0 Z" fill="var(--tema-profetas)" />
          <path d="M0 0 L-50 0 A50 50 0 0 1 0 -50 Z" fill="var(--tema-nt)" />
          <g stroke="var(--mesa)" stroke-width="4"><line x1="0" y1="-52" x2="0" y2="52" /><line x1="-52" y1="0" x2="52" y2="0" /></g>
        </svg>
        <h1><span>Trivia</span> <span>Cristiano</span></h1>
        <p class="lema">El juego bíblico por parejas</p>
      </header>

      <div class="horizonte">
        <PortadaEscena />
      </div>
    </section>

    <section class="suelo">
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
        <button class="btn-texto reglas" @click="reglasAbiertas = true">Cómo se juega</button>
      </div>
    </section>

    <ReglasModal v-model="reglasAbiertas" />
  </main>
</template>

<style scoped>
.portada {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--silueta);
  --silueta: #131330;
  --silueta-lejos: #3a3470;
  --cielo-horizonte: #f6c26b;
}

.cielo {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 440px;
  padding-top: max(28px, env(safe-area-inset-top));
  overflow: hidden;
  background: linear-gradient(180deg, #17183f 0%, #2a2560 38%, #5a3a78 66%, #c9785f 88%, #f2b066 100%);
}

/* Cielo estrellado hecho con puntitos, sin imágenes */
.estrellas {
  position: absolute;
  inset: 0 0 40% 0;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 18%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 28% 8%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 46% 24%, #fffbe6 50%, transparent 51%),
    radial-gradient(1px 1px at 63% 12%, #fff 50%, transparent 51%),
    radial-gradient(2px 2px at 82% 20%, #fff7cf 50%, transparent 51%),
    radial-gradient(1px 1px at 90% 6%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 7% 40%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 36% 44%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 72% 38%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 55% 52%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 94% 46%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 20% 60%, #fff 50%, transparent 51%);
  opacity: 0;
  animation: aparece 2s ease 0.2s forwards;
}

.sonido {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  right: 14px;
  z-index: 1;
}

.titulo {
  position: relative;
  text-align: center;
  padding: 0 16px;
  opacity: 0;
  animation: baja 1s cubic-bezier(0.2, 0.8, 0.2, 1) 1.1s forwards;
}

.logo {
  -webkit-touch-callout: none;
  width: 64px;
  height: 64px;
  margin-bottom: 10px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
}

h1 {
  font-size: clamp(3rem, 15vw, 4.4rem);
  line-height: 0.92;
  letter-spacing: -0.02em;
  color: #fffaf0;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.25), 0 0 32px rgba(255, 214, 140, 0.25);
}

h1 span {
  display: block;
}

.lema {
  margin: 12px 0 0;
  color: #e6defa;
  font-size: 1.05rem;
}

.horizonte {
  position: relative;
  margin-top: auto;
  padding-top: 24px;
}

.horizonte > :deep(svg) {
  max-width: 560px;
  margin: 0 auto;
}

.suelo {
  padding: 4px 16px max(20px, env(safe-area-inset-bottom));
}

.acciones {
  max-width: 448px;
  margin: 0 auto;
}

.reglas {
  align-self: center;
  color: #d9d4f2;
  font-weight: 700;
}

@keyframes aparece {
  to {
    opacity: 1;
  }
}

@keyframes baja {
  from {
    opacity: 0;
    transform: translateY(-14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
