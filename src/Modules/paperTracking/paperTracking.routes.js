import express from "express";
import { protect } from "../../Middlewares/auth.middleware.js";
import { authorizeRoles } from "../../Middlewares/role.middleware.js";
import { getPaperTracking } from "./paperTracking.controller.js";

const router = express.Router();

router.get(
"/:id",
protect,
authorizeRoles("masterAdmin","editor"),
getPaperTracking
);

export default router;