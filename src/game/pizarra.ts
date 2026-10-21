/*
 * La pizarra guarda el dibujo como trazos y no como imagen: así se puede deshacer, se adapta si
 * cambia el tamaño de la pantalla y se vuelve a pintar igual en el resultado (en SVG).
 * Las coordenadas y el grosor van en fracciones del ancho de la pizarra, no en píxeles.
 */

export interface Trazo {
  color: string
  /** Fracción del ancho de la pizarra. */
  grosor: number
  /** Puntos seguidos x, y, x, y… en fracciones del ancho (y puede pasar de 1 si la pizarra es alta). */
  puntos: number[]
}

export interface Dibujo {
  /** Alto entre ancho de la pizarra en la que se dibujó. */
  proporcion: number
  trazos: Trazo[]
}

export const FONDO = '#ffffff'

export const COLORES = [
  { color: '#1b1d33', nombre: 'Negro' },
  { color: '#e5484d', nombre: 'Rojo' },
  { color: '#3d7be0', nombre: 'Azul' },
  { color: '#3ba55c', nombre: 'Verde' },
  { color: '#f5b700', nombre: 'Amarillo' },
  { color: '#8b5a2b', nombre: 'Marrón' },
] as const

export const GROSORES = [
  { grosor: 0.012, nombre: 'Fino' },
  { grosor: 0.028, nombre: 'Medio' },
  { grosor: 0.06, nombre: 'Gordo' },
] as const

/** La goma borra pintando con el color del fondo, algo más ancha que el lápiz elegido. */
export const FACTOR_GOMA = 2.5

/** Redondea a 4 decimales: de sobra para la pantalla y el dibujo ocupa mucho menos. */
export const redondear = (n: number) => Math.round(n * 10000) / 10000

export const dibujoVacio = (proporcion = 1): Dibujo => ({ proporcion, trazos: [] })

export const hayDibujo = (d: Dibujo | null | undefined): d is Dibujo => !!d && d.trazos.length > 0

/** Ruta SVG del trazo. Un solo punto se dibuja como un círculo gracias al final redondeado. */
export function rutaSvg(puntos: number[]): string {
  if (puntos.length < 2) return ''
  const [x0, y0] = puntos
  if (puntos.length === 2) return `M${x0} ${y0}L${x0} ${y0}`
  let ruta = `M${x0} ${y0}`
  for (let i = 2; i + 1 < puntos.length; i += 2) ruta += `L${puntos[i]} ${puntos[i + 1]}`
  return ruta
}

/** Pinta en el lienzo el trazo entero, o solo desde el punto `desde` (para ir añadiendo mientras se dibuja). */
export function pintarTrazo(ctx: CanvasRenderingContext2D, trazo: Trazo, ancho: number, desde = 0) {
  const { puntos } = trazo
  const grosor = trazo.grosor * ancho
  ctx.strokeStyle = ctx.fillStyle = trazo.color
  ctx.lineWidth = grosor
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (puntos.length === 2) {
    ctx.beginPath()
    ctx.arc(puntos[0] * ancho, puntos[1] * ancho, grosor / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  const inicio = Math.max(0, desde - 1)
  ctx.beginPath()
  ctx.moveTo(puntos[inicio * 2] * ancho, puntos[inicio * 2 + 1] * ancho)
  for (let i = inicio + 1; i * 2 + 1 < puntos.length; i++) ctx.lineTo(puntos[i * 2] * ancho, puntos[i * 2 + 1] * ancho)
  ctx.stroke()
}
