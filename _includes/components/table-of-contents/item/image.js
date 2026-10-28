const fs = require('fs')
const path = require('path')
/**
 * Renders a TOC item image
 *
 * @param     {Object} eleventyConfig
 * @param     {Object} params
 * @property  {String} src - image src
 *
 * @return {String} TOC image markup
 */
module.exports = function(eleventyConfig) {
  const { imageDir } = eleventyConfig.globalData.config.figures
  return function(params) {
    const { src } = params
    if (!imageDir || !src) return ''
    // memooria 2026: se c'è, usa la versione leggera da scripts/print-images.js
    // (gli originali arrivano a 24MB e finivano interi in miniature, PDF ed EPUB)
    const printPath = path.join(imageDir, 'print', path.basename(src))
    const imgPath = fs.existsSync(path.join(eleventyConfig.dir.input, printPath))
      ? printPath
      : path.join(imageDir, src)
    return `
      <div class="card-image">
        <figure class="image">
          <img src="${ imgPath }" alt="" />
        </figure>
      </div>
    `
  }
}
