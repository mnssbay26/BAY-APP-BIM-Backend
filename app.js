const express = require ("express")
const morgan = require ("morgan")
const  cors = require ("cors")
const cookieParser = require ("cookie-parser")
const dotenv = require ("dotenv")

dotenv.config()

const PORT = process.env.PORT || 3000

const allowedOrigin = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
]

const app = express()   
app.use(express.json({ limit: "250mb"}))
app.use(express.urlencoded({ limit: "250mb", extended: true }))

app.use(
    cors({
        origin: allowedOrigin,
        methods: ['GET','POST','PUT','DELETE'],
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
        exposedHeaders: ['Content-Type', 'Accept', 'Authorization'],
        credentials: true,
        optionsSuccessStatus : 204    
    })
)

app.options('*', cors())

app.use (morgan("dev"))

app.use(cookieParser())

app.use("/acc", require("./resources/acc/acc.router.js"))
app.use("/bim360", require ("./resources/bim360/bim360.router.js"))

app.get("/", (req, res) => {
  res.json({ message: "BAY Backend API alive 🚀" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;

