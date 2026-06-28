import express from "express";
import {
  createAdHocIssue,
  getAdHocIssues,
  updateAdHocIssue,
  deleteAdHocIssue,
  getAvailableIssues,
} from "./issue.controller.js";

import { protect } from "../../Middlewares/auth.middleware.js";
import { authorizeRoles } from "../../Middlewares/role.middleware.js";

const router = express.Router();


// Create
router.post(
  "/admin/add-hoc",
  protect,
  authorizeRoles("masterAdmin"),
  createAdHocIssue
);


// Get all
router.get(
  "/admin/add-hoc",
  protect,
  authorizeRoles("masterAdmin"),
  getAdHocIssues
);


//available issue
router.get(
  "/admin/available",
  protect,
  authorizeRoles("masterAdmin"),
  getAvailableIssues
);


// Update
router.put(
  "/admin/add-hoc/:id",
  protect,
  authorizeRoles("masterAdmin"),
  updateAdHocIssue
);


// Delete
router.delete(
  "/admin/add-hoc/:id",
  protect,
  authorizeRoles("masterAdmin"),
  deleteAdHocIssue
);

export default router;