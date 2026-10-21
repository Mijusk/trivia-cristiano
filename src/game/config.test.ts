import { describe, expect, it } from 'vitest'
import { resaltarClaves } from './config'

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
