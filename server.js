
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- PATH CONFIGURATION ---
// In Docker, we map the volume to /app/tests.
// This path must be consistent between Control Plane and Runner.
const TESTS_ROOT = path.join(__dirname, 'tests');
const GENERATED_DIR = path.join(TESTS_ROOT, 'generated');

// Ensure directories exist
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

// New Endpoint: Stream Docker Logs
app.get('/api/logs/stream', (req, res) => {
  const container = req.query.container;
  if (!container) return res.status(400).send("Container param required");

  console.log(`[Backend] Streaming logs for container: ${container}`);
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Spawn docker logs -f
  const dockerLogs = spawn('docker', ['logs', '-f', '--tail', '0', container]);

  const sendLog = (data) => {
    res.write(data);
  };

  dockerLogs.stdout.on('data', sendLog);
  dockerLogs.stderr.on('data', sendLog);

  req.on('close', () => {
    dockerLogs.kill();
  });
});

app.post('/api/run', (req, res) => {
  const { featureTitle, featureCode, stepsCode, tags, executionMode, containerName } = req.body;

  console.log(`[Backend] Request: ${featureTitle}`);
  console.log(`[Backend] Mode: ${executionMode} | Container: ${containerName || 'N/A'}`);

  // 1. Write the Feature File & Steps
  const safeTitle = featureTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const featureFilename = `${safeTitle}.feature`;
  const stepsFilename = `${safeTitle}.steps.ts`;
  
  const featurePath = path.join(GENERATED_DIR, featureFilename);
  const stepsPath = path.join(GENERATED_DIR, stepsFilename);

  try {
    fs.writeFileSync(featurePath, featureCode);
    if (stepsCode) {
        fs.writeFileSync(stepsPath, stepsCode);
    }
  } catch (e) {
    console.error(`[Backend] File Write Error:`, e);
    return res.status(500).send("Failed to write test files.");
  }

  // 2. Prepare Command
  let command = 'npx';
  let cmdArgs = [];

  if (executionMode === 'docker') {
    const containerTestPath = `tests/generated/${featureFilename}`;
    const targetContainer = containerName || 'playwright-runner';
    const grepArg = (tags && tags.length > 0) ? `--grep "${tags.join('|')}"` : '';
    
    command = 'docker';
    // Use sh -c to pipe output to /proc/1/fd/1 so it appears in 'docker logs'
    // This allows the /api/logs/stream endpoint to pick it up
    const playwrightCmd = `npx playwright test ${containerTestPath} ${grepArg}`;
    cmdArgs = ['exec', '-i', targetContainer, 'sh', '-c', `${playwrightCmd} | tee /proc/1/fd/1`];
  } else {
    // Host Mode
    cmdArgs = ['playwright', 'test', featurePath];
    if (tags && tags.length > 0) {
        cmdArgs.push('--grep', tags.join('|'));
    }
  }

  console.log(`[Backend] Executing: ${command} ${cmdArgs.join(' ')}`);

  const testProcess = spawn(command, cmdArgs, {
    cwd: __dirname,
    shell: true
  });

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  const sendLog = (data) => {
    res.write(data);
  };

  testProcess.stdout.on('data', sendLog);
  testProcess.stderr.on('data', sendLog);

  testProcess.on('close', (code) => {
    console.log(`[Backend] Process exited with code ${code}`);
    res.write(`\n[System] Process exited with code ${code}`);
    res.end();
  });
});

app.get('/api/artifacts/:runId', (req, res) => {
  const { runId } = req.params;
  const reportContent = `Simulated Artifact for ${runId}`;
  res.setHeader('Content-Disposition', `attachment; filename=run-${runId}-artifacts.txt`);
  res.setHeader('Content-Type', 'text/plain');
  res.send(reportContent);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    engine: 'playwright-node-bridge',
    mode: process.env.DOCKER_CONTAINER ? 'inside-container' : 'host',
    testsDir: GENERATED_DIR
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Control Plane Server running on http://localhost:${PORT}`);
});
