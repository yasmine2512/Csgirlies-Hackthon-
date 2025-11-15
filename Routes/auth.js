import express from "express";
import bcrypt from "bcryptjs";
import User from "../Models/User.js";

const router = express.Router();


// Signup
router.post("/signup", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password)
    return res.status(400).json({ error: "Missing fields" });

  const existingUser = await User.findOne({ name });
  if (existingUser) return res.status(400).json({ error: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, password: hashedPassword });
  await newUser.save();
  res.json({ message: "User created", user: { id: newUser._id, name } });
});


// Login
router.post("/login", async (req, res) => {
  const { name , password } = req.body;
  const user = await User.findOne({ name });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  res.json({ message: "Login successful", user: { id: user._id, name: user.name,score: user.score, quizzes: user.quizzes } });
});

//Update score
router.put("/:id/add-score", async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (score == null) return res.status(400).json({ error: "Score is required" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.scores) user.scores = 0;

    user.scores += score;
    await user.save();

    res.json({ message: "Score added successfully", totalScore: user.scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add score" });
  }
});



export default router;
