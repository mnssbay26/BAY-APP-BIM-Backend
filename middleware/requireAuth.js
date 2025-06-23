module.exports = function requireAuth(req, res, next) {

  const token = req.cookies && req.cookies["access_token"];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token." });
  }
   next();
};