//app.js
import userRoutes from "./Modules/user/user.routes.js";
import manuscriptRoutes from "./Modules/manuscript/manuscript.routes.js";
import editorialRoutes from "./Modules/website/editorial/editorial.routes.js";
import reviewRoutes from "./Modules/review/review.routes.js";
import enquiryRoutes from "./Modules/enquiry/enquiry.routes.js";
import paperTrackingRoutes
  from "./Modules/paperTracking/paperTracking.routes.js";
  import issueRoutes from "./Modules/add-hoc-issue/issue.routes.js";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://mpa-admin-pannel.vercel.app",
      "http://localhost:3001",
      "https://mpa-frontend-dun.vercel.app",
      "https://mparesearch.com",
      "https://admin.mparesearch.com",
      "https://www.mparesearch.com",
    ], // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 3, // only 3 register requests allowed
  message: {
    success: false,
    message: "Too many registration attempts. Try again later.",
  },
});
app.use("/api/v1/users/register", registerLimiter);
//Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/manuscripts", manuscriptRoutes);
app.use("/api/v1/website/editorial", editorialRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/enquiry", enquiryRoutes);
app.use("/api/v1/paper-tracking", paperTrackingRoutes);
app.use("/api/v1/issues",issueRoutes);

// Default Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is Working Correctly",
  });
});

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR MIDDLEWARE:", err);

  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
});

export default app;
