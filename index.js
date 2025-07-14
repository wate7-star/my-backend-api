const express = require("express");
const mongoose = require("mongoose");

require("dotenv").config();

const Feedback = require("./models/Feedback");

const app = express();
const cors = require("cors");

const allowedOrigins = [
  "https://anon-feedback-alpha.vercel.app", // your frontend domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

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
  "mdJoyce": { name: "Joyce", courses: ["issues in web design"] },
  "mdLaura": { name: "Laura", courses: ["analysis and design of user interface"] },
  "mrDismus": { name: "Dismus", courses: ["project proposal"] },
  "mrMachoge": { name: "Machoge", courses: ["Multimedia systems"] },
   "dr-smith123": { name: "Dr. Smith", courses: ["Data Structures", "Algorithms"] },
};

app.post("/lecturer-feedback", async (req, res) => {
  const { accessCode } = req.body;

  const lecturer = lecturerAccess[accessCode];
  if (!lecturer) {
    return res.status(401).json({ error: "Invalid access code" });
  }

  try {
    const nameQuery = new RegExp(lecturer.name, "i");

    const feedbacks = await Feedback.find({
      lecturer: { $regex: nameQuery },
      course: { $in: lecturer.courses },
      approved: true,
    }).sort({ createdAt: -1 });

    res.json({ lecturer: lecturer.name, courses: lecturer.courses, feedbacks });
  } catch (err) {
    console.error("Fetch error:", err);
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
