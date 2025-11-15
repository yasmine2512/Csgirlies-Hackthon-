import express from "express";
import  User  from "../Models/User.js"; 

const router = express.Router();


// Get quizzes for logged-in user
router.get("/:id/my-quizzes", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ quizzes: user.quizzes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

// Save quiz text to a user
export async function saveQuizToUser(userId, quizText) {
  try {
    // Parse AI text into structured questions
    const questions = parseQuizFromText(quizText);
    if (!questions.length) throw new Error("No questions parsed from AI text");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Wrap questions into a quiz object
    const newQuiz = { questions };

    user.quizzes.push(newQuiz); // push a single quiz object, not individual questions
    await user.save();

    return user.quizzes;
  } catch (err) {
    console.error("Failed to save quiz:", err);
    throw err;
  }
}


function parseQuizFromText(text) {
  const questions = [];
  const blocks = text.split(/\n(?=\d+\.)/); // split by question number (1., 2., etc.)

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l);
    if (lines.length < 6) continue;

    // Question line
    const questionLine = lines[0].replace(/^\d+\.\s*/, "");

    // Options
    const options = lines
      .filter(l => /^[A-D][\)\.]/.test(l))
      .map(l => l.replace(/^[A-D][\)\.]\s*/, ""));

    // Correct answer
    const correctLine = lines.find(l => l.toLowerCase().includes("answer"));
    const explanationLine = lines.find(l => l.toLowerCase().startsWith("explanation:")) || "";

    if (questionLine && options.length === 4 && correctLine) {
      questions.push({
        question: questionLine,
        options,
        correct: correctLine.replace(/\*\*?Answer:\s*/i, "").replace(/\*\*/, "").trim(),
        explanation: explanationLine.replace(/^Explanation:\s*/i, "").trim()
      });
    }
  }

  return questions;
}

// remove quiz
router.delete("/:id/quizzes/:quizId", async (req, res) => {
  const user = await User.findById(req.params.id);
  user.quizzes = user.quizzes.filter((q) => q._id.toString() !== req.params.quizId);
  await user.save();
  res.json({ message: "Quiz removed", quizzes: user.quizzes });
});
export default router;
