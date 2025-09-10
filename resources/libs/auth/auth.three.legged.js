const axios = require ("axios")

const { GetAPSThreeLeggedToken } = require ("../../../utils/auth/auth.utils")


async function getThreeLeggedAuth (code) {
    if (!code) throw new Error('Authorization code is required');

  try {
      const token = await GetAPSThreeLeggedToken(code);

      // Opciones base
      const cookieOptions = {
        httpOnly: true,
        maxAge: 360_000_000, // ~100 horas
        path: "/",
      };

      if (process.env.NODE_ENV === "production") {
        // Prod: HTTPS obligatorio + cookie para todo el dominio
        cookieOptions.secure = true;
        cookieOptions.sameSite = "None";
        cookieOptions.domain = ".156041440121.cloud.bayer.com";
      } else {
        // Dev: HTTP + cookie enviada en XHR same-site
        cookieOptions.secure = false;
        cookieOptions.sameSite = "Lax";
        // NO pongas domain aquí en dev
      }

      return { token, cookieOptions };
    } catch (err) {
      console.error("Error fetching three-legged token:", err);
      return res.redirect(`${FRONTEND_URL}/platform`);
    }
};

module.exports = { getThreeLeggedAuth };
