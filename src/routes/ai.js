// src/routes/ai.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

// POST /api/ai with { query }
router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  const prompt = `Devuelve una lista de atajos de teclado para la siguiente solicitud del usuario: "${query}". Proporciona una lista concisa de los atajos más relevantes.`;
  const schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        action: { type: "STRING" },
        keys: { type: "STRING" },
      },
      required: ["action", "keys"],
    },
  };

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });
    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidate) {
      const result = JSON.parse(candidate);
      return res.json(result);
    }
    return res.json([]);
  } catch (error) {
    console.error("AI service error:", error.message);
    return res.status(500).json({ error: "Error fetching AI shortcuts" });
  }
});

module.exports = router;
