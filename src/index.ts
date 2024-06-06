import createError from "http-errors";
import express from "express";
import "dotenv/config.js";
import http from "http";
import cors from "cors";

import { handleError } from "./helpers/error";
import badgeRouter from "./api/badge";

const app: express.Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = [
  "https://scroll.io",
  /^https:\/\/.+\.scroll\.io$/,
  "https://scrolly.xyz",
  /^https:\/\/.+\.scrolly\.xyz$/,
];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};
app.use(cors(options));

app.get("/", (_req, res) => res.send("Scrolly badge API v1"));
app.get("/api/", (_req, res) => res.send("Scrolly badge API v1"));
app.use("/api/badge/", badgeRouter);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(createError(404));
});

// error handler
const errorHandler: express.ErrorRequestHandler = (err, _req, res) => {
  handleError(err, res);
};
app.use(errorHandler);

const port = process.env.PORT || "3003";
app.set("port", port);

const server = http.createServer(app);

function onError(error: { syscall: string; code: string }) {
  if (error.syscall !== "listen") {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      process.exit(1);
      break;
    case "EADDRINUSE":
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  console.info(`Server is listening on ${bind}`);
}

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

export default app;
