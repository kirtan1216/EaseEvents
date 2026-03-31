const mongoose = require("mongoose");
const qr = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const sendTicketEmail = require("../config/emailService");
const Event = require("../models/event.model");

const ParticipantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  ticketNumber: { type: String, unique: true, required: true },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  qrCode: {
    type: String,
  },
});

ParticipantSchema.pre("save", async function (next) {
  if (this.isModified("paymentStatus") && this.paymentStatus === "paid") {
    if (!this.ticketNumber) {
      this.ticketNumber = `TICKET-${Date.now()}-${Math.floor(
        Math.random() * 10000,
      )}`;
    }
    if (!this.qrCode) {
      this.qrCode = await qr.toDataURL(this.ticketNumber);
    }

    const event = await Event.findById(this.eventId);
    await sendTicketEmail(
      this.email,
      this.name,
      event.title,
      this.ticketNumber,
      this.qrCodePath,
      event.date,
      event.venue,
      event.startTime,
      event.endTime,
    );

    console.log(`Ticket email sent to ${this.email} for event ${event.title}`);
  }
  next();
});

module.exports = mongoose.model("Participant", ParticipantSchema);
