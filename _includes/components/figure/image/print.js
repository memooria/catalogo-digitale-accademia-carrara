const { html } = require('~lib/common-tags')
const fs = require('fs')
const path = require('path')

/**
 * Renders an image with a caption in print output
 *
 * @param      {Object}  eleventyConfig  eleventy configuration
 * @param      {Object}  figure          Figure data
 *
 * @return     {String}  HTML containing an <img> element and a caption
 */
module.exports = function(eleventyConfig) {
  const figureCaption = eleventyConfig.getFilter('figureCaption')
  const figureLabel = eleventyConfig.getFilter('figureLabel')

  const { imageDir } = eleventyConfig.globalData.config.figures

  const printImageExists = (src) => fs.existsSync(
    path.join(eleventyConfig.dir.input, imageDir, 'print', path.basename(src))
  )

  return function(figure) {
    const { alt, caption, credit, id, label, src, staticInlineFigureImage } = figure

    if (!src && !staticInlineFigureImage) return ''

    const labelElement = figureLabel({ caption, id, label })

    let imageSrc

    switch (true) {
      case figure.isSequence:
        imageSrc = figure.staticInlineFigureImage
        break
      case figure.isCanvas || figure.isImageService:
        // memooria 2026: figure IIIF esterne senza printImage -> immagine di stampa
        // preparata da scripts/print-images.js in _assets/images/print/
        // (se manca resta vuota, altrimenti la generazione dell'EPUB si blocca)
        imageSrc = figure.printImage || (printImageExists(src)
          ? path.join(imageDir, 'print', path.basename(src))
          : '')
        break
      default:
        imageSrc = src.startsWith('http')
          ? src
          : path.join(imageDir, src)
        break
    }

    return html`
      <img alt="${alt}" class="q-figure__image" src="${imageSrc}"/>
      ${figureCaption({ caption, content: labelElement, credit })}
    `
  }
}
