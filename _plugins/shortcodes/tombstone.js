const { html, oneLine } = require('~lib/common-tags')
const path = require('path')

/**
 * A shortcode for tombstone display of object data on an entry page
 */
module.exports = function(eleventyConfig, { page }) {
  const { config, objects } = eleventyConfig.globalData
  const { objectLinkText } = config.entryPage

  return function (pageObjects = [], pdfPath) {
    const titleCase = eleventyConfig.getFilter('titleCase')
    const icon = eleventyConfig.getFilter('icon')
    const markdownify = eleventyConfig.getFilter('markdownify')
    const properties = objects.object_display_order

    const tableRow = (object, property) => {
      if (!object || !property || !object[property]) return ''

      return html`
        <tr>
          <td>${titleCase(property)}</td>
          <td>${markdownify(object[property].toString())}</td>
        </tr>
      `
    }

    const objectLink = (object) => object.link
      ? oneLine`
        <a class="button" href="${object.link}" target="_blank" data-outputs-exclude="epub,pdf">
          ${objectLinkText} ${icon({ type: 'link', description: '' })}
        </a>`
      : ''

    // memooria 2026: PDF della singola scheda (generato da scripts/pdf-downloads.js)
    // es. /catalogue/5 -> /downloads/catalogue/Catalogo Digitale Collezione Zeri - 5.pdf
    const pdfName = (pagePath) => `Catalogo Digitale Collezione Zeri - ${path.basename(pagePath)}.pdf`
    const pdfLink = () => pdfPath
      ? oneLine`
        <a class="button" href="/downloads${path.dirname(pdfPath)}/${encodeURIComponent(pdfName(pdfPath))}" download="${pdfName(pdfPath)}" data-outputs-exclude="epub,pdf">
          Scarica PDF ${icon({ type: 'download', description: '' })}
        </a>`
      : ''

    const table = (object) => html`
      <section class="quire-entry__tombstone">
        <div class="container">
          <table class="table is-fullwidth">
            <tbody>
              ${properties.map((property) => tableRow(object, property)).join('')}
            </tbody>
          </table>
          <div class="quire-entry__tombstone-buttons">
            ${objectLink(object)}
            ${pdfLink()}
          </div>
        </div>
      </section>
    `
    return pageObjects.map((object) => table(object)).join('')
  }
}
