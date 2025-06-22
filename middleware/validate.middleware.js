const { body, validationResult } = require('express-validator');

const validatePayload = [
  body().custom(value => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Request body cannot be empty');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = validatePayload;
