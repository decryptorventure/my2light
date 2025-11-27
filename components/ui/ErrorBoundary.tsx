import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center">
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>

                            <h1 className="text-xl font-bold text-white mb-2">
                                Oops! Có lỗi xảy ra
                            </h1>

                            <p className="text-slate-400 mb-6">
                                Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="bg-slate-900 rounded-lg p-4 mb-6 text-left">
                                    <p className="text-xs text-red-400 font-mono break-all">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={this.handleReset}
                                icon={<RefreshCw size={20} />}
                                className="w-full"
                            >
                                Tải lại trang
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
