// Comprueba el banco de tarjetas: ids únicos, campos obligatorios, que la respuesta esté
// entre las opciones, que las citas existan en la Biblia CEE y cuántas cartas hay en cada
// tema × prueba × nivel. Además avisa (sin fallar) de cartas que se repiten o se parecen.
// Con --estricto, los avisos de repetidas también cuentan como errores.
import { readFileSync } from 'node:fs'
import { comprobarReferencia } from './referencias.mjs'

const ESTRICTO = process.argv.includes('--estricto')

const TEMAS = ['pentateuco', 'historicos', 'profetas', 'nt', 'vida']
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
const todas = []
const ids = new Set()
const siguienteId = {}
for (const [prueba, archivo] of Object.entries(ARCHIVOS)) {
  const cartas = JSON.parse(readFileSync(new URL(`../src/data/${archivo}.json`, import.meta.url), 'utf8'))
  const vistas = new Set()
  let mayor = -1
  cartas.forEach((c, i) => {
    const donde = `${archivo}.json #${i}`
    // El id no se cambia nunca: lo usan las partidas guardadas y el historial de cartas usadas.
    const numero = typeof c.id === 'string' && c.id.match(new RegExp(`^${prueba}-(\\d+)$`))
    if (!numero) fallo(`${donde}: el id debe ser «${prueba}-<número>» (ahora: ${JSON.stringify(c.id)})`)
    else mayor = Math.max(mayor, Number(numero[1]))
    if (ids.has(c.id)) fallo(`${donde}: id repetido «${c.id}»`)
    ids.add(c.id)
    if (!TEMAS.includes(c.tema)) fallo(`${donde}: tema "${c.tema}" no válido`)
    if (!NIVELES.includes(c.nivel)) fallo(`${donde}: nivel "${c.nivel}" no válido`)
    // Cartas del Camino Neocatecumenal: solo en Vida Cristiana y solo salen si la partida lo incluye.
    if ('camino' in c) {
      if (typeof c.camino !== 'boolean') fallo(`${donde}: «camino» tiene que ser true o false`)
      else if (c.tema !== 'vida') fallo(`${donde}: «camino» solo vale en el tema vida (ahora: ${c.tema})`)
    }
    const texto = c.pregunta ?? c.palabra ?? c.adivinar
    if (!texto) fallo(`${donde}: falta el texto de la carta`)
    if (/Jehová/i.test(JSON.stringify(c))) fallo(`${donde}: usa «Jehová»; en la versión católica es «el Señor»`)
    if (c.referencia && /\d:\d/.test(c.referencia)) fallo(`${donde}: la referencia usa «:»; en formato católico es «,» (Gén 6,14)`)
    else if (c.referencia) {
      const problema = comprobarReferencia(c.referencia)
      if (problema) fallo(`${donde}: la referencia «${c.referencia}» no vale: ${problema}`)
    }
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
    // Las del Camino se cuentan aparte: con la opción apagada, Vida Cristiana se juega sin ellas.
    const clave = `${c.camino === true ? 'camino' : c.tema}|${prueba}|${c.nivel}`
    tabla[clave] = (tabla[clave] ?? 0) + 1
    todas.push({ ...c, prueba })
  })
  siguienteId[prueba] = `${prueba}-${mayor + 1}`
}

console.log('\nCartas por tema, prueba y nivel (peques / media / experta):\n')
for (const tema of [...TEMAS, 'camino']) {
  const fila = Object.keys(ARCHIVOS).map((p) => `${p}: ${NIVELES.map((n) => tabla[`${tema}|${p}|${n}`] ?? 0).join('/')}`)
  console.log(tema.padEnd(11), fila.join('   '))
  if (tema === 'camino') continue
  for (const p of Object.keys(ARCHIVOS))
    for (const n of NIVELES)
      if ((tabla[`${tema}|${p}|${n}`] ?? 0) < MINIMO) fallo(`${tema} / ${p} / ${n}: menos de ${MINIMO} cartas`)
}
/*
 * Repetidas o parecidas dentro de la misma prueba, en cualquier tema y nivel: la misma palabra
 * para describir, o lo mismo para dibujar o hacer en mímica («La Última Cena» y «Última Cena»).
 * La misma idea en pruebas distintas (dibujar la vela y hacerla en mímica) no se avisa, ni las
 * respuestas que se repiten entre preguntas («Tres», «Elías»…): ahí suele ser normal.
 */
const VACIAS_INICIO = /^(el|la|los|las|un|una|del|al)\s+/
const grupos = new Map()
for (const c of todas) {
  if (c.prueba === 'pregunta') continue
  const k = `${c.prueba}|${normalizar(c.palabra ?? c.adivinar).replace(VACIAS_INICIO, '')}`
  grupos.set(k, [...(grupos.get(k) ?? []), c])
}
const repetidas = [...grupos.values()].filter((g) => g.length > 1)
if (repetidas.length) {
  console.log(`\n${repetidas.length} aviso(s) de cartas que se repiten o se parecen (revisa si es la misma idea):`)
  for (const g of repetidas) {
    console.log(`  ⚠ ${g[0].prueba} «${g[0].palabra ?? g[0].adivinar}»: ${g.map((c) => `${c.id} (${c.tema}/${c.nivel})`).join(', ')}`)
    if (ESTRICTO) errores++
  }
}

const total = Object.values(tabla).reduce((a, b) => a + b, 0)
console.log(`\nTotal: ${total} cartas`)
console.log(`Siguientes ids libres: ${Object.values(siguienteId).join(', ')}`)
if (errores) {
  console.error(`\n${errores} problema(s)`)
  process.exit(1)
}
