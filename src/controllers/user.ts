//Copyright 2023 Qewertyy, MIT License

import { Router, Request, Response } from "express";
import { getUserInfo, getUserGames } from "../lib/user";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600 });
const Route = Router();

async function userInfo(req: Request, res: Response) {
  let refresh = false;
  const { username } = req.params;
  if ("refresh" in req.query) refresh = Boolean(req.query.refresh);
  if (!username) {
    return res.status(400).json({
      message: "Username is required",
      username: null,
      code: 0,
      details: "/:username",
    });
  }
  if (refresh) {
    cache.del(username);
  }
  const cachedResponse = cache.get(username);
  if (cachedResponse) {
    return res.status(200).json({
      message: "success",
      username: username,
      code: 2,
      content: cachedResponse,
    });
  }
  const response = await getUserInfo(username);
  if (response.error) {
    return res
      .status(response.status || 500)
      .json({ message: response.error, username: username, code: 0 });
  }
  cache.set(username, response);
  res.set("Cache-Control", "public, max-age=3600");
  return res.status(200).json({
    message: "success",
    username: username,
    code: 2,
    content: response,
  });
}

async function userGames(req: Request, res: Response) {
  const { username } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const getAllPages = req.query.all === 'true' || req.query.getAllPages === 'true';
  let refresh = false;
  if ("refresh" in req.query) refresh = Boolean(req.query.refresh);
  
  if (!username) {
    return res.status(400).json({
      message: "Username is required",
      username: null,
      code: 0,
      details: "/:username/games",
    });
  }

  const cacheKey = `games-${username}-${page}-${getAllPages}`;
  
  if (refresh) {
    console.log(`Refresh requested - deleting cache for key: ${cacheKey}`);
    cache.del(cacheKey);
  }
  
  const cachedResponse = cache.get(cacheKey);
  
  if (cachedResponse) {
    console.log(`Returning cached response for ${username}`);
    return res.status(200).json({
      message: "success",
      username: username,
      code: 2,
      content: cachedResponse,
    });
  }

  console.log(`No cache found - fetching fresh data for ${username}`);
  const response = await getUserGames(username, page, getAllPages);
  
  if ("error" in response) {
    console.log(`Error getting games for ${username}:`, response.error);
    return res
      .status(response.status || 500)
      .json({ message: response.error, username: username, code: 0 });
  }
  
  console.log(`Found ${response.games.length} games for ${username} (page ${page})`);

  cache.set(cacheKey, response);
  res.set("Cache-Control", "public, max-age=3600");
  
  return res.status(200).json({
    message: "success",
    username: username,
    code: 2,
    content: response,
  });
}

Route.get("/:username", async (req: Request, res: Response) => {
  return await userInfo(req, res);
}).post("/:username", async (req: Request, res: Response) => {
  return await userInfo(req, res);
});

Route.get("/:username/games", async (req: Request, res: Response) => {
  return await userGames(req, res);
}).post("/:username/games", async (req: Request, res: Response) => {
  return await userGames(req, res);
});

export default Route;
