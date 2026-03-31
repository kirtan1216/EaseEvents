require("dotenv").config();
const express = require("express");
const router = express.Router();
const Event = require("../models/event.model");
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: "ddtqri4py",
  api_key: "457897286296644",
  api_secret: process.env.API_SECRET || "2XBKMMahnRC5q2m5j6qLWpz0fGc",
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
router.get("/all", async function (req, res) {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Error fetching events", error: err });
  }
});
router.post("/create_event", upload.single("image"), async function (req, res) {
  try {
    const {
      title,
      venue,
      date,
      startTime,
      endTime,
      ticketCategory,
      ticketPrice,
      ticketsAvailable,
      createdBy,
    } = req.body;

    if (
      !title ||
      !venue ||
      !date ||
      !startTime ||
      !endTime ||
      !ticketCategory ||
      !ticketsAvailable ||
      !req.file
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(fileStr, {
      folder: "events",
      resource_type: "image",
    });

    const newEvent = await Event.create({
      title,
      venue,
      date,
      startTime,
      endTime,
      createdBy,
      image: uploadResult.secure_url,
      ticketCategory,
      ticketPrice: ticketCategory === "paid" ? ticketPrice : undefined,
      ticketsAvailable,
    });

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/create_event", function (req, res) {
  res.send("all events");
});

router.get("/:eventID", async function (req, res) {
  const eventId = req.params.eventID;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:eventID/participants", async function (req, res) {
  const eventId = req.params.eventID;
  try {
    const event = await Event.findById(eventId).populate("participants");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

router.post("/myevents", async (req, res) => {
  try {
    const { userid } = req.body;
    if (!userid) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const events = await Event.find({ createdBy: userid });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.post("/edit/:eventId", upload.single("image"), async (req, res) => {
  const eventId = req.params.eventId;
  try {
    console.log(`Received request to edit event: ${eventId}`);

    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      console.log("Event not found");
      return res.status(404).json({ message: "Event not found" });
    }

    const {
      title,
      venue,
      date,
      startTime,
      endTime,
      ticketCategory,
      ticketPrice,
      ticketsAvailable,
    } = req.body;

    console.log("Request Body:", req.body);

    if (
      !title ||
      !venue ||
      !date ||
      !startTime ||
      !endTime ||
      !ticketCategory ||
      !ticketsAvailable
    ) {
      console.log("Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    // Update event basic info
    existingEvent.title = title;
    existingEvent.venue = venue;
    existingEvent.date = date;
    existingEvent.startTime = startTime;
    existingEvent.endTime = endTime;
    existingEvent.ticketCategory = ticketCategory;
    existingEvent.ticketPrice = ticketPrice;
    existingEvent.ticketsAvailable = ticketsAvailable;

    // If a new image is uploaded, update it
    if (req.file) {
      // Convert the buffer to a data URI for Cloudinary
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      // Upload the image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(fileStr, {
        folder: "events",
        resource_type: "image",
      });

      existingEvent.image = uploadResult.secure_url;
    }

    await existingEvent.save();
    console.log("Event updated successfully");

    res.json({ message: "Event updated successfully", event: existingEvent });
  } catch (error) {
    console.error("Error in /edit/:eventId:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/delete/:eventID", async (req, res) => {
  const eventId = req.params.eventID;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/sendquestion", async (req, res) => {
  try {
    const { qu, ans, eventid, id } = req.body;

    // Find the event by event ID
    let event = await Event.findById(eventid);
    if (!event)
      return res.status(404).json({ message: "Event does not exist" });

    let updatedEvent;

    if (id) {
      // Update an existing question's answer
      updatedEvent = await Event.findOneAndUpdate(
        { _id: eventid, "questions._id": id }, // Find event with the specific question
        { $set: { "questions.$.answer": ans } }, // Update the answer field
        { new: true }, // Return the updated document
      );

      if (!updatedEvent) {
        return res.status(404).json({ message: "Question not found" });
      }
    } else {
      // Add a new question
      event.questions.push({ q: qu, answer: ans });
      updatedEvent = await event.save();
    }

    res
      .status(200)
      .json({
        message: "Question added/updated successfully",
        event: updatedEvent,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
