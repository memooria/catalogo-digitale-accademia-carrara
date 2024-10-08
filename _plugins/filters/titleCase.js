/**
 * Convert a string to Title Case formatting
 *
 * @param      {String}  A camel case or snake case input string
 * @return     {String}  The input string converted to title case
 */
module.exports = function(string) {
  /*
    return string
    .split(/(?=[A-Z])|[_\s]/)
    .map((word) => word.replace(word[0], word[0].toUpperCase()))
    .join(' ')
   */

  // Fix per evitare che ogni iniziale di parola sia maiuscola.
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}
