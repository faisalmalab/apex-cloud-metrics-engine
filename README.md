# Apex Cloud Infrastructure Metrics Engine

A high-performance DevOps telemetry pipeline that streams, analyzes, and persists real-time cluster health and microservice metrics. 

## ⚡ Core Architecture Features
* **Real-Time Data Ingestion Pipeline:** Built utilizing Node.js and WebSockets (`ws`) to handle concurrent, high-frequency metrics streams (CPU, Memory, Network) at 100ms intervals.
* **Stream-Side Analytical Rules Engine:** Evaluates running data metrics in real-time, instantly identifying system anomalies—such as microservice memory leaks or server core overloads—with sub-second alert latency.
* **High-Throughput Persistence Strategy:** Implemented an in-memory buffer array combined with transactional SQL batch commits to write aggregated frames smoothly to an indexed SQLite database without interrupting data ingestion or locking operations.

## 🛠️ Tech Stack
* **Backend Engine:** Node.js, Express
* **Streaming Protocol:** WebSockets (`ws`)
* **Database Management:** SQLite3 (Optimized with targeted timestamp indexing)
* **Frontend Visualization:** HTML5, CSS3, JavaScript, Chart.js CDN
