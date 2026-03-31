const nodemailer = require("nodemailer");

const sendTicketEmail = async (
  email,
  name,
  eventName,
  ticketNumber,
  qrCodePath,
  date,
  venue,
  startTime,
  endTime,
) => {
  console.log("[EmailService] Starting sendTicketEmail function");
  console.log(
    "[EmailService] EMAIL_USER env variable:",
    process.env.EMAIL_USER ? "✓ Set" : "✗ NOT SET",
  );
  console.log(
    "[EmailService] EMAIL_PASS env variable:",
    process.env.EMAIL_PASS ? "✓ Set" : "✗ NOT SET",
  );

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("[EmailService] Transporter created");
  const formatDate = (rawDate) => {
    const date = new Date(rawDate);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeRange = (timeRange) => {
    const [startTimeStr, endTimeStr] = timeRange.split(" - ");
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    const options = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZoneName: "short",
    };

    const formattedStart = startTime.toLocaleTimeString("en-US", options);
    const formattedEnd = endTime.toLocaleTimeString("en-US", options);
    return `${formattedStart} - ${formattedEnd}`;
  };

  const eventDate = date ? formatDate(date) : "Date TBD";
  const eventTime =
    startTime && endTime
      ? formatTimeRange(`${startTime} - ${endTime}`)
      : "Time TBD";

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your Ticket for ${eventName}`,
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event Participation Confirmation</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      color: #e0e0e0;
      font-family: Arial, sans-serif;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #1e1e1e;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      "
    >
      <div
        style="
          /* text-align: center; */
          padding-bottom: 20px;
          border-bottom: 3px solid #444;
          display: flex;
          justify-content: start;
          gap: 8px;
          align-items: center;
          margin-left: 16px;
        "
      >
        <img
          src="https://drive.google.com/thumbnail?id=1DYSJN9HV-DOlYzpWN7QAkOGH3_Wz6QTg&sz=w1000"
          alt="Company Logo"
          style="height: 40px; border-radius: 4px"
        />
        <h3>Ease Events</h3>
      </div>

      <!-- Header -->
      <div style="  padding-bottom: 20px; margin-left: 16px; margin-top: 30px">
        <h1 style="font-size: 24px; color: #ffffff; margin-bottom: 10px">
          ✅ You're In Our Event!
        </h1>
        <p style="font-size: 16px; color: #bdbdbd">
          Thank you for registering for our event. Here are the details:
        </p>
      </div>

      <!-- Event Details -->
      <div
        style="
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        "
      >
        <h2 style="font-size: 22px; color: #ffffff; margin-bottom: 15px">
          Event Details
        </h2>
        <ul style="list-style: none; padding: 0; margin: 0">
          <li
            style="margin-bottom: 15px; padding-left: 10px; position: relative"
          >
            <strong style="color: #ffffff">Event Name: ${eventName}</strong> 
          </li>
          <li
            style="margin-bottom: 15px; padding-left: 10px; position: relative"
          >
            <strong style="color: #ffffff">Date: ${eventDate}</strong> 
          </li>
          <li
            style="margin-bottom: 15px; padding-left: 10px; position: relative"
          >
            <strong style="color: #ffffff">Time:  ${eventTime}</strong>
          </li>
          <li
            style="margin-bottom: 15px; padding-left: 10px; position: relative"
          >
            <strong style="color: #ffffff">Location: ${venue}</strong> 
          </li>
        </ul>
      </div>

      <!-- QR Code Section -->
      <div
        style="
          text-align: center;
          padding: 20px;
          background-color: #2a2a2a;
          border-radius: 8px;
          margin-bottom: 20px;
        "
      >
        <h2 style="font-size: 22px; color: #ffffff; margin-bottom: 15px">
          🎟️ Your Event Pass
        </h2>
        <p style="font-size: 16px; color: #b0b0b0; margin-bottom: 20px">
          Scan the QR code below to access your event details or check-in:
        </p>
        <div
          style="
            background-color: white;
            display: inline-block;
            padding: 10px;
            border-radius: 8px;
          "
        >
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/event"
            alt="QR Code"
            style="width: 150px; height: 150px; border-radius: 4px"
          />
        </div>
        <p style="font-size: 14px; color: #b0b0b0; margin-top: 15px">
          ℹ️ Present this code at the entrance
        </p>
      </div>

      <!-- What to Bring Section -->
      <div
        style="
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        "
      >
        <h2 style="font-size: 22px; color: #ffffff; margin-bottom: 15px">
          What to Bring
        </h2>
        <ul style="list-style: none; padding: 0; margin: 0">
          <li
            style="margin-bottom: 10px; padding-left: 10px; position: relative"
          >
            Photo ID
          </li>
          <li
            style="margin-bottom: 10px; padding-left: 10px; position: relative"
          >
            Printed ticket or digital copy
          </li>
          <li
            style="margin-bottom: 10px; padding-left: 10px; position: relative"
          >
            Business cards for networking
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div
        style="
          text-align: center;
          padding: 20px 0;
          color: #b0b0b0;
          font-size: 14px;
          border-top: 1px solid #333;
        "
      >
        <p>
          <i class="fas fa-question-circle"></i> If you have any questions, feel
          free to contact us at
          <a
            href="mailto:[Contact Email]"
            style="color: #4fc3f7; text-decoration: none"
            >easeevent100@gmail.com</a
          >.
        </p>
        <p><i class="fas fa-smile"></i> We can't wait to see you there!</p>
        <p style="margin-top: 40px">
          <strong>Ease Events</strong>
          <br />Event Management Company
        </p>
        <div style="margin-top: 20px; font-size: 18px">
          <a
            href="#"
            style="color: #4fc3f7; text-decoration: none; margin: 0 10px"
            ><i class="fab fa-facebook"></i
          ></a>
          <a
            href="#"
            style="color: #4fc3f7; text-decoration: none; margin: 0 10px"
            ><i class="fab fa-twitter"></i
          ></a>
          <a
            href="#"
            style="color: #4fc3f7; text-decoration: none; margin: 0 10px"
            ><i class="fab fa-instagram"></i
          ></a>
          <a
            href="#"
            style="color: #4fc3f7; text-decoration: none; margin: 0 10px"
            ><i class="fab fa-linkedin"></i
          ></a>
        </div>
      </div>
    </div>
  </body>
</html>

`,

    attachments: qrCodePath
      ? [
          {
            filename: "ticket_qr.png",
            path: qrCodePath,
            cid: "qrCode",
            contentType: "image/png",
          },
        ]
      : [],
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending ticket email:", error);
        reject(error);
      } else {
        console.log("Ticket email sent:", info.response);
        resolve(info);
      }
    });
  });
};

module.exports = sendTicketEmail;
