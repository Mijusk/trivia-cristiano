/**
 * Trivia Cristiano · recibe los avisos de cartas con errores.
 *
 * Va pegado en la hoja de cálculo «errores-app» (Extensiones → Apps Script) y se publica como
 * aplicación web. Por cada aviso añade una fila en la pestaña «Avisos» y manda un correo.
 * Los pasos para instalarlo están en el README, en «Avisos de cartas con errores».
 */

const CORREO = 'luis8tk@gmail.com'
const PESTANA = 'Avisos'
const COLUMNAS = ['Recibido', 'Carta', 'Tema', 'Prueba', 'Nivel', 'Texto', 'Referencia', 'Motivo', 'Comentario', 'Avisado en el móvil', 'Revisado']
const CAMPOS = ['cartaId', 'tema', 'prueba', 'nivel', 'texto', 'referencia', 'motivo', 'comentario', 'fecha']
const MAX_CAMPO = 600

function doPost(e) {
  let datos
  try {
    datos = JSON.parse(e.postData.contents)
  } catch (err) {
    return respuesta({ ok: false, error: 'no es JSON' })
  }
  // Solo avisos con la forma del juego: el id de una carta y su motivo.
  if (!datos || typeof datos.cartaId !== 'string' || !/^(pregunta|dibujar|describir|mimica)-\d+$/.test(datos.cartaId) || !datos.motivo) {
    return respuesta({ ok: false, error: 'aviso no válido' })
  }
  const valores = CAMPOS.map((c) => limpiar(datos[c]))

  const cerrojo = LockService.getScriptLock()
  cerrojo.waitLock(10000)
  try {
    hoja().appendRow([new Date(), ...valores, ''])
  } finally {
    cerrojo.releaseLock()
  }

  const [cartaId, tema, prueba, nivel, texto, referencia, motivo, comentario] = valores
  MailApp.sendEmail({
    to: CORREO,
    subject: `Trivia Cristiano · aviso en ${cartaId}`,
    body: [
      `Carta: ${cartaId} (${tema} · ${prueba} · ${nivel})`,
      `Texto: ${texto}`,
      referencia ? `Referencia: ${referencia}` : '',
      '',
      `Motivo: ${motivo}`,
      comentario ? `Comentario: ${comentario}` : 'Sin comentario.',
      '',
      `Hoja de avisos: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    ]
      .filter((l, i, todas) => l !== '' || todas[i - 1] !== '')
      .join('\n'),
  })
  return respuesta({ ok: true })
}

/** La pestaña de avisos, creada con sus columnas la primera vez. */
function hoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet()
  let h = libro.getSheetByName(PESTANA)
  if (!h) {
    h = libro.insertSheet(PESTANA)
    h.appendRow(COLUMNAS)
    h.setFrozenRows(1)
    h.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold')
  }
  return h
}

/** Texto corto y sin fórmulas: lo que empieza por = + - @ se guarda como texto. */
function limpiar(v) {
  const s = String(v == null ? '' : v).slice(0, MAX_CAMPO)
  return /^[=+\-@]/.test(s) ? `'${s}` : s
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

/** Para probarlo desde el editor (botón Ejecutar): añade una fila y manda un correo de prueba. */
function probar() {
  doPost({
    postData: {
      contents: JSON.stringify({
        cartaId: 'pregunta-1',
        tema: 'Pentateuco',
        prueba: 'Pregunta',
        nivel: 'Peques',
        texto: 'Prueba del script',
        referencia: '',
        motivo: 'Otro motivo',
        comentario: 'Esto es una prueba',
        fecha: new Date().toISOString(),
      }),
    },
  })
}
