//Copyright 2023 Qewertyy, MIT License

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import routers from "./routes";
const app = express();
import axios from "axios";
import { load } from "cheerio";

app.get("/debug/backloggd", async (req: Request, res: Response) => {
  const u = String(req.query.u || "emersy");
  const page = Number(req.query.page || 1);
  const url = `https://www.backloggd.com/u/${u}/games?page=${page}`;
  try {
    const r = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
        "Upgrade-Insecure-Requests": "1",
      },
      validateStatus: () => true,
      maxRedirects: 5,
    });

    const html = typeof r.data === "string" ? r.data : "";
    const head = html.slice(0, 800);
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const $ = load(html);
    const gameNodes = $(".game-cover").length;

    res.json({
      fetch: { url, status: r.status, finalURL: r.request?.res?.responseUrl || null },
      parse: { gameNodes, title: titleMatch ? titleMatch[1] : null },
      sample: head,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

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
