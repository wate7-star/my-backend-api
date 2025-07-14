const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Feedback = require("./models/Feedback");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Anonymous Feedback API is running");
});

app.post("/feedback", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Feedback saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});
const lecturerAccess = {
  "mdLaura": { name: "Laura", courses: ["Analysis and Design of user interface"] },
  "mrMachoge": { name: "Machoge", courses: ["Multimedia systems"] },
  "mdJoyce": { name: "Joyce", courses: ["issues in web design" ] },
  "mrDismus": { name: "Dismus", courses: ["Project proposal"] },
  "mrAndrew": { name: "Andrew", courses: ["Artificial intelligence"] },
  "mrJustin": { name: "Justin", courses: ["Mobile Application Programming"] },
  "mrJohn": { name: "John", courses: ["Network Administration"] },
  
};

app.post("/lecturer-feedback", async (req, res) => {
  const { accessCode } = req.body;

  const lecturer = lecturerAccess[accessCode];
  if (!lecturer) {
    return res.status(401).json({ error: "Invalid access code" });
  }

  try {
    const feedbacks = await Feedback.find({
      lecturer: {
        $elemMatch: {
          $regex: lecturer.name,
          $options: "i"
        }
      },
      course: { $in: lecturer.courses },
      approved: true,
    }).sort({ createdAt: -1 });

    res.json({ lecturer: lecturer.name, courses: lecturer.courses, feedbacks });
  } catch (err) {
    res.status(500).json({ error: "Error fetching feedback" });
  }
});

app.get("/admin/feedback", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

app.patch("/admin/feedback/:id", async (req, res) => {
  try {
    const updated = await Feedback.findByIdAndUpdate(req.params.id, {
      approved: req.body.approved,
    });
    res.json({ message: "Feedback updated", updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update feedback" });
  }
});


// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
