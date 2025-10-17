import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Health check endpoint for Render free-tier
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// Twilio WhatsApp webhook endpoint
app.post("/twilio-webhook", async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body;

    if (!from || !body) return res.status(400).send("Missing From or Body");

    // Prepare Airtable API request
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
    const payload = {
      fields: {
        "Phone Number": from,
        Message: body,
        "Received At": new Date().toISOString(),
      },
    };

    // Send data to Airtable
    const response = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Saved to Airtable:", data);
      res.status(200).send("Message saved!");
    } else {
      console.error("Airtable error:", data);
      res.status(500).send("Error saving to Airtable");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));

