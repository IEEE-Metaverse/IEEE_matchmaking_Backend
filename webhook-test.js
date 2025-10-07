// testWebhook.js
import express from "express";

const app = express();
const PORT = 4000;

app.use(express.json()); // to parse JSON body

app.post("/webhook-test", (req, res) => {
  console.log("Webhook triggered! Payload received:");
  console.log(req.body); // This will log the data sent from your backend
  res.json({ message: "Webhook received successfully" });
});

app.listen(PORT, () => {
  console.log(`Test webhook listening at http://localhost:${PORT}/webhook-test`);
});
