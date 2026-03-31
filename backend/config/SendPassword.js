const nodemailer = require("nodemailer");

const SendPassword = async (name, email, password, eventTitle) => {
  console.log(
    "[SendPassword] Starting SendPassword function for:",
    name,
    "(",
    email,
    ")",
  );
  console.log(
    "[SendPassword] EMAIL_USER env variable:",
    process.env.EMAIL_USER ? "✓ Set" : "✗ NOT SET",
  );
  console.log(
    "[SendPassword] EMAIL_PASS env variable:",
    process.env.EMAIL_PASS ? "✓ Set" : "✗ NOT SET",
  );

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("[SendPassword] Transporter created");

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your Volunteer Login Details for ${eventTitle}`,
    html: `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Volunteer Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        color: #333;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        max-width: 600px;
        margin: 20px;
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.1);
        transform: perspective(1000px) rotateX(2deg) rotateY(2deg);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .container:hover {
        transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: #023e8a;
        color: #fff;
        padding: 15px;
        text-align: center;
        border-radius: 8px 8px 0 0;
        margin: -20px -20px 20px -20px;
      }
      .content {
        padding: 20px;
      }
      .footer {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-top: 20px;
      }
      .login-details {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        border: 1px solid #ddd;
      }
      .login-details strong {
        color: #023e8a;
      }
      a {
        color: #023e8a;
        text-decoration: none;
        font-weight: bold;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Volunteer Confirmation</h2>
      </div>
      <div class="content">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for signing up as a volunteer for <strong>${eventTitle}</strong>.</p>
        <p>To view your assigned tasks and event details, please log in to our website using the credentials below:</p>

        <div class="login-details">
          <p>Username :<strong> ${name}</strong></p>
          <p>Password :<strong> ${password}</strong></p>
          <p><a href="https://ease-events-926c7.web.app/VolLogin" target="_blank">Click here to log in to Our Website</a></p>
        </div>

        <p>Your contribution is highly valued, and we appreciate your support in making this event a success!</p>
      </div>
      <div class="footer">
        <p>If you have any questions, contact us at <a href="mailto:easeevent100@gmail.com">easeevent100@gmail.com</a>.</p>
        <p>We look forward to working with you!</p>
      </div>
    </div>
  </body>
</html>`,
  };

  // Send email
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending volunteer password email:", error);
        reject(error);
      } else {
        console.log("Volunteer password email sent:", info.response);
        resolve(info);
      }
    });
  });
};

module.exports = SendPassword;
