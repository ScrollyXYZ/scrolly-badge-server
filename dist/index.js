"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
require("dotenv/config.js");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const error_1 = require("./helpers/error");
const badge_1 = __importDefault(require("./api/badge"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = [
    "https://scroll.io",
    /^https:\/\/.+\.scroll\.io$/,
    "https://scrolly.xyz",
    /^https:\/\/.+\.scrolly\.xyz$/,
];
const options = {
    origin: allowedOrigins,
};
app.use((0, cors_1.default)(options));
app.get("/", (_req, res) => res.send("Scrolly badge API v1"));
app.get("/api/", (_req, res) => res.send("Scrolly badge API v1"));
app.use("/api/badge/", badge_1.default);
// catch 404 and forward to error handler
app.use((_req, _res, next) => {
    next((0, http_errors_1.default)(404));
});
// error handler
const errorHandler = (err, _req, res) => {
    (0, error_1.handleError)(err, res);
};
app.use(errorHandler);
const port = process.env.PORT || "3003";
app.set("port", port);
const server = http_1.default.createServer(app);
function onError(error) {
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
exports.default = app;
//# sourceMappingURL=index.js.map