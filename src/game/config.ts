import type { DibujarEn, Modo, Nivel, Prueba, Tema, TipoCarta } from '../types'

export const TEMAS: Tema[] = ['pentateuco', 'historicos', 'profetas', 'nt', 'vida']
/** Los cuatro temas de la Biblia: con ellos se cargan las partidas guardadas antes de poder elegir. */
export const TEMAS_BIBLICOS: Tema[] = ['pentateuco', 'historicos', 'profetas', 'nt']
export const PRUEBAS: Prueba[] = ['pregunta', 'dibujar', 'describir', 'mimica']
export const NIVELES: Nivel[] = ['peques', 'media', 'experta']
export const MODOS: Modo[] = ['corta', 'media', 'completa']
export const DIBUJAR_EN: DibujarEn[] = ['papel', 'pantalla']

export const INFO_TEMA: Record<Tema, { nombre: string; descripcion: string; color: string }> = {
  pentateuco: { nombre: 'Pentateuco', descripcion: 'Génesis – Deuteronomio', color: 'var(--tema-pentateuco)' },
  historicos: { nombre: 'Históricos', descripcion: 'Josué – Macabeos', color: 'var(--tema-historicos)' },
  profetas: { nombre: 'Profetas y Sapienciales', descripcion: 'Job – Malaquías', color: 'var(--tema-profetas)' },
  nt: { nombre: 'Nuevo Testamento', descripcion: 'Mateo – Apocalipsis', color: 'var(--tema-nt)' },
  vida: {
    nombre: 'Vida Cristiana',
    descripcion: 'Misa, sacramentos, año litúrgico, santos y oraciones',
    color: 'var(--tema-vida)',
  },
}

/** Deja solo temas válidos, sin repetir y en el orden de TEMAS (el de la ruleta y la quesera). */
export function ordenarTemas(lista: readonly unknown[]): Tema[] {
  return TEMAS.filter((t) => lista.includes(t))
}

export const INFO_PRUEBA: Record<Prueba, { nombre: string; icono: string; instruccion: string }> = {
  pregunta: { nombre: 'Pregunta', icono: '❓', instruccion: 'Responded entre los dos.' },
  dibujar: { nombre: 'Dibujar', icono: '✏️', instruccion: 'Dibuja sin letras ni números.' },
  describir: { nombre: 'Describir', icono: '🗣️', instruccion: 'Descríbelo sin decir la palabra ni las prohibidas.' },
  mimica: { nombre: 'Mímica', icono: '🎭', instruccion: 'Imítalo sin hablar ni hacer sonidos.' },
}

export const INFO_NIVEL: Record<Nivel, { nombre: string; descripcion: string }> = {
  peques: { nombre: 'Peques', descripcion: 'Historias conocidas, preguntas con opciones' },
  media: { nombre: 'Media', descripcion: 'Para quien conoce las historias principales' },
  experta: { nombre: 'Experta', descripcion: 'Detalles para quien se la sabe bien' },
}

/** Quesitos que hay que ganar de cada tema para completarlo. */
export const META_POR_TEMA: Record<Modo, number> = { corta: 1, media: 2, completa: 4 }

export const INFO_MODO: Record<Modo, { nombre: string }> = {
  corta: { nombre: 'Corta' },
  media: { nombre: 'Media' },
  completa: { nombre: 'Completa' },
}

export const INFO_DIBUJAR_EN: Record<DibujarEn, { nombre: string; descripcion: string }> = {
  papel: { nombre: 'En papel', descripcion: 'Con papel y boli, como siempre.' },
  pantalla: { nombre: 'En la pantalla', descripcion: 'Una pizarra en el móvil para dibujar con el dedo, con colores y goma.' },
}

/** Lo que dura cada modo jugando con los cuatro temas bíblicos; con más o menos temas se escala. */
const MINUTOS_CON_CUATRO_TEMAS: Record<Modo, number> = { corta: 45, media: 90, completa: 150 }

/** «1 quesito de cada tema, unos 45 min»: depende de con cuántos temas se juegue. */
export function descripcionModo(modo: Modo, numTemas: number): string {
  const meta = META_POR_TEMA[modo]
  const minutos = (MINUTOS_CON_CUATRO_TEMAS[modo] * numTemas) / 4
  const duracion =
    minutos >= 120 ? `más de ${Math.floor(minutos / 60)} horas` : `unos ${Math.max(5, Math.round(minutos / 5) * 5)} min`
  const casillas = modo === 'completa' ? `Las ${meta * numTemas} casillas` : `${meta} quesito${meta > 1 ? 's' : ''} de cada tema`
  return `${casillas}, ${duracion}`
}

export const TIEMPOS_POR_DEFECTO = { pregunta: 30, actuar: 60, mimica: 90 }

/**
 * Tiempo que cuesta cada ayuda, en fracción del tiempo total de la carta.
 * Depende del nivel de la pareja que juega; los peques no pagan nada.
 */
export const PENALIZACION: Record<Nivel, { cambio: number; pista: number }> = {
  peques: { cambio: 0, pista: 0 },
  media: { cambio: 0.2, pista: 0.15 },
  experta: { cambio: 0.3, pista: 0.2 },
}

/** Por muchas ayudas que se pidan, el reloj nunca baja de aquí. */
export const SEGUNDOS_MINIMOS = 5

/** En media y experta se puede cambiar de carta durante este tiempo desde que aparece. */
export const SEGUNDOS_PARA_CAMBIAR = 15

/** En las preguntas de media y experta el reloj arranca solo tras este tiempo de lectura. */
export const SEGUNDOS_LECTURA = 3

/** Cómo se anuncia el tipo de carta en voz alta: «Es un animal». */
export const TEXTO_TIPO: Record<TipoCarta, string> = {
  animal: 'un animal',
  personaje: 'un personaje',
  objeto: 'un objeto',
  escena: 'una escena',
}

/**
 * Parte un texto en trozos marcando las palabras clave, para resaltarlas.
 * «Jonás dentro del pez» con claves [Jonás, pez] → Jonás(clave) · dentro del · pez(clave)
 */
export function resaltarClaves(texto: string, claves: string[]): { texto: string; clave: boolean }[] {
  if (!claves.length) return [{ texto, clave: false }]
  const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patron = new RegExp(`(${claves.map(escapar).join('|')})`, 'gi')
  return texto
    .split(patron)
    .filter(Boolean)
    .map((trozo) => ({ texto: trozo, clave: claves.some((c) => c.toLowerCase() === trozo.toLowerCase()) }))
}
