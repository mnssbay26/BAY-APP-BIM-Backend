const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const csrf = require("csurf");

const {dbConnection} = require ('./services/dynamo/dynamo.service.js');

dotenv.config();

const PORT = process.env.PORT || 3000;

//Initialize Express app
const app = express();

app.set("trust proxy", 1);

// Apply HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://developer.api.autodesk.com",
          "https://cdnjs.cloudflare.com",
          "https://auth.autodesk.com",
          "https://bayer-bim-ui.dev.156041440121.cloud.bayer.com",
          "https://cdn.derivative.autodesk.com",
          "https://backaps.156041440121.cloud.bayer.com",

        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://images.autodesk.com",
          "https://cdn.derivative.autodesk.com",
        ],
        connectSrc: [
          "'self'",
          "https://developer.api.autodesk.com",
          "https://api.autodesk.com",
          "https://cdn.derivative.autodesk.com",
          "https://auth.autodesk.com",
          "https://bayer-bim-ui.dev.156041440121.cloud.bayer.com",
          "https://cdn.derivative.autodesk.com",
          "https://backaps.156041440121.cloud.bayer.com",
        ],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many authentication requests, slow down.",
  },
});
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Too many write operations, please wait." },
});
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Too many requests, please wait." },
});

const allowedOrigin = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://auth.autodesk.com",
  "https://developer.api.autodesk.com",
  "https://cdn.derivative.autodesk.com",
  "https://images.autodesk.com",
  "https://backaps.156041440121.cloud.bayer.com",
  "https://bayer-bim-ui.dev.156041440121.cloud.bayer.com",
];
// Body parsers
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: "250mb", extended: true }));

// CORS configuration
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "x-xsrf-token",     // <-- importante
      "csrf-token"        // opcional
    ],
    exposedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization"
      // no hace falta exponer x-xsrf-token
    ],
    optionsSuccessStatus: 204,
  })
);

app.options("*", cors());

// Development logging
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// Cookie parser
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    key: "_csrf",            // <<< NO usar XSRF-TOKEN aquí
    httpOnly: true,          // secreto sólo para el server
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

app.get("/csrf-token", csrfProtection, (req, res) => {
  const token = req.csrfToken();
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false,         // el front lo puede leer
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ csrfToken: token });
});

// Routes (consider adding specific rateLimiters per route as needed)
app.use("/auth", authLimiter, require("./resources/routers/auth.router.js"));
app.use("/general", require("./resources/routers/general.router.js"));
app.use("/acc", require("./resources/routers/acc.router.js"));
app.use("/bim360", require("./resources/routers/bim360.router.js"));
app.use("/datamanagement", require("./resources/routers/data.management.router.js"));
app.use("/modeldata", csrfProtection, require("./resources/routers/model.data.router.js"));
app.use("/ai", require("./ia/ia.router.js"));

// Health check endpoint
app.get("/", readLimiter, (req, res) => {
  res.json({ message: "BAY Backend API alive 🚀" });
});

dbConnection()

// Start server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
