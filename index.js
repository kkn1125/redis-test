import { createClient } from "redis";
import express from "express";
import cors from "cors";
import axios from "axios";

const DEFAULT_EXPIRATION = 3600;

const app = express();

const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const params = new URLSearchParams(req.query);
  try {
    const photos = await getOrSetCache(
      `photos${(params && "?" + params) || ""}`,
      async () => {
        const { data } = await axios.get(
          "https://jsonplaceholder.typicode.com/photos",
          {
            params: params,
          }
        );
        return data;
      }
    );
    res.json(photos);
  } catch (error) {
    console.error("error", error);
    res.json(error);
  } finally {
  }
  // const photos = await redisClient.get(`photos?${params}`);
  // console.log(params);
  // console.log(photos);

  // if (photos) {
  //   console.log("Cache Hit");
  // } else {
  //   console.log("Cache Missing");
  //   const { data } = await axios.get(
  //     "https://jsonplaceholder.typicode.com/photos",
  //     {
  //       params: params,
  //     }
  //   );
  //   console.log(params);
  //   await redisClient.setEx(
  //     `photos?${params}`,
  //     DEFAULT_EXPIRATION,
  //     JSON.stringify(data)
  //   );
  //   res.json(data);
  // }
});

app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${id}`
  );
  console.log(data);
  res.send("test");
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});

function getOrSetCache(key, cb) {
  return new Promise(async (resolve, reject) => {
    const data = await redisClient.get(key);
    if (data) {
      console.log("Cache Hit");
      resolve(JSON.parse(data));
    } else {
      console.log("Cache Missing");
      const freshData = await cb();
      redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));
      resolve(freshData);
    }
    reject(null);
  });
}
