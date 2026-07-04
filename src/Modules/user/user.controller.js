import User from "./user.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../../utils/sendEmail.js";
import fetch from "node-fetch";

//Public registration for Researcher
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, affiliation, captchaToken } = req.body;

    // ================= CAPTCHA VERIFY =================

    const captchaResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${captchaToken}`,
      }
    );

    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed",
      });
    }

    // ==================================================


    // BLOCK RANDOM BOT NAMES

    const randomPattern = /^[A-Za-z0-9]{15,}$/;

    if (randomPattern.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Suspicious name detected",
      });
    }


    // PASSWORD VALIDATION

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      affiliation,
      role: "researcher", // Default role
      verificationToken,
    });

    // Send Email Logic
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #1a73e8; padding: 40px 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">MPA Research</h1>
                            <p style="color: #e8f0fe; margin-top: 10px; font-size: 16px;">Empowering Scientific Excellence</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin-top: 0; font-size: 22px;">Welcome, ${name}!</h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                                Thank you for joining our community of researchers. To get started and access your dashboard, please verify your email address by clicking the button below.
                            </p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${verificationUrl}" style="background-color: #1a73e8; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">Verify My Account</a>
                            </div>

                            <p style="color: #888888; font-size: 14px; line-height: 1.5;">
                                If the button above doesn't work, copy and paste this link into your browser: <br>
                                <a href="${verificationUrl}" style="color: #1a73e8; word-break: break-all;">${verificationUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Support Section -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background-color: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Need Help or Support?</h3>
                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
                                    If you encounter any issues while creating your account or have general inquiries, please reach out to our team:
                                </p>
                                <table width="100%" style="font-size: 14px; color: #555;">
                                    <tr>
                                        <td style="padding: 5px 0;"><strong>Email:</strong> <a href="mailto:info@mparesearch.com" style="color: #1a73e8; text-decoration: none;">info@mparesearch.com</a></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0;"><strong>Phone:</strong> +91-9452292537, +91-8923580628</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; font-style: italic; color: #777;">General inquiries and submission support</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #f1f3f4; color: #777777; font-size: 12px;">
                            <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} MPA Research. All rights reserved.</p>
                            <p style="margin: 0;">This is an automated email, please do not reply to this message.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Verify your Journal Account",
        html: message,
      });
      res.status(201).json({
        success: true,
        message:
          "Registration successful. Please check your email to verify account.",
      });
    } catch (err) {
      console.log("EMAIL ERROR:", err);
      user.verificationToken = undefined;
      await user.save();
      return res
        .status(500)
        .json({ message: "Email could not be sent, but user registered." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Verify Email

export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Invalid Email or Password" });

    if (user.isBlocked)
      return res.status(403).json({ message: "User is Blocked" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid Email or Password" });

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE USER (Only Master Admin)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;


    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "User Created Successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BLOCK / UNBLOCK
export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBlocked ? "Blocked" : "Unblocked"} Successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ASSIGN / UPDATE ROLE (Master Admin Only)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Role validation (extra safety)
    const allowedRoles = ["editor", "reviewer", "researcher"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CURRENT USER PROFILE
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, affiliation, password } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.affiliation = affiliation || user.affiliation;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        affiliation: updatedUser.affiliation,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get All User
export const getAllUsers = async (req, res) => {
  try {
    const user = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: user.length,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get All Editor
export const getAllEditors = async (req, res) => {
  try {
    const editors = await User.find({ role: "editor" }).select("-password");
    res.status(200)
      .json({
        success: true,
        count: editors.length,
        data: editors,
      })
  }
  catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}

//Get All Reviewer
export const getAllReviewers = async (req, res) => {
  try {
    const reviewer = await User.find({ role: "reviewer" }).select("-password");
    res.status(200).json({
      success: true,
      count: reviewer.length,
      data: reviewer,
    })
  }
  catch (error) {
    return res.status(500)
      .json({
        message: error.message
      })
  }
}

//Delete A User
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404)
        .json({ message: "User not Found" });
    }
    if (user.role === "masterAdmin") {
      return res.status(400)
        .json({ message: "Cannot Delete Master Admin" });
    }

    await user.deleteOne();

    res.status(200)
      .json({
        success: true,
        message: "User Deleted Successfully",
      })
  }
  catch (error) {
    res.status(500)
      .json({ message: error.message });
  }
}


// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Security reason:
    // same response do even if email not exists

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If account exists, reset link sent to email",
      });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash Token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    // 15 minutes expiry
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Frontend Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>Click below link to reset password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Password Reset",
      html: message,
    });

    res.status(200).json({
      success: true,
      message: "Reset link sent to email",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash incoming token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Remove token after use
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// MASTER ADMIN CHANGE USER PASSWORD
// ===============================

export const changeUserPasswordByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validation
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
