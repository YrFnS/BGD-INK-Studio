import React, { ReactNode, Suspense, useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PageTransition } from './components/layout/PageTransition';
import { Cursor } from './components/ui/Cursor';
import { Noise } from './components/ui/Noise';
import { Preloader } from './components/ui/Preloader';
import { PLATFORM_STATUS, getPlatformText } from './config/platform';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import { Hero } from './features/hero/Hero';
import { OrderDetails, PendingOrder, ViewState } from './types';

const Catalog = React.lazy(() =>
  import('./features/catalog/Catalog').then((module) => ({ default: module.Catalog })),
);
const Customizer = React.lazy(() =>
  import('./features/customizer/Customizer').then((module) => ({ default: module.Customizer })),
);
const Checkout = React.lazy(() =>
  import('./features/checkout/Checkout').then((module) => ({ default: module.Checkout })),
);
const Success = React.lazy(() =>
  import('./features/checkout/Success').then((module) => ({ default: module.Success })),
);

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin" />
    <span className="sr-only">Loading</span>
  </div>
);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-8 flex items-center justify-center text-center">
          <div>
            <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
            <p className="text-gray-500 mb-6">Refresh the page to restart the studio.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-black px-6 py-3 font-bold text-white dark:bg-white dark:text-black"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const { language } = useAppContext();
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    details: OrderDetails;
  } | null>(null);

  const navigate = (nextView: ViewState) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    navigate('CUSTOMIZER');
  };

  const handleCheckout = (order: PendingOrder) => {
    setPendingOrder(order);
    navigate('CHECKOUT');
  };

  const handleOrderSuccess = (orderId: string, details: OrderDetails) => {
    setConfirmedOrder({ id: orderId, details });
    navigate('SUCCESS');
  };

  const handleReset = () => {
    setPendingOrder(null);
    setConfirmedOrder(null);
    setSelectedProduct(null);
    navigate('HOME');
  };

  const renderView = () => {
    switch (view) {
      case 'HOME':
        return <Hero onStart={() => navigate('CATALOG')} />;
      case 'CATALOG':
        return <Catalog onSelectProduct={handleProductSelect} />;
      case 'CUSTOMIZER':
        return <Customizer productId={selectedProduct} onCheckout={handleCheckout} />;
      case 'CHECKOUT':
        return (
          <Checkout
            order={pendingOrder}
            onBack={() => navigate('CUSTOMIZER')}
            onSuccess={handleOrderSuccess}
          />
        );
      case 'SUCCESS':
        return pendingOrder && confirmedOrder ? (
          <Success
            orderId={confirmedOrder.id}
            orderDetails={confirmedOrder.details}
            pendingOrder={pendingOrder}
            onReset={handleReset}
          />
        ) : (
          <Hero onStart={() => navigate('CATALOG')} />
        );
      default:
        return <Hero onStart={() => navigate('CATALOG')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300 text-black dark:text-white font-sans selection:bg-accent selection:text-white relative">
      <Preloader />
      <Noise />
      <Cursor />

      <Header currentView={view} onNavigate={navigate} />

      {PLATFORM_STATUS.phase === 'prototype' && (
        <div
          className="relative z-40 mt-16 border-b border-amber-300/40 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {getPlatformText(PLATFORM_STATUS.notice, language)}
        </div>
      )}

      <main className="flex-grow relative">
        <ErrorBoundary>
          <PageTransition viewKey={view}>
            <Suspense fallback={<LoadingSpinner />}>{renderView()}</Suspense>
          </PageTransition>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
};

export const App = () => (
  <AppProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </AppProvider>
);
