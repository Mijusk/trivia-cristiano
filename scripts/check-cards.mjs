// Comprueba el banco de tarjetas: campos obligatorios, que la respuesta esté
// entre las opciones y cuántas cartas hay en cada tema × prueba × nivel.
import { readFileSync } from 'node:fs'

const TEMAS = ['pentateuco', 'historicos', 'profetas', 'nt']
const NIVELES = ['peques', 'media', 'experta']
const ARCHIVOS = { pregunta: 'preguntas', dibujar: 'dibujar', describir: 'describir', mimica: 'mimica' }
const MINIMO = 3

let errores = 0
const fallo = (msg) => {
  errores++
  console.error('✗', msg)
}

/** Minúsculas, sin tildes y sin signos, para comparar palabras sueltas. */
const normalizar = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zñ0-9]+/g, ' ')
    .trim()

const tabla = {}
for (const [prueba, archivo] of Object.entries(ARCHIVOS)) {
  const cartas = JSON.parse(readFileSync(new URL(`../src/data/${archivo}.json`, import.meta.url), 'utf8'))
  const vistas = new Set()
  cartas.forEach((c, i) => {
    const donde = `${archivo}.json #${i}`
    if (!TEMAS.includes(c.tema)) fallo(`${donde}: tema "${c.tema}" no válido`)
    if (!NIVELES.includes(c.nivel)) fallo(`${donde}: nivel "${c.nivel}" no válido`)
    const texto = c.pregunta ?? c.palabra ?? c.adivinar
    if (!texto) fallo(`${donde}: falta el texto de la carta`)
    if (/Jehová/i.test(JSON.stringify(c))) fallo(`${donde}: usa «Jehová»; en la versión católica es «el Señor»`)
    if (c.referencia && /\d:\d/.test(c.referencia)) fallo(`${donde}: la referencia usa «:»; en formato católico es «,» (Gén 6,14)`)
    if (vistas.has(`${c.nivel}|${texto}`)) fallo(`${donde}: repetida en el mismo nivel: "${texto}"`)
    vistas.add(`${c.nivel}|${texto}`)
    if (prueba === 'pregunta') {
      if (!c.respuesta) fallo(`${donde}: falta la respuesta`)
      if (!Array.isArray(c.opciones) || c.opciones.length !== 3) fallo(`${donde}: necesita exactamente 3 opciones`)
      else if (!c.opciones.includes(c.respuesta)) fallo(`${donde}: la respuesta no está entre las opciones`)
      else if (new Set(c.opciones).size !== 3) fallo(`${donde}: opciones repetidas`)
    }
    if (prueba === 'dibujar' || prueba === 'mimica') {
      if (!c.pista) fallo(`${donde}: falta la pista`)
      if (prueba === 'mimica' && !['animal', 'personaje', 'objeto', 'escena'].includes(c.tipo))
        fallo(`${donde}: la mímica necesita tipo (animal, personaje, objeto o escena)`)
      const VACIAS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'en', 'al', 'a'])
      const llenas = (c.adivinar ?? '').toLowerCase().split(/\s+/).filter((w) => !VACIAS.has(w))
      if (prueba === 'dibujar') {
        if (!['animal', 'personaje', 'objeto', 'escena'].includes(c.tipo)) fallo(`${donde}: el dibujo necesita tipo`)
        if (!Array.isArray(c.claves) || c.claves.length < 1 || c.claves.length > 2) fallo(`${donde}: necesita 1 o 2 palabras clave`)
        else for (const k of c.claves)
          if (!c.adivinar.toLowerCase().includes(k.toLowerCase())) fallo(`${donde}: la clave «${k}» no aparece en «${c.adivinar}»`)
      } else if (llenas.length > 3) fallo(`${donde}: «${c.adivinar}» es demasiado largo para adivinar (máx. 3 palabras con significado)`)
    }
    if (prueba === 'describir') {
      if (!Array.isArray(c.prohibidas)) fallo(`${donde}: faltan las palabras prohibidas`)
      else if (c.nivel === 'peques' && c.prohibidas.length) fallo(`${donde}: en peques no hay palabras prohibidas`)
      else if (c.nivel !== 'peques' && c.prohibidas.length < 3) fallo(`${donde}: necesita al menos 3 palabras prohibidas`)
      // La pista es para quien describe: no puede regalarle la palabra ni las prohibidas.
      if (!c.pista) fallo(`${donde}: falta la pista para quien describe`)
      else {
        const pista = ` ${normalizar(c.pista)} `
        for (const w of [c.palabra, ...(c.prohibidas ?? [])])
          if (pista.includes(` ${normalizar(w)} `)) fallo(`${donde}: la pista usa «${w}»`)
      }
    }
    const clave = `${c.tema}|${prueba}|${c.nivel}`
    tabla[clave] = (tabla[clave] ?? 0) + 1
  })
}

console.log('\nCartas por tema, prueba y nivel (peques / media / experta):\n')
for (const tema of TEMAS) {
  const fila = Object.keys(ARCHIVOS).map((p) => `${p}: ${NIVELES.map((n) => tabla[`${tema}|${p}|${n}`] ?? 0).join('/')}`)
  console.log(tema.padEnd(11), fila.join('   '))
  for (const p of Object.keys(ARCHIVOS))
    for (const n of NIVELES)
      if ((tabla[`${tema}|${p}|${n}`] ?? 0) < MINIMO) fallo(`${tema} / ${p} / ${n}: menos de ${MINIMO} cartas`)
}
const total = Object.values(tabla).reduce((a, b) => a + b, 0)
console.log(`\nTotal: ${total} cartas`)
if (errores) {
  console.error(`\n${errores} problema(s)`)
  process.exit(1)
}
