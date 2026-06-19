const express = require('express');
const { WebSocketServer } = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

// ---------------------------------------------------------
// CLOUD DATABASE CONFIGURATION
// ---------------------------------------------------------
const dbPath = path.join(__dirname, 'telemetry.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cluster_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            cpu_utilization INTEGER NOT NULL,
            memory_usage REAL NOT NULL,
            network_throughput REAL NOT NULL,
            status TEXT NOT NULL
        )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_metrics_time ON cluster_metrics(timestamp)`);
});

let databaseBuffer = [];

function flushBufferToDatabase() {
    if (databaseBuffer.length === 0) return;
    const currentBatch = [...databaseBuffer];
    databaseBuffer = [];

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(`
            INSERT INTO cluster_metrics (timestamp, cpu_utilization, memory_usage, network_throughput, status) 
            VALUES (?, ?, ?, ?, ?)
        `);
        currentBatch.forEach(log => {
            stmt.run(log.timestamp, log.cpu, log.memory, log.network, log.status);
        });
        stmt.finalize();
        db.run("COMMIT");
    });
}
setInterval(flushBufferToDatabase, 2000);

// ---------------------------------------------------------
// SERVER METRICS STREAM GENERATOR (DEV OPS FOCUS)
// ---------------------------------------------------------
function getCloudMetrics() {
    // Simulate cloud server metrics fluctuating with user traffic
    const baseCPU = 40 + Math.sin(Date.now() / 8000) * 30;
    const cpu = Math.max(5, Math.min(99, baseCPU + (Math.random() * 10 - 5)));
    
    // Memory creeps up if CPU usage stays high (simulating load)
    const memory = 8.2 + (cpu / 20) + Math.sin(Date.now() / 20000) * 1.5;
    
    // Network traffic spikes randomly
    const network = cpu > 75 ? 450 + Math.random() * 120 : 80 + Math.random() * 30;

    let systemStatus = "OPERATIONAL";
    let alertMessage = "";
    
    // Analytical Rule: Detect system degradation / possible memory leak
    if (cpu > 85 && memory > 11) {
        systemStatus = "CRITICAL";
        alertMessage = "Microservice Node-01 experiencing critical memory leak!";
    }

    return {
        timestamp: new Date().toISOString(),
        cpu: Math.round(cpu),
        memory: parseFloat(memory.toFixed(2)),
        network: Math.round(network),
        status: systemStatus,
        alert: alertMessage
    };
}

// ---------------------------------------------------------
// SERVER START
// ---------------------------------------------------------
const server = app.listen(PORT, () => {
    console.log(`🚀 Apex Cloud Metrics Engine running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
    const streamInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            const data = getCloudMetrics();
            ws.send(JSON.stringify(data));
            databaseBuffer.push(data);
        }
    }, 100);
    ws.on('close', () => clearInterval(streamInterval));
});