export type Tema = 'pentateuco' | 'historicos' | 'profetas' | 'nt'
export type Prueba = 'pregunta' | 'dibujar' | 'describir' | 'mimica'
export type Nivel = 'peques' | 'media' | 'experta'
export type Modo = 'corta' | 'media' | 'completa'

/** Una casilla de la ruleta: un tema jugado con una prueba concreta. */
export interface Casilla {
  tema: Tema
  prueba: Prueba
}

/** "tema:prueba", la forma en la que se guardan los quesitos ganados. */
export type CasillaKey = `${Tema}:${Prueba}`

interface CartaBase {
  id: string
  tema: Tema
  nivel: Nivel
  referencia?: string
}

export interface CartaPregunta extends CartaBase {
  prueba: 'pregunta'
  pregunta: string
  respuesta: string
  opciones?: string[]
}

export interface CartaDibujar extends CartaBase {
  prueba: 'dibujar'
  texto: string
}

export interface CartaDescribir extends CartaBase {
  prueba: 'describir'
  palabra: string
  prohibidas: string[]
}

export interface CartaMimica extends CartaBase {
  prueba: 'mimica'
  texto: string
}

export type Carta = CartaPregunta | CartaDibujar | CartaDescribir | CartaMimica

export interface Pareja {
  id: string
  nombre: string
  nivel: Nivel
  ganadas: CasillaKey[]
}

/** Fases de una partida en curso. */
export type Fase = 'turno' | 'carta' | 'resultado' | 'victoria'

export interface Partida {
  version: 1
  fase: Fase
  modo: Modo
  parejas: Pareja[]
  turno: number
  casilla: Casilla | null
  cartaId: string | null
  /** La carta salió de otro tema porque no quedaban del tema pedido. */
  cartaDeOtroTema: boolean
  usadas: string[]
  ultimoAcierto: boolean | null
  tiempos: { pregunta: number; actuar: number }
}
