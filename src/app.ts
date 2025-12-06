import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes";
import errorHandler from "./middlewares/error.middleware";

dotenv.config();

const app: Application = express();

// Configurar CORS para permitir peticiones desde el frontend
app.use(
  cors({
    origin: ["http://localhost:4321", "http://localhost:3000", "http://194.164.72.117"],
    credentials: true,
  })
);

// Configurar helmet con políticas más permisivas para desarrollo
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir carga de recursos cross-origin
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"], // Permitir imágenes de cualquier origen
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = process.env.UPLOADS_PATH || "uploads";
app.use("/uploads", express.static(path.join(process.cwd(), uploadsPath)));

app.use("/api", routes);

app.use(errorHandler);

export default app;
