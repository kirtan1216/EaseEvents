const express = require("express");
const router = express.Router();
const userSchema = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Volunteer = require("../models/volunteer.model.js");
const forgetpassword = require("../config/forgetpassword.js");
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

router.get("/register", function (req, res) {
  res.send("register");
});

router.post("/register", async function (req, res) {
  try {
    const { email, password, username } = req.body;
    const existingUser = await userSchema.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashpassword = await bcrypt.hash(password, 10);
    const newuser = await userSchema.create({
      email,
      username,
      password: hashpassword,
    });

    res
      .status(200)
      .json({ message: "User registered successfully", user: newuser });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error registering user", error: error.message });
  }
});

router.get("/verify", async function (req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userSchema.findById(decoded.userID).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

router.post("/forgetpassword", async function (req, res) {
  try {
    const { email } = req.body;
    console.log("[ForgetPassword Route] Request received for email:", email);
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await userSchema.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const resetToken = jwt.sign({ id: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    const resetLink = `https://ease-events-926c7.web.app/resetpassword?token=${resetToken}`;
    try {
      console.log("[ForgetPassword Route] Calling forgetpassword function...");
      await forgetpassword(email, resetLink);
      console.log("[ForgetPassword Route] Email sent successfully");
      return res
        .status(200)
        .json({ message: "Reset link sent! Check your email." });
    } catch (error) {
      console.error("[ForgetPassword Route] Error sending reset email:", error);
      return res
        .status(500)
        .json({ message: "Failed to send reset email.", error: error.message });
    }
  } catch (error) {
    console.error("Forget Password Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/resetpassword", async function (req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required" });
  }

  // Verify token
  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err && err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired" });
    }

    if (err) {
      console.error("JWT verification failed:", err);
      return res.status(400).json({ message: "Invalid token" });
    }

    // Proceed with password reset logic
    const user = await userSchema.findById(decoded.id); // decoded.id instead of decoded.email
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10); // Hash the new password
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  });
});

router.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;

    const user = await userSchema.findOne({ username });
    if (!user) {
      return res.status(400).json({
        message: "Username or password is incorrect",
      });
    }

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
      return res.status(400).json({
        message: "Username or password is incorrect",
      });
    }

    const token = jwt.sign(
      {
        userID: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Ensure this is secure in production
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "An error occurred during login",
      error: error.message,
    });
  }
});

router.post("/Vollogin", async function (req, res) {
  try {
    const { username, password } = req.body;

    const volunte = await Volunteer.findOne({ name: username });

    if (!volunte) {
      return res.status(404).json({ message: "Volunteer not found" });
    }
    const ismatch = await bcrypt.compare(password, volunte.password);
    if (!ismatch) {
      return res.status(400).json({
        message: "Username or password is incorrect",
      });
    }
    const token = jwt.sign(
      {
        userID: volunte._id,
        username: volunte.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Ensure this is secure in production
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
    });
    res
      .status(200)
      .json({ message: "Login successful", token, volunteer: volunte });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/profileDetails/:userID", async function (req, res) {
  try {
    const { userID } = req.params;
    const userdetails = await userSchema.findById(userID);

    if (!userdetails) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(userdetails);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.put("/profile/:userID", async function (req, res) {
  try {
    const { userID } = req.params;
    const updates = req.body;

    const existingUser = await userSchema.findById(userID);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const updatedUser = await userSchema.findByIdAndUpdate(userID, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
