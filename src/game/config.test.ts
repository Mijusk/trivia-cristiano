import { describe, expect, it } from 'vitest'
import { TEMAS, descripcionModo, ordenarTemas, resaltarClaves } from './config'

describe('ordenarTemas', () => {
  it('quita lo que no es un tema y los repetidos, y ordena como TEMAS', () => {
    expect(ordenarTemas(['vida', 'nt', 'vida', 'cielo', 3, 'pentateuco'])).toEqual(['pentateuco', 'nt', 'vida'])
    expect(ordenarTemas([])).toEqual([])
    expect(ordenarTemas([...TEMAS].reverse())).toEqual(TEMAS)
  })
})

describe('descripcionModo', () => {
  it('con los cuatro temas bíblicos dice lo de siempre', () => {
    expect(descripcionModo('corta', 4)).toBe('1 quesito de cada tema, unos 45 min')
    expect(descripcionModo('media', 4)).toBe('2 quesitos de cada tema, unos 90 min')
    expect(descripcionModo('completa', 4)).toBe('Las 16 casillas, más de 2 horas')
  })

  it('cambia con el número de temas', () => {
    expect(descripcionModo('completa', 5)).toBe('Las 20 casillas, más de 3 horas')
    expect(descripcionModo('corta', 1)).toBe('1 quesito de cada tema, unos 10 min')
    expect(descripcionModo('completa', 1)).toBe('Las 4 casillas, unos 40 min')
  })
})

describe('resaltarClaves', () => {
  it('marca las palabras clave y deja el resto', () => {
    expect(resaltarClaves('Jonás dentro del pez', ['Jonás', 'pez'])).toEqual([
      { texto: 'Jonás', clave: true },
      { texto: ' dentro del ', clave: false },
      { texto: 'pez', clave: true },
    ])
  })

  it('no distingue mayúsculas', () => {
    expect(resaltarClaves('El arca de Noé', ['ARCA'])).toEqual([
      { texto: 'El ', clave: false },
      { texto: 'arca', clave: true },
      { texto: ' de Noé', clave: false },
    ])
  })

  it('sin claves devuelve el texto entero', () => {
    expect(resaltarClaves('La zarza ardiendo', [])).toEqual([{ texto: 'La zarza ardiendo', clave: false }])
  })

  it('escapa los signos especiales de las claves', () => {
    expect(resaltarClaves('¿Quién? (Moisés)', ['(Moisés)'])).toEqual([
      { texto: '¿Quién? ', clave: false },
      { texto: '(Moisés)', clave: true },
    ])
  })
})
