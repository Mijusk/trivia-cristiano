# Trivia Cristiano

Juego de mesa bíblico por parejas que se juega entero desde un móvil o tablet que se pasa de mano en mano.

## Cómo se juega

- Cada pareja elige su **nivel** (Peques, Media o Experta), así pueden jugar juntos niños y mayores.
- En su turno, la pareja gira **su ruleta**, que solo tiene las casillas que le faltan.
- Cada casilla combina un **tema** (color) y una **prueba** (icono):
  - Temas: 🟩 Pentateuco · 🟦 Históricos · 🟨 Profetas y Sapienciales · 🟥 Nuevo Testamento · 🟪 Vida Cristiana (Misa, sacramentos, año litúrgico, santos y oraciones)
  - Pruebas: ❓ Pregunta · ✏️ Dibujar (en papel) · 🗣️ Describir · 🎭 Mímica
- Al preparar la partida se eligen los **temas** con los que se juega (todos marcados por defecto, al menos uno). La ruleta, la ficha de quesitos y la victoria solo cuentan esos temas.
- Con Vida Cristiana marcada se puede encender **«Incluir temas del Camino Neocatecumenal»** (apagado por defecto): sus cartas se mezclan con las de Vida Cristiana.
- En Dibujar, Describir y Mímica la carta sale tapada: solo la ve quien actúa (mantener pulsado). En Describir y Mímica solo vale si la pareja dice exactamente lo que pone en grande; en Dibujar basta con decir las palabras resaltadas.
- Cada carta tiene una pista: en las preguntas de Peques quita una opción falsa; en el resto de niveles muestra tres opciones. En Dibujar y Mímica da una pequeña ayuda en voz alta. En Describir son ideas para quien describe, dentro de la carta tapada.
- Se puede cambiar de carta una vez por turno.
- Si aciertan, ganan ese quesito. Acierten o no, pasa el turno.
- Gana la primera pareja que completa todos los temas de la partida. La duración se elige al empezar:
  - **Corta:** 1 quesito por tema
  - **Media:** 2 quesitos por tema
  - **Completa:** todas las casillas (las 4 pruebas de cada tema)

La partida se guarda en el navegador, así que se puede cerrar y continuar. Las partidas guardadas antes de poder elegir temas se continúan con los cuatro temas bíblicos y sin el Camino.

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # comprobación de tipos + build de producción
npm run check:cards  # valida el banco de tarjetas
npm test             # tests (Vitest); npm run test:watch los repite al guardar
```

Los tests están junto al código (`*.test.ts`): reglas, mazo, guardado, avisos y los stores de la partida y de los avisos.

### Avisos de cartas con errores

En la pantalla de resultado (y en la de victoria) está «⚠️ ¿Esta carta tiene un error?»: se elige el motivo, se puede añadir un comentario y la carta queda marcada en ese dispositivo (`localStorage`, `trivia-cristiano/avisos/v1`), aunque se termine la partida. Si hay alguna, la portada muestra «Cartas con aviso (N)» con la lista para copiarla o compartirla, una línea por carta con su `id`, tema, prueba y nivel, para buscarla en `src/data/`. Código en `src/game/avisos.ts`, `src/stores/avisos.ts` y los componentes `AvisarCarta.vue` y `AvisosModal.vue`.

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

Cada tarjeta lleva `id`, `tema` (`pentateuco`, `historicos`, `profetas`, `nt`, `vida`), `nivel` (`peques`, `media`, `experta`) y una `referencia` opcional: bíblica o, en Vida Cristiana, también del Catecismo (`CEC 1210`).

Las tarjetas del Camino Neocatecumenal son de Vida Cristiana y llevan además `"camino": true`. Solo salen si la partida incluye el Camino; el mínimo de tarjetas por tema, prueba y nivel se cuenta sin ellas, porque con la opción apagada Vida Cristiana se juega solo con las generales.

El `id` es `<prueba>-<número>` (`pregunta-120`, `mimica-37`…) y no se cambia nunca, ni al reordenar ni al borrar otras tarjetas: lo usan las partidas guardadas y el historial de cartas usadas. Una tarjeta nueva lleva el siguiente número libre, que muestra `npm run check:cards`; el número de una tarjeta borrada no se reutiliza.

| Archivo | Campos |
|---|---|
| `preguntas.json` | `pregunta`, `respuesta`, `opciones` (siempre 3, una es la respuesta) |
| `dibujar.json` | `adivinar` (la situación), `claves` (1 o 2 palabras de `adivinar` que basta con decir), `tipo`, `escena` (qué dibujar), `pista` |
| `mimica.json` | `adivinar` (lo que hay que decir, máx. 3 palabras), `tipo`, `escena` (ayuda para quien actúa), `pista` |
| `describir.json` | `palabra`, `prohibidas` (vacío en peques, 3 o más en el resto), `pista` (ideas para quien describe; no puede usar la palabra ni las prohibidas) |

Criterios:

- **Peques:** historias de una Biblia infantil. **Media:** lo que conoce alguien que va a la iglesia. **Experta:** detalles, pero que se puedan deducir con la pista.
- Cada pregunta da contexto de la historia; nada de datos sueltos.
- Dibujar: situaciones que se entienden en un papel. Peques, una cosa con una clave; Media, escenas famosas; Experta, escenas, parábolas y visiones.
- Mímica: si para explicarla hace falta hablar, no sirve. Peques son animales y objetos; Media, personajes con su gesto famoso; Experta, escenas y parábolas.
- Vida Cristiana sigue el Catecismo de la Iglesia Católica y, en las respuestas de la misa, el Misal Romano en español de la Conferencia Episcopal Española («Y con tu espíritu», «Te alabamos, Señor»…). **Peques:** lo que sabe un niño de catequesis de comunión. **Media:** lo que sabe alguien que va a misa. **Experta:** detalles que se deducen con la pista. Nada polémico ni de opinión.
- Camino Neocatecumenal: solo hechos contrastables y en tono respetuoso; si un dato no está claro, no se usa.

Después de editar, ejecuta `npm run check:cards`. Además de los campos, comprueba:

- **Citas bíblicas:** que el libro, el capítulo y el versículo existan en la Biblia de la CEE (formato `Gén 6,14`, `Gén 1,1–2,3`, `Éx 7–12`, `Sal 23 (22),1`; también vale `CEC 1210`). La estructura de capítulos y versículos, sin texto, está en `scripts/biblia-cee.json`. Una cita que no existe es un error.
- **Repetidas o parecidas:** cartas de la misma prueba con la misma palabra o lo mismo que adivinar, aunque estén en otro tema o nivel. Solo avisa (⚠) y no hace fallar; con `node scripts/check-cards.mjs --estricto` sí falla.

Si en un tema no quedan cartas sin usar para el nivel de la pareja, el juego saca una de otro de los temas de la partida, del mismo nivel, y el quesito cuenta igual. Cuando ya han salido todas las de esa prueba y nivel, el mazo vuelve a empezar y la carta lo avisa.

## El regalo

La primera vez que se abre el juego aparece un sobre con lazo y una etiqueta con una dedicatoria
(`src/components/RegaloSobre.vue`). El texto está en `src/regalo/dedicatoria.ts`.

- Sale solo la primera vez en cada navegador.
- Para volver a verlo: abrir la web con `?regalo` al final, o mantener pulsado el logo de la portada un segundo.
