import mqtt from 'mqtt';

// Configuration
const BROKER_URL = 'wss://test.mosquitto.org:8081';
const COURT_ID = 'court-01';
const DEVICE_ID = 'cam-agent-01';

console.log(`🎥 Camera Agent Simulator (${DEVICE_ID}) starting...`);
console.log(`📡 Connecting to broker: ${BROKER_URL}`);

const client = mqtt.connect(BROKER_URL);

// State
let state = 'idle'; // idle, recording, error
let currentSessionId = null;
let recordingTimer = null;

client.on('connect', () => {
    console.log('✅ Connected to MQTT Broker');

    // Subscribe to commands for this court
    const commandTopic = `my2light/cameras/${COURT_ID}/command`;
    client.subscribe(commandTopic, (err) => {
        if (!err) {
            console.log(`👂 Listening for commands on: ${commandTopic}`);
        }
    });

    // Start heartbeat
    setInterval(sendHeartbeat, 5000);
});

client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        console.log(`📩 Received command: ${payload.action}`, payload);

        handleCommand(payload);
    } catch (err) {
        console.error('❌ Failed to parse message:', err);
    }
});

function handleCommand(payload) {
    switch (payload.action) {
        case 'START_RECORDING':
            if (state === 'recording') {
                console.warn('⚠️ Already recording');
                return;
            }
            state = 'recording';
            currentSessionId = payload.sessionId;
            console.log(`🔴 STARTED RECORDING session: ${currentSessionId}`);

            // Simulate recording process
            recordingTimer = setInterval(() => {
                process.stdout.write('.');
            }, 1000);
            break;

        case 'STOP_RECORDING':
            if (state !== 'recording') {
                console.warn('⚠️ Not recording');
                return;
            }
            state = 'idle';
            currentSessionId = null;
            if (recordingTimer) clearInterval(recordingTimer);
            console.log('\n⏹️ STOPPED RECORDING');
            break;

        case 'MARK_HIGHLIGHT':
            if (state !== 'recording') {
                console.warn('⚠️ Cannot mark highlight: Not recording');
                return;
            }
            console.log(`✨ HIGHLIGHT MARKED at ${new Date().toISOString()}`);
            // In a real agent, this would save a timestamp or cut a clip
            break;

        default:
            console.log('❓ Unknown command');
    }

    // Send immediate status update
    sendHeartbeat();
}

function sendHeartbeat() {
    const statusTopic = `my2light/cameras/${COURT_ID}/status`;
    const payload = {
        deviceId: DEVICE_ID,
        courtId: COURT_ID,
        state: state,
        currentSessionId: currentSessionId,
        timestamp: Date.now(),
        cpu: Math.floor(Math.random() * 20) + 10, // Mock CPU usage
        disk: '45GB free'
    };

    client.publish(statusTopic, JSON.stringify(payload));
    // console.log(`💓 Heartbeat sent: ${state}`);
}

// Handle exit
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    client.end();
    process.exit();
});
