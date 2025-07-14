const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Feedback = require("./models/Feedback");

const app = express();

// ✅ Whitelisted frontend domain
const allowedOrigins = ["https://anon-feedback-alpha.vercel.app"];

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

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ✅ Normalize function for name comparison
const normalize = (name) => name.toLowerCase().replace(/\s|\./g, "");

// ✅ Access codes and lecturer mapping
const lecturerAccess = {
  "mdjoyce": { name: "Joyce", courses: ["issues in web design"] },
  "mdlaura": { name: "Laura", courses: ["analysis and design of user interface"] },
  "mrdismus": { name: "Dismus", courses: ["project proposal"] },
  "mrmachoge": { name: "Machoge", courses: ["Multimedia systems"] },
  "dr-smith123": { name: "Dr. Smith", courses: ["Data Structures", "Algorithms"] },
};

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🎉 Anonymous Feedback API is running");
});

// ✅ Submit feedback route
app.post("/feedback", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Feedback saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// ✅ Lecturer feedback (secure, flexible match)
app.post("/lecturer-feedback", async (req, res) => {
  const { accessCode } = req.body;

  const lecturer = lecturerAccess[accessCode];
  if (!lecturer) {
    return res.status(401).json({ error: "Invalid access code" });
  }

  try {
    const normalizedLecturerName = normalize(lecturer.name);

    const allFeedbacks = await Feedback.find({
      course: { $in: lecturer.courses },
      approved: true,
    }).sort({ createdAt: -1 });

    // Only return feedback where the lecturer name matches (case and space/period insensitive)
    const feedbacks = allFeedbacks.filter(fb => normalize(fb.lecturer) === normalizedLecturerName);

    res.json({ lecturer: lecturer.name, courses: lecturer.courses, feedbacks });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Error fetching feedback" });
  }
});

// ✅ Admin: Get all feedback
app.get("/admin/feedback", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// ✅ Admin: Approve/revoke feedback
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

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
