

// import nodemailer from "nodemailer";

// const sendEmail = async (options) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: "smtpout.secureserver.net",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: `MPA Research Editor <${process.env.EMAIL_USER}>`,
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//       html: options.html,
//       attachments: options.attachments || [],
//     };

//     const info = await transporter.sendMail(mailOptions);

//     console.log("Email sent successfully:", info.messageId);

//     return info;
//   } catch (error) {
//     console.error("Email sending failed:", error);

//     // Prevent server crash
//     return null;
//   }
// };

// export default sendEmail;












import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // Connection Pooling
  pool: true,
  maxConnections: 5,
  maxMessages: 100,

  // Timeouts
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// Verify SMTP connection when server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server Ready");
  }
});

const sendEmail = async (options, retries = 3) => {
  try {
    const mailOptions = {
      from: `MPA Research Editor <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email sending failed:", error);

    // Retry automatically if connection reset occurs
    if (
      retries > 0 &&
      (error.code === "ESOCKET" ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT")
    ) {
      console.log(`Retrying email... Attempts left: ${retries}`);

      return sendEmail(options, retries - 1);
    }

    return null;
  }
};

export default sendEmail;