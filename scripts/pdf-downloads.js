/**
 * memooria 2026
 * Genera i PDF scaricabili dal sito, dopo `quire build`:
 *   _site/downloads/output.pdf            catalogo completo
 *   _site/downloads/catalogue/<n>.pdf     singola scheda
 *
 * Usa Paged.js (pagedjs-cli) su _site/pdf.html, la stessa sorgente di
 * `quire pdf`; per le schede ritaglia da pdf.html la sola sezione della scheda.
 *
 * Un PDF già pubblicato in docs/downloads (build precedente) viene riusato se
 * l'HTML di partenza non è cambiato: evita di rifare i PDF a ogni build e di
 * aggiungere ogni volta file nuovi (e pesanti) alla storia del repository.
 *
 * Uso: node scripts/pdf-downloads.js
 * Variabili: PAGEDJS (comando pagedjs-cli), PDF_BROWSER_ARGS (es. --no-sandbox)
 */
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const site = path.join(__dirname, '..', '_site')
const downloads = path.join(site, 'downloads')
const published = path.join(__dirname, '..', 'docs', 'downloads')
const hashesFile = 'pdf-hashes.json'
const readJson = (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
const previousHashes = readJson(path.join(published, hashesFile))
const hashes = {}
const pagedjs = process.env.PAGEDJS || 'pagedjs-cli'
const browserArgs = process.env.PDF_BROWSER_ARGS

const render = (input, output) => {
  const args = [input, '-o', output, '--timeout', '600000']
  if (browserArgs) args.push('--browserArgs', browserArgs)
  execFileSync(pagedjs, args, { stdio: 'inherit' })
}

// name: percorso relativo a downloads/, html: sorgente usata per il confronto
const print = (input, name, html) => {
  const hash = crypto.createHash('sha256').update(html).update(styles).digest('hex')
  const previous = path.join(published, name)
  const output = path.join(downloads, name)
  hashes[name] = hash
  if (previousHashes[name] === hash && fs.existsSync(previous)) {
    fs.copyFileSync(previous, output)
    console.info(`[pdf-downloads] ${name} invariato, riuso il PDF pubblicato`)
    return
  }
  console.info(`[pdf-downloads] genero ${name}`)
  render(input, output)
}

const source = fs.readFileSync(path.join(site, 'pdf.html'), 'utf8')
// anche gli stili di stampa entrano nel confronto
const styles = fs.readFileSync(path.join(site, 'pdf.css'), 'utf8')

// le pagine sono <section class="quire-page ..." id="page-..."> figlie di <body>
const pageStart = /<section class="quire-page[^"]*"[^>]*id="page-([^"]+)"/g
const pages = [...source.matchAll(pageStart)].map((match) => ({
  id: match[1],
  start: match.index
}))
const bodyEnd = source.lastIndexOf('</body>')
const preamble = source.slice(0, pages[0].start)

fs.mkdirSync(path.join(downloads, 'catalogue'), { recursive: true })

print(path.join(site, 'pdf.html'), 'output.pdf', source)

pages.forEach((page, index) => {
  const entry = page.id.match(/^catalogue-(\d+)$/)
  if (!entry) return
  const end = index + 1 < pages.length ? pages[index + 1].start : bodyEnd
  const input = path.join(site, `pdf-entry-${entry[1]}.html`)
  const html = `${preamble}${source.slice(page.start, end)}</body></html>`
  fs.writeFileSync(input, html)
  try {
    print(input, `catalogue/${entry[1]}.pdf`, html)
  } finally {
    fs.rmSync(input)
  }
})

fs.writeFileSync(path.join(downloads, hashesFile), JSON.stringify(hashes, null, 2))
