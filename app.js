const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const csrf = require("csurf");
const sanitizeRequest = require("./middleware/sanitize.middleware");
const validatePayload = require("./middleware/validate.middleware");

const { dbConnection } = require("./services/dynamo/dynamo.service.js");

const requireAuth = require("./middleware/requireAuth.js");

const PORT = process.env.PORT;

//Initialize Express app
const app = express();

// Security: remove X-Powered-By header
app.disable("x-powered-by");

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
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too many authentication requests, slow down.",
    },
});
const writeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, error: "Too many write operations, please wait." },
});
const readLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, error: "Too many requests, please wait." },
});

const allowedOrigin = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
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
app.use(sanitizeRequest);
// app.post("*", validatePayload);
app.patch("*", validatePayload);
app.put("*", validatePayload);

// CORS configuration
app.use(
    cors({
        origin: allowedOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Accept",
            "Authorization",
            "CSRF-Token",
        ],
        exposedHeaders: [
            "Content-Type",
            "Accept",
            "Authorization",
            "CSRF-Token",
        ],
        credentials: true,
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

// CSRF protection
const csrfProtection = csrf({ cookie: true });

// Apply CSRF only to write routes for better security and compatibility
app.use(["/modeldata", "/datamanagement"], csrfProtection);

// Endpoint to expose CSRF token if needed by frontend
app.get("/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Health check endpoint
app.get("/", readLimiter, (req, res) => {
    res.json({ message: "BAY Backend API alive 🚀" });
});

// Routes (consider adding specific rateLimiters per route as needed)
app.use("/auth", authLimiter, require("./resources/auth/auth.router.js"));

app.use(
    "/general",
    requireAuth,
    require("./resources/general/general.router.js")
);
app.use("/acc", requireAuth, require("./resources/acc/acc.router.js"));
app.use("/bim360", requireAuth, require("./resources/bim360/bim360.router.js"));
app.use(
    "/datamanagement",
    requireAuth,
    require("./resources/data_management/data.management.router.js")
);
app.use(
    "/modeldata",
    requireAuth,
    require("./resources/model_data/model.data.router.js")
);
app.use("/ai", requireAuth, require("./ia/ia.router.js"));

// Global error handler (must be after all routes)
app.use((err, req, res, next) => {
    console.error(err); // Internal log
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
    });
});

dbConnection();

// Start server when run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
