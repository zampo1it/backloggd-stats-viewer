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

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (_req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  
  next();
});

app.all("*", routers);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started Listening at ${PORT}`);
});

export default app;
