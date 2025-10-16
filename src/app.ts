//Copyright 2023 Qewertyy, MIT License

import express, { Request, Response, NextFunction } from "express";
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

// CORS middleware - must be before other routes
app.use((_req: Request, res: Response, next: NextFunction) => {
  const origin = _req.headers.origin;
  
  console.log(`CORS: ${_req.method} ${_req.url} from origin: ${origin}`);
  
  // Allow all origins for now
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  
  // Handle preflight requests
  if (_req.method === "OPTIONS") {
    console.log("CORS: Handling preflight request");
    res.status(200).end();
    return;
  }
  
  next();
});

// Test endpoint
app.get("/test", (req: Request, res: Response) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

app.all("*", routers);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started Listening at ${PORT}`);
});

export default app;
