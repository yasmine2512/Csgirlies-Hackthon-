import mongoose from "mongoose";


const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correct: String,
  explanation: String
});
const quizSchema = new mongoose.Schema({
  questions: [questionSchema]
});
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  scores: { type: Number, default: 0 },
  quizzes: [quizSchema],
});

export default mongoose.model("User", userSchema);
