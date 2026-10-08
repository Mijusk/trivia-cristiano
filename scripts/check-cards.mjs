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

const tabla = {}
for (const [prueba, archivo] of Object.entries(ARCHIVOS)) {
  const cartas = JSON.parse(readFileSync(new URL(`../src/data/${archivo}.json`, import.meta.url), 'utf8'))
  const vistas = new Set()
  cartas.forEach((c, i) => {
    const donde = `${archivo}.json #${i}`
    if (!TEMAS.includes(c.tema)) fallo(`${donde}: tema "${c.tema}" no válido`)
    if (!NIVELES.includes(c.nivel)) fallo(`${donde}: nivel "${c.nivel}" no válido`)
    const texto = c.pregunta ?? c.palabra ?? c.texto
    if (!texto) fallo(`${donde}: falta el texto de la carta`)
    if (vistas.has(`${c.nivel}|${texto}`)) fallo(`${donde}: repetida en el mismo nivel: "${texto}"`)
    vistas.add(`${c.nivel}|${texto}`)
    if (prueba === 'pregunta') {
      if (!c.respuesta) fallo(`${donde}: falta la respuesta`)
      if (c.opciones && !c.opciones.includes(c.respuesta)) fallo(`${donde}: la respuesta no está entre las opciones`)
      if (c.nivel === 'peques' && !c.opciones) fallo(`${donde}: las preguntas de peques deben tener opciones`)
    }
    if (prueba === 'describir' && !Array.isArray(c.prohibidas)) fallo(`${donde}: faltan las palabras prohibidas`)
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
