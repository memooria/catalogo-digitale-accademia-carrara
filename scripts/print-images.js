/**
 * memooria 2026
 * Prepara le immagini per PDF ed EPUB in content/_assets/images/print/
 *
 * Le figure delle schede sono canvas IIIF esterni (jarvis) e molte non hanno
 * il file locale in content/_assets/images/figures: per la stampa si scarica
 * dal server IIIF una versione a 1600px (abbastanza per il PDF e leggera).
 * Se il download fallisce si usa il file locale ridimensionato.
 *
 * Uso: node scripts/print-images.js   (da lanciare prima di `quire build`)
 */
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const sharp = require('sharp')

const root = path.join(__dirname, '..')
const imagesDir = path.join(root, 'content/_assets/images')
const outputDir = path.join(imagesDir, 'print')
const size = '!1600,1600'

const { figure_list: figures } = yaml.load(
  fs.readFileSync(path.join(root, 'content/_data/figures.yaml'), 'utf8')
)

const manifests = {}

const toPrint = (input, output) => sharp(input)
  .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 72, mozjpeg: true })
  .toFile(output)

const fetchManifest = (url) => {
  manifests[url] = manifests[url] || fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${response.status} ${url}`)
    return response.json()
  })
  return manifests[url]
}

// IIIF Presentation v2 e v3
const imageServiceId = (manifest, canvasId) => {
  const canvases = manifest.items || manifest.sequences?.[0]?.canvases || []
  const canvas = canvases.find((item) => (item.id || item['@id']) === canvasId)
  if (!canvas) return
  if (canvas.items) {
    const body = canvas.items[0]?.items?.[0]?.body
    const service = [].concat(body?.service || [])[0]
    return service?.id || service?.['@id']
  }
  const service = canvas.images?.[0]?.resource?.service
  return service?.['@id'] || service?.id
}

const fetchRetry = async (url, attempts = 3) => {
  let response
  for (let attempt = 1; attempt <= attempts; attempt++) {
    response = await fetch(url).catch(() => ({ ok: false, status: 'rete' }))
    if (response.ok || (response.status < 500 && response.status !== 'rete')) return response
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
  }
  return response
}

// formati da provare in ordine: il server rifiuta upscaling e richieste troppo grandi
const imageUrls = async (serviceId) => {
  const response = await fetchRetry(`${serviceId}/info.json`)
  if (!response.ok) throw new Error(`${response.status} ${serviceId}/info.json`)
  const info = await response.json()
  const sizes = (info.sizes || [])
    .sort((a, b) => b.width - a.width)
    .map((item) => `${item.width},${item.height}`)
  const large = Math.max(info.width, info.height) > 1600
  return [...(large ? [size] : []), 'max', ...sizes]
    .map((region) => `${serviceId}/full/${region}/0/default.jpg`)
}

const download = async (figure, output) => {
  const manifest = await fetchManifest(figure.manifestId)
  const serviceId = imageServiceId(manifest, figure.canvasId)
  if (!serviceId) throw new Error(`canvas non trovato ${figure.canvasId}`)
  let response
  for (const url of await imageUrls(serviceId)) {
    response = await fetchRetry(url)
    if (response.ok) return toPrint(Buffer.from(await response.arrayBuffer()), output)
  }
  throw new Error(`${response?.status} ${serviceId}`)
}

const resizeLocal = async (figure, output) => {
  const input = path.join(imagesDir, figure.src)
  if (!fs.existsSync(input)) throw new Error(`file locale mancante ${figure.src}`)
  await toPrint(input, output)
}

const prepare = async (figure) => {
  const output = path.join(outputDir, path.basename(figure.src))
  if (fs.existsSync(output)) return 'presente'
  try {
    await download(figure, output)
    return 'IIIF'
  } catch (downloadError) {
    try {
      await resizeLocal(figure, output)
      return 'locale'
    } catch (localError) {
      return `ERRORE ${downloadError.message} / ${localError.message}`
    }
  }
}

const run = async () => {
  fs.mkdirSync(outputDir, { recursive: true })
  const queue = figures.filter((figure) => figure.src && figure.canvasId)
  const results = {}
  const worker = async () => {
    for (let figure = queue.shift(); figure; figure = queue.shift()) {
      const result = await prepare(figure)
      results[result] = (results[result] || 0) + 1
      if (result.startsWith('ERRORE')) console.warn(`[print-images] ${figure.id}: ${result}`)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  console.info('[print-images]', results)
}

run()
