/**
 * @fileoverview Utility function to sanitize strings by replacing non-alphanumeric characters with underscores.
 * This is useful for creating safe identifiers or filenames.
 * @module utils/general/sanitize
 * */
function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}
module.exports = { sanitize };
