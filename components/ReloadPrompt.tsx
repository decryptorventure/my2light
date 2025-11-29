import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toast } from './ui/Toast';
import { Button } from './ui/Button';

export const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: any) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error: any) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <>
            {offlineReady && (
                <Toast
                    message="App ready to work offline"
                    type="success"
                    onClose={close}
                />
            )}
            {needRefresh && (
                <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                        New content available, click on reload button to update.
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateServiceWorker(true)}>
                            Reload
                        </Button>
                        <Button size="sm" variant="outline" onClick={close}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};
