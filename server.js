const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const patterns = {
  email: /\b[\w.-]+@[\w.-]+\.\w+\b/g,
  phone: /\b\d{10}\b/g,
  aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  pan: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
};

function detectAndRedact(text) {
  let redacted = text;
  let highlighted = text;
  const found = {};
  let totalMatches = 0;

  for (const [type, regex] of Object.entries(patterns)) {
    const matches = text.match(regex) || [];
    if (matches.length > 0) {
      found[type] = matches.length;
      totalMatches += matches.length;
      redacted = redacted.replace(regex, `[REDACTED_${type.toUpperCase()}]`);
      highlighted = highlighted.replace(regex, m => `<mark>${m}</mark>`);
    }
  }

  // Simple risk score out of 10
  const riskScore = Math.min(10, totalMatches * 2);
  const riskLevel = riskScore === 0 ? 'None' : riskScore <= 4 ? 'Low' : riskScore <= 7 ? 'Medium' : 'High';

  return { original: text, highlighted, redacted, found, riskScore, riskLevel };
}

app.post('/api/redact-text', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  res.json(detectAndRedact(text));
});

app.post('/api/redact-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const data = await pdfParse(req.file.buffer);
    res.json(detectAndRedact(data.text));
  } catch (err) {
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));