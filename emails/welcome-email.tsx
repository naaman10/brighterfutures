import * as React from "react";

interface WelcomeEmailProps {
  parent_name: string;
  child_name: string;
  start_date: string;
  start_time: string;
}

export default function WelcomeEmail({
  parent_name = "Parent",
  child_name = "Student",
  start_date = "TBD",
  start_time = "TBD",
}: WelcomeEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to Brighter Futures Tuition</title>
      </head>
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          lineHeight: "1.6",
          color: "#333",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "30px",
            borderRadius: "10px",
          }}
        >
          <h1 style={{ color: "#2563eb", marginTop: 0 }}>
            Welcome to Brighter Futures Tuition!
          </h1>

          <p>Dear {parent_name},</p>

          <p>
            Thank you for choosing Brighter Futures Tuition for {child_name}'s
            educational journey. We're excited to support their learning and
            development!
          </p>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              borderLeft: "4px solid #2563eb",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#1e40af",
                fontSize: "18px",
              }}
            >
              First Session Details
            </h2>
            <p style={{ margin: "10px 0" }}>
              <strong>Student:</strong> {child_name}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>Date:</strong> {start_date}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>Time:</strong> {start_time}
            </p>
          </div>

          <p>
            Please find attached the terms and conditions, as well as extra
            materials for pupils.
          </p>

          <p>
            If you have any questions or need to reschedule, please don't
            hesitate to contact us.
          </p>

          <p>We look forward to working with {child_name}!</p>

          <p style={{ marginTop: "30px" }}>
            Best regards,
            <br />
            <strong>The Brighter Futures Tuition Team</strong>
          </p>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "12px",
          }}
        >
          <p>This email was sent by Brighter Futures Tuition</p>
        </div>
      </body>
    </html>
  );
}
