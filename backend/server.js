import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

app.use(express.json());
app.use(express.static(rootDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.post('/api/serp', async (req, res) => {
  try {
    const { keyword, domain, locationCode, device, authHeader } = req.body;

    if (!keyword || !domain) {
      return res.status(400).json({ error: 'Keyword and domain are required.' });
    }

    const authValue = authHeader || process.env.DATAFORSEO_AUTH_HEADER;
    if (!authValue) {
      return res.status(500).json({ error: 'Missing DataForSEO auth header.' });
    }

    const payload = [{
      keyword,
      location_code: locationCode || 2840,
      language_code: 'en',
      device: device || 'desktop',
      target: domain,
      priority: 2
    }];

    const taskResponse = await fetch('https://api.dataforseo.com/v3/serp/google/organic/task_post', {
      method: 'POST',
      headers: {
        Authorization: authValue,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const taskData = await taskResponse.json();
    if (!taskResponse.ok || (!taskData.tasks?.[0]?.id && taskData.status_code !== 20000 && taskData.status_code !== 20100)) {
      return res.status(taskResponse.status || 500).json(taskData);
    }

    const taskId = taskData.tasks[0].id;
    return res.json(taskData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Backend request failed.', details: error.message });
  }
});

app.get('/api/serp', async (req, res) => {
  try {
    const { taskId, authHeader } = req.query;
    const authValue = authHeader || process.env.DATAFORSEO_AUTH_HEADER;

    if (!taskId || !authValue) {
      return res.status(400).json({ error: 'Task ID and auth header are required.' });
    }

    const statusResponse = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: authValue
      }
    });

    const statusData = await statusResponse.json();
    if (!statusResponse.ok) {
      return res.status(statusResponse.status || 500).json(statusData);
    }

    return res.json(statusData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Backend request failed.', details: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process or use a different PORT.`);
    process.exit(1);
  } else {
    throw error;
  }
});
