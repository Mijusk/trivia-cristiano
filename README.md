# Trivia Cristiano

Juego de mesa bíblico por parejas que se juega entero desde un móvil o tablet que se pasa de mano en mano.

## Cómo se juega

- Cada pareja elige su **nivel** (Peques, Media o Experta), así pueden jugar juntos niños y mayores.
- En su turno, la pareja gira **su ruleta**, que solo tiene las casillas que le faltan.
- Cada casilla combina un **tema** (color) y una **prueba** (icono):
  - Temas: 🟩 Pentateuco · 🟦 Históricos · 🟨 Profetas y Sapienciales · 🟥 Nuevo Testamento
  - Pruebas: ❓ Pregunta · ✏️ Dibujar (en papel) · 🗣️ Describir · 🎭 Mímica
- En Dibujar, Describir y Mímica la carta sale tapada: solo la ve quien actúa (mantener pulsado).
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

Cada tarjeta lleva `tema` (`pentateuco`, `historicos`, `profetas`, `nt`), `nivel` (`peques`, `media`, `experta`) y una `referencia` bíblica opcional.

| Archivo | Campos |
|---|---|
| `preguntas.json` | `pregunta`, `respuesta`, `opciones` (obligatorias en peques; la respuesta debe estar entre ellas) |
| `dibujar.json` / `mimica.json` | `texto` |
| `describir.json` | `palabra`, `prohibidas` (vacío en peques) |

Después de editar, ejecuta `npm run check:cards`.

Si en un tema no quedan cartas sin usar para el nivel de la pareja, el juego saca una de otro tema del mismo nivel y el quesito cuenta igual.
