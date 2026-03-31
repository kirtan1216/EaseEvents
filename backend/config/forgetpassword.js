const nodemailer = require("nodemailer");

const forgetpassword = async (email, resetLink) => {
  console.log(
    "[ForgetPassword] Starting forgetpassword function for email:",
    email,
  );
  console.log(
    "[ForgetPassword] EMAIL_USER env variable:",
    process.env.EMAIL_USER ? "✓ Set" : "✗ NOT SET",
  );
  console.log(
    "[ForgetPassword] EMAIL_PASS env variable:",
    process.env.EMAIL_PASS ? "✓ Set" : "✗ NOT SET",
  );

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("[ForgetPassword] Transporter created");

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Password Reset Request From EaseEvents`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
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
    .reset-instructions {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      border: 1px solid #ddd;
    }
    .reset-button {
      display: inline-block;
      background-color: #023e8a;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 15px 0;
    }
    .reset-button:hover {
      background-color: #0353a4;
    }
    .expiry-note {
      color: #d90429;
      font-size: 14px;
      margin-top: 10px;
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
      <h2>Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Dear Sir/Mam,</p>
      
      <p>We received a request to reset your password</p>
      <p>To reset your password, please click the button below:</p>

      <div class="reset-instructions">
        <a href="${resetLink}" class="reset-button">Reset Password</a>
        <p class="expiry-note">This link will expire in 24 hours for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have questions.</p>
      </div>

      
    </div>
    <div class="footer">
      <p>If you need further assistance, contact us at <a href="mailto:easeevent100@gmail.com">easeevent100@gmail.com</a>.</p>
      <p>Thank you for using our services!</p>
    </div>
  </div>
</body>
</html>`,
  };

  // Send email
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending password reset email:", error);
        reject(error);
      } else {
        console.log("Password reset email sent:", info.response);
        resolve(info);
      }
    });
  });
};

module.exports = forgetpassword;
