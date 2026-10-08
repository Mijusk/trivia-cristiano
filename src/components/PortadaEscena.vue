<template>
  <!--
    Escena de la portada: siluetas propias (sin imágenes externas) de grandes
    momentos de la Biblia, de izquierda a derecha:
    el arca de Noé, Moisés con las tablas, David y Goliat, el Calvario,
    el león de Daniel y el gran pez de Jonás. Arriba vuela la paloma.
  -->
  <svg class="escena" viewBox="0 0 400 230" preserveAspectRatio="xMidYMax meet" role="img"
    aria-label="Siluetas de personajes de la Biblia: el arca de Noé, Moisés, David y Goliat, la cruz, el león de Daniel y el pez de Jonás">
    <defs>
      <radialGradient id="luz-calvario" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffe7a3" stop-opacity="0.9" />
        <stop offset="0.45" stop-color="#ffcf66" stop-opacity="0.35" />
        <stop offset="1" stop-color="#ffcf66" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Luz detrás del Calvario -->
    <circle class="pieza luz" cx="292" cy="128" r="62" fill="url(#luz-calvario)" style="--i: 0" />

    <!-- Colinas del fondo con la cruz -->
    <g class="pieza lejos" style="--i: 1">
      <path d="M150 212 Q215 150 262 146 Q290 124 318 146 Q360 160 400 196 L400 230 L150 230 Z" />
      <path d="M0 214 Q40 186 90 196 Q120 200 150 212 L150 230 L0 230 Z" />
    </g>

    <!-- La cruz del Calvario -->
    <g class="pieza cerca" style="--i: 1">
      <rect x="290" y="96" width="5" height="40" rx="1" />
      <rect x="279.5" y="107" width="26" height="5" rx="1" />
    </g>

    <!-- Paloma con la ramita de olivo -->
    <g class="pieza cerca paloma" transform="translate(150 42)" style="--i: 2">
      <path d="M0 0 Q-10 -12 -22 -10 Q-14 -6 -10 0 Q-18 2 -24 8 Q-10 8 -2 4 Q6 6 12 2 L18 0 L12 -2 Q6 -4 0 0 Z" />
      <path d="M18 0 L26 4" class="trazo-fino" />
      <ellipse cx="25" cy="2" rx="3" ry="1.4" transform="rotate(30 25 2)" />
      <ellipse cx="28" cy="6" rx="3" ry="1.4" transform="rotate(-20 28 6)" />
    </g>

    <!-- El arca de Noé con una jirafa asomando -->
    <g class="pieza cerca" transform="translate(54 206) scale(0.86)" style="--i: 2">
      <path d="M-58 -24 L58 -24 L46 0 L-46 0 Z" />
      <rect x="-36" y="-46" width="50" height="22" />
      <path d="M-40 -46 L-11 -62 L18 -46 Z" />
      <path d="M22 -24 L26 -24 L36 -58 L31 -59 Z" />
      <path d="M30 -60 Q36 -66 46 -62 L45 -58 Q38 -57 33 -55 Z" />
      <path d="M33 -61 L32 -67 M36 -62 L36 -68" class="trazo-fino" />
      <circle cx="-26" cy="-35" r="3" class="ventana" />
      <circle cx="-14" cy="-35" r="3" class="ventana" />
      <circle cx="-2" cy="-35" r="3" class="ventana" />
    </g>

    <!-- Moisés con las tablas y el bastón -->
    <g class="pieza cerca" transform="translate(150 212)" style="--i: 3">
      <path d="M-13 0 L-8 -38 Q0 -42 8 -38 L13 0 Z" />
      <circle cx="0" cy="-47" r="6.5" />
      <path d="M-4.5 -43 L0 -33 L4.5 -43 Z" />
      <path d="M6 -36 L15 -54" class="trazo" />
      <path d="M17 -74 L12 2" class="trazo-fino" />
      <path d="M-6 -35 L-14 -27" class="trazo" />
      <path d="M-27 -26 L-27 -40 Q-27 -44 -23 -44 L-19 -44 Q-15 -44 -15 -40 L-15 -26 Z" />
      <path d="M-16 -26 L-16 -40 Q-16 -44 -12 -44 L-8 -44 Q-4 -44 -4 -40 L-4 -26 Z" />
    </g>

    <!-- David con la honda -->
    <g class="pieza cerca" transform="translate(190 212) scale(0.78)" style="--i: 4">
      <path d="M-10 -12 L-7 -36 Q0 -39 7 -36 L10 -12 Z" />
      <path d="M-5 -13 L-6 0 M5 -13 L6 0" class="trazo" />
      <circle cx="0" cy="-44" r="6.5" />
      <path d="M6 -33 L12 -52" class="trazo" />
      <path d="M-6 -33 L-15 -24" class="trazo" />
      <path d="M12 -52 Q26 -66 36 -54" class="trazo-fino sin-relleno" />
      <circle cx="37" cy="-53" r="3" />
      <path d="M22 -70 Q34 -72 42 -62" class="trazo-fino sin-relleno movimiento" />
    </g>

    <!-- Goliat con lanza, escudo y casco -->
    <g class="pieza cerca" transform="translate(250 212) scale(1.42)" style="--i: 5">
      <path d="M-13 0 L-9 -38 Q0 -42 9 -38 L13 0 Z" />
      <circle cx="0" cy="-47" r="6.5" />
      <path d="M-7.5 -48 Q-8 -57 0 -58 Q8 -57 7.5 -48 Z" />
      <path d="M-2 -57 Q-1 -66 8 -66 Q4 -61 2 -57 Z" />
      <circle cx="-13" cy="-24" r="9" />
      <path d="M8 -34 L16 -26" class="trazo" />
      <path d="M17 -80 L15 2" class="trazo-fino" />
      <path d="M14 -84 L17 -92 L20 -84 Z" />
    </g>

    <!-- El león de Daniel, tumbado y tranquilo -->
    <g class="pieza cerca" transform="translate(300 208)" style="--i: 6">
      <ellipse cx="8" cy="-9" rx="20" ry="9" />
      <path d="M-14.0 -34.0 L-12.1 -30.3 L-9.0 -33.0 L-8.7 -28.9 L-4.8 -30.2 L-6.1 -26.3 L-2.0 -26.0 L-4.7 -22.9 L-1.0 -21.0 L-4.7 -19.1 L-2.0 -16.0 L-6.1 -15.7 L-4.8 -11.8 L-8.7 -13.1 L-9.0 -9.0 L-12.1 -11.7 L-14.0 -8.0 L-15.9 -11.7 L-19.0 -9.0 L-19.3 -13.1 L-23.2 -11.8 L-21.9 -15.7 L-26.0 -16.0 L-23.3 -19.1 L-27.0 -21.0 L-23.3 -22.9 L-26.0 -26.0 L-21.9 -26.3 L-23.2 -30.2 L-19.3 -28.9 L-19.0 -33.0 L-15.9 -30.3 Z" />
      <path d="M-20 -24 Q-27 -22 -27 -16 Q-24 -12 -18 -13 Z" />
      <path d="M-22 0 L-2 0 L-2 -5 L-20 -5 Z" />
      <path d="M26 -8 Q36 -6 36 -18" class="trazo-fino sin-relleno" />
      <circle cx="36" cy="-19" r="2.6" />
    </g>

    <!-- El gran pez de Jonás saltando fuera del agua -->
    <g class="pieza cerca" transform="translate(374 204)" style="--i: 7">
      <ellipse cx="2" cy="-18" rx="22" ry="12" transform="rotate(-24 2 -18)" />
      <path d="M-16 -6 L-30 -2 L-26 -10 L-30 -20 Z" />
      <path d="M-2 -30 Q4 -38 10 -36 Q8 -32 8 -28 Z" />
      <path d="M22 -30 L13 -24 L24 -22 Z" class="boca" />
      <circle cx="12" cy="-30" r="2" class="ojo" />
      <path d="M-34 4 Q-30 -2 -26 4 M28 4 Q32 -2 36 4" class="trazo-fino sin-relleno" />
    </g>

    <!-- Suelo y agua (el suelo sigue más allá de los bordes en pantallas anchas) -->
    <rect class="cerca" x="-2000" y="212" width="4400" height="40" />
    <path class="pieza cerca" style="--i: 1" d="M0 206 Q60 200 120 206 Q200 214 280 208 Q330 204 344 208 L344 230 L0 230 Z" />
    <path class="pieza cerca" style="--i: 1" d="M338 206 Q350 202 362 206 Q374 210 386 206 Q394 203 400 205 L400 230 L338 230 Z" />
  </svg>
</template>

<style scoped>
.escena {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.cerca {
  fill: var(--silueta);
}

.lejos {
  fill: var(--silueta-lejos);
}

.trazo,
.trazo-fino {
  fill: none;
  stroke: var(--silueta);
  stroke-linecap: round;
}

.trazo {
  stroke-width: 4;
}

.trazo-fino {
  stroke-width: 2.2;
}

.sin-relleno {
  fill: none;
}

.ojo,
.ventana,
.boca {
  fill: var(--cielo-horizonte);
}

.movimiento {
  opacity: 0.5;
}

/* Entrada: cada pieza sube y aparece, de izquierda a derecha */
.pieza {
  opacity: 0;
  animation: sube 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: calc(0.15s + var(--i) * 0.12s);
}

.luz {
  animation-name: amanece;
  animation-duration: 1.6s;
}

@keyframes sube {
  from {
    opacity: 0;
    translate: 0 14px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

@keyframes amanece {
  from {
    opacity: 0;
    scale: 0.6;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

.luz {
  transform-origin: 292px 128px;
}
</style>
