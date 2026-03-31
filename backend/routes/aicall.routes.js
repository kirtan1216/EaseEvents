const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createCanvas, loadImage } = require("canvas");

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// POST /ai/generate-prompt
router.post("/generate-prompt", async (req, res) => {
  try {
    const { type } = req.body;
    console.log("Request body for /generate-prompt:", req.body); // Debug log
    if (!type) {
      return res.status(400).json({ error: "Prompt type is required" });
    }

    let systemPrompt;

    // Define prompt based on type
    switch (type.toLowerCase()) {
      case "story":
        systemPrompt =
          "Generate a creative writing prompt for a short story. The prompt should include a unique setting, a main character, and a central conflict. Format the response as a single sentence.";
        break;
      case "art":
        systemPrompt =
          "Create an art prompt for a digital illustration, describing a vivid scene with specific colors, mood, and key elements to include. Format the response as a single sentence.";
        break;
      case "coding":
        systemPrompt =
          "Generate a coding challenge prompt that includes a specific programming task, constraints, and an example use case. Format the response as a single sentence.";
        break;
      default:
        return res.status(400).json({
          error: "Invalid prompt type. Use 'story', 'art', or 'coding'.",
        });
    }

    // Call Gemini API
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const promptText = response.text();

    res.status(200).json({ prompt: promptText });
  } catch (error) {
    console.error("Error generating prompt:", error);
    res.status(500).json({ error: "Failed to generate prompt" });
  }
});

// POST /ai/generate-event-content
router.post("/generate-event-content", async (req, res) => {
  try {
    const { eventName, date, time, location, description } =
      req.body.eventDetails;

    // Validate required fields
    if (!eventName || !date || !time || !location || !description) {
      return res.status(400).json({
        error:
          "Missing required fields: eventName, date, time, location, description",
      });
    }

    // Construct prompt for Gemini API (for email and message only)
    const systemPrompt = `
      You are a professional content generator for event promotions, representing EaseEvent, an event management system. Based on the provided event details, generate two types of content: an email and a text message. The content must be engaging, clear, and tailored to the event. Follow these instructions strictly:

      - **Event Details**:
        - Event Name: ${eventName}
        - Date: ${date}
        - Time: ${time}
        - Location: ${location}
        - Description: ${description}

      - **Output Format**:
        - **Email**: A plain text email template with a detailed, professional invitation (300–400 words). Include a greeting, event overview, agenda or highlights, benefits of attending, and a call-to-action with a placeholder registration link. Start with "Dear [Attendee]," and end with "Best regards,\\nEaseEvent Team".
        - **Message**: A concise plain text message (max 160 characters) for SMS or chat, summarizing the event and including a call-to-action with a placeholder link.

      - **Response Structure**:
        Return a clean JSON object with two keys: "email" and "message". Each value must be a string. Do NOT include Markdown code fences (e.g., \`\`\`json), comments, or any text outside the JSON object. Ensure the JSON is valid and parseable. Escape special characters (e.g., quotes, newlines) appropriately for JSON.

      Example response:
      {
        "email": "Dear [Attendee],\\nWe are excited to invite you to ... Best regards,\\nEaseEvent Team",
        "message": "Join [Event Name] on [Date] at [Time] at [Location]! RSVP: [Link]"
      }
    `;

    // Call Gemini API for email and message
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const rawText = response.text();

    // Log raw response for debugging
    console.log("Raw Gemini API response:", rawText);

    // Clean the response: remove code fences and extra whitespace
    let cleanedText = rawText
      .replace(/```json\n?|\n?```|```/g, "") // Remove ```json and ```
      .replace(/^\s*|\s*$/g, "") // Trim whitespace
      .replace(/^.*?\n?\{/, "{"); // Remove any text before the JSON object

    // Parse the cleaned response as JSON
    let content;
    try {
      content = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Invalid JSON response from Gemini API");
    }

    // Validate response structure
    if (!content.email || !content.message) {
      throw new Error("Invalid response structure from Gemini API");
    }

    // Generate flyer image using node-canvas
    const width = 595; // A5 at 72 DPI (148mm)
    const height = 842; // A5 at 72 DPI (210mm)
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#ff6b6b"); // Vibrant red
    gradient.addColorStop(1, "#4ecdc4"); // Teal
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle Texture (Simulated with semi-transparent overlay)
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(0, 0, width, height);

    // Decorative Elements (Circular accents)
    ctx.strokeStyle = "#ffd700"; // Gold
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, Math.PI * 2); // Top-left circle
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 50, height - 50, 40, 0, Math.PI * 2); // Bottom-right circle
    ctx.stroke();

    // Event Name (Header)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Helvetica Neue', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(eventName.toUpperCase(), width / 2, 100);

    // Event Details
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px 'Helvetica Neue', Arial";
    ctx.fillText(`Date: ${date}`, width / 2, 200);
    ctx.fillText(`Time: ${time}`, width / 2, 250);
    ctx.fillText(`Location: ${location}`, width / 2, 300);

    // Description (Wrap text)
    ctx.font = "20px 'Helvetica Neue', Arial";
    const maxWidth = width - 40;
    let y = 350;
    const lines = description.split(" ");
    let line = "";
    for (let i = 0; i < lines.length; i++) {
      const testLine = line + lines[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        ctx.fillText(line, width / 2, y);
        line = lines[i] + " ";
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);

    // Call-to-Action
    ctx.fillStyle = "#ffd700"; // Gold
    ctx.font = "bold 28px 'Helvetica Neue', Arial";
    ctx.fillText("Register Now!", width / 2, y + 100);

    // QR Code Placeholder (Simulated with a square)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(width / 2 - 50, y + 150, 100, 100);
    ctx.fillStyle = "#000000";
    ctx.font = "16px Arial";
    ctx.fillText("Scan QR", width / 2, y + 200);

    // Convert canvas to base64
    const flyerBase64 = canvas.toDataURL("image/png");

    res.status(200).json({
      flyer: flyerBase64,
      email: content.email,
      message: content.message,
    });
  } catch (error) {
    console.error("Error generating event content:", error);
    res.status(500).json({ error: "Failed to generate event content" });
  }
});

module.exports = router;
