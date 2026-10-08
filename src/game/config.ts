import type { Modo, Nivel, Prueba, Tema } from '../types'

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

export const TIEMPOS_POR_DEFECTO = { pregunta: 30, actuar: 60 }
