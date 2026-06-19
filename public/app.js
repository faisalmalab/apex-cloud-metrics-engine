// Connect to the WebSocket server
const ws = new WebSocket(`ws://${window.location.host}`);

const statusBadge = document.getElementById('connection-status');
const alertPanel = document.getElementById('alert-panel');

// Setup Chart.js
const ctx = document.getElementById('telemetryChart').getContext('2d');
const telemetryChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Timestamps go here
        datasets: [
            {
                label: 'CPU Load (%)',
                data: [],
                borderColor: '#3b82f6',
                yAxisID: 'y',
                tension: 0.2
            },
            {
                label: 'Memory Allocation (GB)',
                data: [],
                borderColor: '#10b981',
                yAxisID: 'y1',
                tension: 0.2
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { type: 'linear', display: true, position: 'left', grid: { color: '#334155' } },
            y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
        },
        plugins: {
            legend: { labels: { color: '#f8fafc' } }
        }
    }
});

// Listen for data from backend
ws.onopen = () => {
    statusBadge.textContent = "LIVE DATA STREAM ACTIVE";
    statusBadge.className = "status-badge connected";
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // 1. Update UI Numerical Counters (Swapped to match Cloud Backend variables)
    document.getElementById('rpm-val').textContent = data.cpu;
    document.getElementById('temp-val').textContent = data.memory;
    document.getElementById('boost-val').textContent = data.network;

    // 2. Update Alert Panel based on Analytical Rules Engine
    if (data.status === "CRITICAL") {
        alertPanel.className = "alert-box warning";
        document.getElementById('status-text').textContent = "CRITICAL ALERT";
        document.getElementById('alert-details').textContent = data.alert;
    } else {
        alertPanel.className = "alert-box healthy";
        document.getElementById('status-text').textContent = "HEALTHY";
        document.getElementById('alert-details').textContent = "All systems operating within normal parameters.";
    }

    // 3. Push to Chart and keep max 30 data points so it scrolls smoothly
    const timeLabel = new Date(data.timestamp).toLocaleTimeString();
    telemetryChart.data.labels.push(timeLabel);
    telemetryChart.data.datasets[0].data.push(data.cpu);      // Connected to cpu stream
    telemetryChart.data.datasets[1].data.push(data.memory);   // Connected to memory stream

    if (telemetryChart.data.labels.length > 30) {
        telemetryChart.data.labels.shift();
        telemetryChart.data.datasets[0].data.shift();
        telemetryChart.data.datasets[1].data.shift();
    }

    telemetryChart.update('none'); // Update smoothly without lag animations
};

ws.onclose = () => {
    statusBadge.textContent = "DISCONNECTED FROM SERVER";
    statusBadge.className = "status-badge";
};