import type { Modo, Nivel, Prueba, Tema, TipoCarta } from '../types'

export const TEMAS: Tema[] = ['pentateuco', 'historicos', 'profetas', 'nt']
export const PRUEBAS: Prueba[] = ['pregunta', 'dibujar', 'describir', 'mimica']
export const NIVELES: Nivel[] = ['peques', 'media', 'experta']
export const MODOS: Modo[] = ['corta', 'media', 'completa']

export const INFO_TEMA: Record<Tema, { nombre: string; libros: string; color: string }> = {
  pentateuco: { nombre: 'Pentateuco', libros: 'Génesis – Deuteronomio', color: 'var(--tema-pentateuco)' },
  historicos: { nombre: 'Históricos', libros: 'Josué – Macabeos', color: 'var(--tema-historicos)' },
  profetas: { nombre: 'Profetas y Sapienciales', libros: 'Job – Malaquías', color: 'var(--tema-profetas)' },
  nt: { nombre: 'Nuevo Testamento', libros: 'Mateo – Apocalipsis', color: 'var(--tema-nt)' },
}

export const INFO_PRUEBA: Record<Prueba, { nombre: string; icono: string; instruccion: string }> = {
  pregunta: { nombre: 'Pregunta', icono: '❓', instruccion: 'Responded entre los dos.' },
  dibujar: { nombre: 'Dibujar', icono: '✏️', instruccion: 'Dibuja en papel sin letras ni números.' },
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

export const INFO_MODO: Record<Modo, { nombre: string; descripcion: string }> = {
  corta: { nombre: 'Corta', descripcion: '1 quesito de cada tema, unos 45 min' },
  media: { nombre: 'Media', descripcion: '2 quesitos de cada tema, unos 90 min' },
  completa: { nombre: 'Completa', descripcion: 'Las 16 casillas, más de 2 horas' },
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
