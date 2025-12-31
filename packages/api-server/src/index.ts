import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import { createServer } from "http";
import { Server } from "socket.io";
import { authRouter } from "./routes/auth";
import { webhookRouter } from "./routes/webhook";
import { projectRouter } from "./routes/project";
import { deploymentRouter } from "./routes/deployment";
import { aiRouter } from "./routes/ai";
import domainRouter from "./routes/domain";
import { errorHandler } from "./middleware/errorHandler";
import rateLimit from "express-rate-limit";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('api-server');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

// CORS configuration - restrict to specific origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3001",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      logger.debug('CORS request allowed', { origin });
      callback(null, true);
    } else {
      logger.warn('CORS request blocked', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
}));

app.use(express.json());
app.use(cookieParser());

// CSRF Protection - exclude webhooks and health check
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }
});

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { error: "Too many login/register attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const deployLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 deployments per hour
  message: { error: "Deployment rate limit exceeded, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general API rate limiting to all routes
app.use("/api", apiLimiter);

app.set("io", io);

// Health check - no CSRF protection needed
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// CSRF token endpoint - clients must fetch this before making state-changing requests
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Webhooks - no CSRF protection (external service)
app.use("/api/webhooks", webhookRouter);

// OAuth callback - no CSRF protection (called server-side by NextAuth)
import { oauthCallback } from "./controllers/auth.controller";
app.post("/api/auth/oauth/callback", authLimiter, oauthCallback);

// Protected routes - apply CSRF protection to state-changing operations
app.use("/api/auth", authLimiter, csrfProtection, authRouter);
app.use("/api/projects", csrfProtection, projectRouter);
app.use("/api/deployments", csrfProtection, deploymentRouter);
app.use("/api/ai", csrfProtection, aiRouter);
app.use("/api/projects/:projectId/domains", csrfProtection, domainRouter);

// New Deploy Endpoint - uses JWT auth (no CSRF needed for CLI)
import { deployProject } from "./controllers/deployment.controller";
import { authMiddleware } from "./middleware/auth";
import { uploadMiddleware } from "./middleware/upload";
app.post("/api/deploy", deployLimiter, authMiddleware, uploadMiddleware.single('file'), deployProject);

app.use(errorHandler);

io.on("connection", (socket) => {
  logger.info('WebSocket client connected', { socketId: socket.id });

  socket.on("subscribe-deployment", (deploymentId: string) => {
    socket.join(`deployment:${deploymentId}`);
    logger.debug('Client subscribed to deployment', { socketId: socket.id, deploymentId });
  });

  socket.on("unsubscribe-deployment", (deploymentId: string) => {
    socket.leave(`deployment:${deploymentId}`);
    logger.debug('Client unsubscribed from deployment', { socketId: socket.id, deploymentId });
  });

  // Handle deployment log events from build worker and broadcast to subscribers
  socket.on("deployment-log", (data: { deploymentId: string; log: string; timestamp: string }) => {
    logger.debug('Deployment log received', {
      deploymentId: data.deploymentId,
      logPreview: data.log.substring(0, 100)
    });
    // Broadcast to all clients subscribed to this deployment
    io.to(`deployment:${data.deploymentId}`).emit("deployment-log", data);
  });

  // Handle deployment status updates from build worker and broadcast to subscribers
  socket.on("deployment-update", (data: { deploymentId: string; status: string; logs?: string; timestamp: string }) => {
    logger.info('Deployment status update', { deploymentId: data.deploymentId, status: data.status });
    // Broadcast to all clients subscribed to this deployment
    io.to(`deployment:${data.deploymentId}`).emit("deployment-update", data);
  });

  socket.on("disconnect", () => {
    logger.info('WebSocket client disconnected', { socketId: socket.id });
  });
});

httpServer.listen(PORT, () => {
  logger.info('API Server started', {
    port: PORT,
    corsOrigins: allowedOrigins,
    features: {
      websocket: true,
      csrf: true,
      oauth: true,
      rateLimit: true
    }
  });
});

export { io };
