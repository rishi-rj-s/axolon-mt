const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save invoice endpoint
app.post('/save', (req, res) => {
  try {
    const data = req.body;
    
    // Generate timestamp-based filename
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const filename = `invoice-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    // Write file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`Saved invoice to: ${filepath}`);
    res.status(200).json({ success: true, message: `Saved successfully to ${filename}`, filepath });
  } catch (err) {
    console.error('Error saving invoice:', err);
    res.status(500).json({ success: false, message: 'Failed to save invoice', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Write-server is running on http://localhost:${PORT}`);
  console.log(`Any POST to /save will write JSON to the /output directory.`);
});
