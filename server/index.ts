import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import "./deployment-check";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration for deployed environments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, allow requests from Replit domains
  if (isProduction && origin && origin.includes('.replit.app')) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Session configuration with PostgreSQL store for production
const PostgreSQLStore = pgSession(session);

// Determine if we're in a secure context (HTTPS)
const isProduction = process.env.NODE_ENV === 'production';
const isReplitDeployment = !!process.env.REPLIT_DEPLOYMENT;

// Generate a consistent session secret for production
const sessionSecret = process.env.SESSION_SECRET || 
  (isProduction ? require('crypto').randomBytes(32).toString('hex') : 'development-secret-key');

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: false, // Don't reset expiry to avoid session conflicts
  cookie: {
    // Only use secure cookies if explicitly in HTTPS context
    secure: false, // Disable secure to work in both HTTP and HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Allow cookies across same-site requests
    // Don't set domain - let browser handle it
    path: '/'
  },
  name: 'connect.sid', // Use default name to avoid conflicts with existing sessions
  // Use PostgreSQL session store in production
  store: isProduction ? new PostgreSQLStore({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  }) : undefined,
  // Trust proxy in production for proper cookie handling
  proxy: isProduction
};

// Trust proxy in production environments
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(session(sessionConfig));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
