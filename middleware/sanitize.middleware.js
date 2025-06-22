const { sanitize } = require('../utils/general/sanitaze.db');

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return sanitize(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v));
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => {
      value[k] = sanitizeValue(value[k]);
    });
  }
  return value;
}

function sanitizeRequest(req, res, next) {
  ['body', 'params', 'query'].forEach((key) => {
    if (req[key]) {
      sanitizeValue(req[key]);
    }
  });
  next();
}

module.exports = sanitizeRequest;
