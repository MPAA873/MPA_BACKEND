import express from "express";

import {
  changeUserPasswordByAdmin,
  createUser,
  deleteUser,
  forgotPassword,
  getAllEditors,
  getAllReviewers,
  getAllUsers,
  getMe,
  loginUser,
  registerUser,
  resetPassword,
  toggleBlockUser,
  updateProfile,
  updateUserRole,
  verifyEmail,
} from "./user.controller.js";
import { protect } from "../../Middlewares/auth.middleware.js";
import { authorizeRoles } from "../../Middlewares/role.middleware.js";
import passport from "passport";
import User from "./user.model.js";

// adjust path if needed
import generateToken from "../../utils/generateToken.js";


const router = express.Router();

//Admin Login route
router.post("/login", loginUser);

// Only Master Admin Can Access
router.post("/create", protect, authorizeRoles("masterAdmin"), createUser);

//Get All Editor
router.get("/editors", protect, authorizeRoles("masterAdmin"), getAllEditors);

//Get All Reviewer
router.get("/reviewers", protect, authorizeRoles("masterAdmin", "editor"), getAllReviewers);

//Delte the User
router.delete("/delete/:id", protect, authorizeRoles("masterAdmin"), deleteUser);

router.put(
  "/block/:id",
  protect,
  authorizeRoles("masterAdmin"),
  toggleBlockUser,
);

router.put(
  "/assign-role/:id",
  protect,
  authorizeRoles("masterAdmin"),
  updateUserRole,
);

router.get("/all", protect, authorizeRoles("masterAdmin"), getAllUsers);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

router.post("/register", registerUser);
router.get("/verify-email/:token", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.put("/reset-password/:token", resetPassword);

//google auth routes

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      console.log("GOOGLE CALLBACK");
      console.log(req.user);

      const { email, name } = req.user;

      // Check if user already exists
      let user = await User.findOne({ email });

      // If not exist → create new user
      if (!user) {
        user = await User.create({
          name,
          email,
          password: "google-oauth-user", // dummy password
          isVerified: true, // Google users are already verified
        });
      }

      //  Create token using user._id
      const token = generateToken(user._id);

      //  Redirect to frontend
      res.redirect(
        `${process.env.FRONTEND_URL}/login-success?token=${token}`
      );
      console.log("Google login successful", { email, name });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Google login failed" });
    }
  }
);

router.put(
  "/change-password/:id",
  protect,
  authorizeRoles("masterAdmin"),
  changeUserPasswordByAdmin
);


export default router;
