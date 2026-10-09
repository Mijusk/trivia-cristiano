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
  /** Tres opciones, una es la respuesta. En peques se ven siempre; en el resto son la pista. */
  opciones: string[]
}

export type TipoCarta = 'animal' | 'personaje' | 'objeto' | 'escena'

/** Dibujar y mímica: la pareja tiene que decir `adivinar`; la escena ayuda a quien actúa. */
interface CartaActuar extends CartaBase {
  adivinar: string
  /** Se muestra a todos desde el principio, como en el Pictionary. */
  tipo?: TipoCarta
  escena?: string
  /** Se lee en voz alta si la pareja pide pista. */
  pista: string
}

export interface CartaDibujar extends CartaActuar {
  prueba: 'dibujar'
  /** Palabras de `adivinar` que basta con decir (en cualquier orden) para acertar. */
  claves: string[]
}

export interface CartaDescribir extends CartaBase {
  prueba: 'describir'
  palabra: string
  prohibidas: string[]
  /** Ideas para quien describe; solo la ve esa persona, dentro de la carta tapada. */
  pista: string
}

export interface CartaMimica extends CartaActuar {
  prueba: 'mimica'
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
  /** Ya se ha pedido la pista de la carta actual. */
  pistaUsada: boolean
  /** La pareja ya ha cambiado de carta en este turno. */
  cambioUsado: boolean
  usadas: string[]
  ultimoAcierto: boolean | null
  tiempos: { pregunta: number; actuar: number; mimica?: number }
}
