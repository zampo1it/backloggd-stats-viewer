//Copyright 2023 Qewertyy, MIT License

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import routers from "./routes";
const app = express();

app.set("trust proxy", 1);
app.set("json spaces", 2);
app.disable("x-powered-by");
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 2500000,
  })
);

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Test endpoints - must be before app.all("*", routers)
app.get("/test", (req: Request, res: Response) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

app.get("/cors-test", (req: Request, res: Response) => {
  res.json({ 
    message: "CORS test successful!", 
    origin: req.headers.origin,
    timestamp: new Date().toISOString() 
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.all("*", routers);

// 404 handler - must be after all routes
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ message: "not found", code: 0 });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started Listening at ${PORT}`);
});

export default app;
