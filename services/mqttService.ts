import mqtt from 'mqtt';

// Use a public broker for testing, or a configured one
// In production, this should be an environment variable
const BROKER_URL = 'wss://test.mosquitto.org:8081';

export interface CameraStatus {
    courtId: string;
    status: 'idle' | 'recording' | 'error' | 'offline';
    lastHeartbeat: number;
}

type MessageHandler = (topic: string, message: any) => void;

class MQTTService {
    private client: mqtt.MqttClient | null = null;
    private statusListeners: Map<string, (status: CameraStatus) => void> = new Map();
    private connectionListeners: ((connected: boolean) => void)[] = [];

    connect() {
        if (this.client?.connected) return;

        console.log('Connecting to MQTT Broker:', BROKER_URL);
        this.client = mqtt.connect(BROKER_URL);

        this.client.on('connect', () => {
            console.log('MQTT Connected');
            this.notifyConnection(true);

            // Subscribe to all camera statuses
            this.client?.subscribe('my2light/cameras/+/status');
        });

        this.client.on('message', (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());

                // Handle status updates
                if (topic.includes('/status')) {
                    const courtId = topic.split('/')[2];
                    this.notifyStatus(courtId, payload);
                }
            } catch (err) {
                console.error('Failed to parse MQTT message:', err);
            }
        });

        this.client.on('error', (err) => {
            console.error('MQTT Error:', err);
            this.notifyConnection(false);
        });

        this.client.on('offline', () => {
            console.log('MQTT Offline');
            this.notifyConnection(false);
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.client = null;
            this.notifyConnection(false);
        }
    }

    // --- Actions ---

    startRecording(courtId: string, sessionId: string) {
        this.publish(`my2light/cameras/${courtId}/command`, {
            action: 'START_RECORDING',
            sessionId,
            timestamp: Date.now()
        });
    }

    stopRecording(courtId: string) {
        this.publish(`my2light/cameras/${courtId}/command`, {
            action: 'STOP_RECORDING',
            timestamp: Date.now()
        });
    }

    markHighlight(courtId: string) {
        this.publish(`my2light/cameras/${courtId}/command`, {
            action: 'MARK_HIGHLIGHT',
            timestamp: Date.now()
        });
    }

    // --- Listeners ---

    onStatusChange(courtId: string, callback: (status: CameraStatus) => void) {
        // In a real app, we might want to support multiple listeners per court
        // For simplicity, we just set one here or use an event emitter
        this.statusListeners.set(courtId, callback);
        return () => this.statusListeners.delete(courtId);
    }

    onConnectionChange(callback: (connected: boolean) => void) {
        this.connectionListeners.push(callback);
        return () => {
            this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
        };
    }

    // --- Private ---

    private publish(topic: string, message: any) {
        if (this.client?.connected) {
            this.client.publish(topic, JSON.stringify(message));
        } else {
            console.warn('Cannot publish, MQTT not connected');
        }
    }

    private notifyStatus(courtId: string, status: any) {
        const listener = this.statusListeners.get(courtId);
        if (listener) {
            listener({
                courtId,
                status: status.state,
                lastHeartbeat: status.timestamp
            });
        }
    }

    private notifyConnection(connected: boolean) {
        this.connectionListeners.forEach(cb => cb(connected));
    }
}

export const mqttService = new MQTTService();
