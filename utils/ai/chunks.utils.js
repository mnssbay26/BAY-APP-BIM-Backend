function limitChars(strOrObj, max=20000) {
  let s = typeof strOrObj === "string" ? strOrObj : JSON.stringify(strOrObj ?? "", null, 2);
  return s.length > max ? s.slice(0, max) : s;
}

// divide en bloques de ~N chars seguros (no tokens) para contextos enormes
function chunkByChars(arrOrStr, maxPerChunk=20000) {
  const s = typeof arrOrStr === "string" ? arrOrStr : JSON.stringify(arrOrStr ?? "", null, 2);
  const chunks = [];
  for (let i=0; i<s.length; i+=maxPerChunk) chunks.push(s.slice(i, i+maxPerChunk));
  return chunks;
}

module.exports = { limitChars, chunkByChars };