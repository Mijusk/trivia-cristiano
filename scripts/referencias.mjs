// Comprueba que una referencia bíblica existe en la Biblia de la Conferencia Episcopal Española.
// biblia-cee.json solo guarda la estructura (capítulos y versículos de cada libro), no el texto.
import { readFileSync } from 'node:fs'

const { libros, salmosGriega } = JSON.parse(readFileSync(new URL('./biblia-cee.json', import.meta.url), 'utf8'))
const DE_UN_CAPITULO = new Set(['Abd', 'Flm', 'Jds', '2 Jn', '3 Jn'])

/** Posición del versículo en el capítulo, o -1 si no existe. «17a», «12k»… solo existen en los capítulos que los tienen. */
function posicion(capitulo, versiculo) {
  if (typeof capitulo === 'number') return /^\d+$/.test(versiculo) && Number(versiculo) >= 1 && Number(versiculo) <= capitulo ? Number(versiculo) - 1 : -1
  return capitulo.indexOf(versiculo)
}

/**
 * Devuelve null si la referencia es válida, o el motivo si no lo es. Formatos:
 * «Gén 6,14», «Gén 6,13-22», «Gén 1,1–2,3», «Éx 7–12», «Gén 37,3-24; 39,1», «Jon 1,5.13»,
 * «Sal 23 (22),1», «Est 4,17k», «Flm 10-16», «CEC 1210» y «Libro de los Salmos».
 */
export function comprobarReferencia(ref) {
  if (/^CEC \d+(-\d+)?$/.test(ref)) return null
  if (/^Libro de /.test(ref)) return null
  const m = ref.match(/^((?:[123] )?[A-ZÁÉÍÓÚa-záéíóúñ]+)\s+(.+)$/)
  if (!m) return 'no tiene el formato «Libro capítulo,versículo»'
  const [, abrev, resto0] = m
  const libro = libros[abrev]
  if (!libro) return `libro desconocido «${abrev}» (abreviaturas como Gén, 1 Sam, Sal, Mt…)`

  let resto = resto0
  const griega = resto.match(/^(\d+)\s*\(([^)]+)\)/)
  if (griega) {
    if (abrev !== 'Sal') return 'solo los salmos llevan la otra numeración entre paréntesis'
    const esperada = salmosGriega[griega[1]]
    if (esperada && esperada.toLowerCase() !== griega[2].toLowerCase())
      return `el salmo ${griega[1]} es el ${esperada} en la numeración griega, no el ${griega[2]}`
    resto = resto.replace(/\s*\([^)]+\)/, '')
  }
  if (DE_UN_CAPITULO.has(abrev) && !resto.includes(',')) resto = `1,${resto}`

  for (const grupo of resto.split(/;\s*/)) {
    let capActual = null
    for (const trozo of grupo.split(/\.\s*/)) {
      const tramo = trozo.includes(',') || capActual === null ? trozo : `${capActual},${trozo}`
      const t = tramo.match(/^(\d+)(?:,(\d+[a-z]?))?(?:\s*[-–]\s*(?:(\d+),)?(\d+[a-z]?))?$/)
      if (!t) return `no entiendo «${trozo}»`
      const [, c1, v1, c2, v2] = t
      if (!libro[c1]) return `${abrev} no tiene capítulo ${c1}`
      if (!v1) {
        // «Éx 7–12»: de capítulo a capítulo.
        if (v2 && !libro[v2]) return `${abrev} no tiene capítulo ${v2}`
        if (v2 && Number(v2) < Number(c1)) return `el tramo ${c1}–${v2} va hacia atrás`
        capActual = v2 ?? c1
        continue
      }
      const cFin = c2 ?? c1
      const vFin = v2 ?? v1
      if (!libro[cFin]) return `${abrev} no tiene capítulo ${cFin}`
      if (posicion(libro[c1], v1) < 0) return `${abrev} ${c1} no tiene versículo ${v1}`
      if (posicion(libro[cFin], vFin) < 0) return `${abrev} ${cFin} no tiene versículo ${vFin}`
      if (Number(cFin) < Number(c1) || (cFin === c1 && posicion(libro[c1], vFin) < posicion(libro[c1], v1)))
        return `el tramo ${tramo} va hacia atrás`
      capActual = cFin
    }
  }
  return null
}
