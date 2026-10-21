import { describe, expect, it } from 'vitest'
import { COLORES, GROSORES, dibujoVacio, hayDibujo, pintarTrazo, redondear, rutaSvg, type Trazo } from './pizarra'

/** Lienzo de mentira que apunta lo que se le pide pintar. */
function lienzoFalso() {
  const llamadas: string[] = []
  const ctx = {
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    beginPath: () => llamadas.push('beginPath'),
    moveTo: (x: number, y: number) => llamadas.push(`moveTo ${x} ${y}`),
    lineTo: (x: number, y: number) => llamadas.push(`lineTo ${x} ${y}`),
    arc: (x: number, y: number, r: number) => llamadas.push(`arc ${x} ${y} ${r}`),
    stroke: () => llamadas.push('stroke'),
    fill: () => llamadas.push('fill'),
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, llamadas, estado: ctx }
}

const trazo = (puntos: number[]): Trazo => ({ color: '#e5484d', grosor: 0.05, puntos })

describe('herramientas', () => {
  it('hay 6 colores y 3 grosores, de menos a más', () => {
    expect(COLORES).toHaveLength(6)
    expect(new Set(COLORES.map((c) => c.color)).size).toBe(6)
    expect(GROSORES.map((g) => g.grosor)).toEqual([...GROSORES.map((g) => g.grosor)].sort((a, b) => a - b))
  })
})

describe('rutaSvg', () => {
  it('une los puntos con líneas', () => {
    expect(rutaSvg([0.1, 0.2, 0.3, 0.4, 0.5, 0.6])).toBe('M0.1 0.2L0.3 0.4L0.5 0.6')
  })

  it('un toque suelto se queda como un punto', () => {
    expect(rutaSvg([0.5, 0.5])).toBe('M0.5 0.5L0.5 0.5')
  })

  it('sin puntos no hay ruta', () => {
    expect(rutaSvg([])).toBe('')
  })
})

describe('pintarTrazo', () => {
  it('pinta el trazo entero a la escala de la pizarra, con su color y grosor', () => {
    const { ctx, llamadas, estado } = lienzoFalso()
    pintarTrazo(ctx, trazo([0.1, 0.2, 0.5, 0.5]), 200)
    expect(llamadas).toEqual(['beginPath', 'moveTo 20 40', 'lineTo 100 100', 'stroke'])
    expect(estado).toMatchObject({ strokeStyle: '#e5484d', lineWidth: 10, lineCap: 'round', lineJoin: 'round' })
  })

  it('mientras se dibuja, solo pinta el trozo nuevo, empezando en el último punto ya pintado', () => {
    const { ctx, llamadas } = lienzoFalso()
    pintarTrazo(ctx, trazo([0, 0, 0.1, 0.1, 0.2, 0.2, 0.3, 0.3]), 100, 2)
    expect(llamadas).toEqual(['beginPath', 'moveTo 10 10', 'lineTo 20 20', 'lineTo 30 30', 'stroke'])
  })

  it('un solo punto es un círculo del grosor del lápiz', () => {
    const { ctx, llamadas } = lienzoFalso()
    pintarTrazo(ctx, trazo([0.5, 0.25]), 100)
    expect(llamadas).toEqual(['beginPath', 'arc 50 25 2.5', 'fill'])
  })
})

describe('utilidades', () => {
  it('hayDibujo solo si hay algún trazo', () => {
    expect(hayDibujo(null)).toBe(false)
    expect(hayDibujo(dibujoVacio())).toBe(false)
    expect(hayDibujo({ proporcion: 1, trazos: [trazo([0, 0])] })).toBe(true)
  })

  it('redondear deja 4 decimales', () => {
    expect(redondear(0.123456)).toBe(0.1235)
    expect(redondear(1 / 3)).toBe(0.3333)
  })
})
