# Trivia Cristiano

Juego de mesa bíblico por parejas que se juega entero desde un móvil o tablet que se pasa de mano en mano.

## Cómo se juega

- Cada pareja elige su **nivel** (Peques, Media o Experta), así pueden jugar juntos niños y mayores.
- En su turno, la pareja gira **su ruleta**, que solo tiene las casillas que le faltan.
- Cada casilla combina un **tema** (color) y una **prueba** (icono):
  - Temas: 🟩 Pentateuco · 🟦 Históricos · 🟨 Profetas y Sapienciales · 🟥 Nuevo Testamento
  - Pruebas: ❓ Pregunta · ✏️ Dibujar (en papel) · 🗣️ Describir · 🎭 Mímica
- En Dibujar, Describir y Mímica la carta sale tapada: solo la ve quien actúa (mantener pulsado). En Describir y Mímica solo vale si la pareja dice exactamente lo que pone en grande; en Dibujar basta con decir las palabras resaltadas.
- Cada carta tiene una pista (menos Describir): en las preguntas de Peques quita una opción falsa; en el resto de niveles muestra tres opciones. En Dibujar y Mímica da una pequeña ayuda en voz alta.
- Se puede cambiar de carta una vez por turno.
- Si aciertan, ganan ese quesito. Acierten o no, pasa el turno.
- Gana la primera pareja que completa los cuatro temas. La duración se elige al empezar:
  - **Corta:** 1 quesito por tema
  - **Media:** 2 quesitos por tema
  - **Completa:** las 16 casillas

La partida se guarda en el navegador, así que se puede cerrar y continuar.

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # comprobación de tipos + build de producción
npm run check:cards  # valida el banco de tarjetas
```

Stack: Vite + Vue 3 + TypeScript + Pinia. Sin backend.

## Estructura

```
src/
├── data/          # banco de tarjetas, un JSON por prueba
├── game/          # configuración, reglas y mazo (lógica pura, sin Vue)
├── stores/        # estado de la partida (Pinia) y guardado en localStorage
├── composables/   # temporizador
├── components/    # ruleta, quesera, carta tapada, fases del turno…
└── views/         # inicio, configurar partida, juego
```

## Añadir tarjetas

El juego sigue la Biblia católica (versión de la Conferencia Episcopal Española), deuterocanónicos incluidos: «el Señor» y no «Jehová», nombres católicos (Abrahán, Baltasar…) y referencias en formato católico (`Gén 6,14`, `Sal 23 (22),1`, `Jon 2,1`).

Cada tarjeta lleva `tema` (`pentateuco`, `historicos`, `profetas`, `nt`), `nivel` (`peques`, `media`, `experta`) y una `referencia` bíblica opcional.

| Archivo | Campos |
|---|---|
| `preguntas.json` | `pregunta`, `respuesta`, `opciones` (siempre 3, una es la respuesta) |
| `dibujar.json` | `adivinar` (la situación), `claves` (1 o 2 palabras de `adivinar` que basta con decir), `tipo`, `escena` (qué dibujar), `pista` |
| `mimica.json` | `adivinar` (lo que hay que decir, máx. 3 palabras), `tipo`, `escena` (ayuda para quien actúa), `pista` |
| `describir.json` | `palabra`, `prohibidas` (vacío en peques, 3 o más en el resto) |

Criterios:

- **Peques:** historias de una Biblia infantil. **Media:** lo que conoce alguien que va a la iglesia. **Experta:** detalles, pero que se puedan deducir con la pista.
- Cada pregunta da contexto de la historia; nada de datos sueltos.
- Dibujar: situaciones que se entienden en un papel. Peques, una cosa con una clave; Media, escenas famosas; Experta, escenas, parábolas y visiones.
- Mímica: si para explicarla hace falta hablar, no sirve. Peques son animales y objetos; Media, personajes con su gesto famoso; Experta, escenas y parábolas.

Después de editar, ejecuta `npm run check:cards`.

Si en un tema no quedan cartas sin usar para el nivel de la pareja, el juego saca una de otro tema del mismo nivel y el quesito cuenta igual.

## El regalo

La primera vez que se abre el juego aparece un sobre con lazo y una etiqueta con una dedicatoria
(`src/components/RegaloSobre.vue`). El texto está en `src/regalo/dedicatoria.ts`.

- Sale solo la primera vez en cada navegador.
- Para volver a verlo: abrir la web con `?regalo` al final, o mantener pulsado el logo de la portada un segundo.
