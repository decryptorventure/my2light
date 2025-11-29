import React, { useEffect, useState } from 'react';
import { mqttService, CameraStatus } from '../../services/mqttService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Play, Square, Sparkles, Wifi, WifiOff, Activity } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const VenueControl: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [cameras, setCameras] = useState<Record<string, CameraStatus>>({});
    const { showToast } = useToast();

    useEffect(() => {
        // Connect to MQTT
        mqttService.connect();

        const unsubscribeConn = mqttService.onConnectionChange(setIsConnected);

        // Listen for status updates from any camera
        // In a real app, we'd probably have a list of known courts and subscribe to each
        // For this demo, we'll just capture whatever comes in
        const unsubscribeStatus = mqttService.onStatusChange('court-01', (status) => {
            setCameras(prev => ({
                ...prev,
                [status.courtId]: status
            }));
        });

        return () => {
            unsubscribeConn();
            unsubscribeStatus();
            mqttService.disconnect();
        };
    }, []);

    const handleStartRecording = (courtId: string) => {
        const sessionId = crypto.randomUUID();
        mqttService.startRecording(courtId, sessionId);
        showToast(`Sent START command to ${courtId}`, 'success');
    };

    const handleStopRecording = (courtId: string) => {
        mqttService.stopRecording(courtId);
        showToast(`Sent STOP command to ${courtId}`, 'info');
    };

    const handleHighlight = (courtId: string) => {
        mqttService.markHighlight(courtId);
        showToast(`Sent HIGHLIGHT command to ${courtId}`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-lime-400" />
                    Venue Camera Control
                </h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                    {isConnected ? 'MQTT Connected' : 'Disconnected'}
                </div>
            </div>

            {Object.keys(cameras).length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                    <p className="text-slate-400">Waiting for cameras to come online...</p>
                    <p className="text-xs text-slate-500 mt-2">Run `node scripts/camera-agent-simulator.js` to simulate a camera.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(cameras).map((cam) => (
                    <Card key={cam.courtId} className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase">{cam.courtId}</h3>
                                <div className="text-xs text-slate-400 font-mono">
                                    Last heartbeat: {new Date(cam.lastHeartbeat).toLocaleTimeString()}
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cam.status === 'recording' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                                    cam.status === 'idle' ? 'bg-slate-700 text-slate-300' :
                                        'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {cam.status}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {cam.status !== 'recording' ? (
                                <Button
                                    onClick={() => handleStartRecording(cam.courtId)}
                                    className="flex-1"
                                    icon={<Play size={16} />}
                                    disabled={!isConnected}
                                >
                                    Start Rec
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => handleHighlight(cam.courtId)}
                                        className="flex-1 bg-lime-400 text-slate-900 hover:bg-lime-500"
                                        icon={<Sparkles size={16} />}
                                    >
                                        Highlight
                                    </Button>
                                    <Button
                                        onClick={() => handleStopRecording(cam.courtId)}
                                        variant="outline"
                                        className="w-12 px-0 flex items-center justify-center border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    >
                                        <Square size={16} fill="currentColor" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
