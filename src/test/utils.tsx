import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/ui/Toast';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <HashRouter>
            <ToastProvider>
                {children}
            </ToastProvider>
        </HashRouter>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
