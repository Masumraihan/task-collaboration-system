import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import config from "./app/config";
import logger from "./app/lib/logger";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFoundErrorHandler from "./app/middlewares/notFoundErrorHandler";
import router from "./app/routes";

const app = express();

export const allowedOrigins = ["http://10.10.10.3:3000", "http://localhost:3000"];

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  }),
);

// ── SECURITY ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ── COMPRESSION ───────────────────────────────────────────────────────────────
app.use(compression());

// ── BODY PARSERS (only once, with rawBody capture for webhook hash) ───────────
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res, buf) => {
      if (buf && buf.length) {
        req.rawBody = buf; // ✅ saved for isValidHash in webhook
      }
    },
  }),
);
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ── LOGGING ───────────────────────────────────────────────────────────────────
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(config.rateLimitWindow || "15") * 60 * 1000,
  max: parseInt(config.rateLimitMaxRequests || "100"),
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
    });
  },
});

app.use("/api", limiter);
app.set("trust proxy", 1);

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "Hello from server" });
});

app.use("/api/v1", router);

// ── ERROR HANDLERS ────────────────────────────────────────────────────────────
app.use(globalErrorHandler);
app.use(notFoundErrorHandler);

export default app;
