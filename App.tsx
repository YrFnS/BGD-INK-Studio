import React, { useState, Suspense, ReactNode } from 'react';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PageTransition } from './components/layout/PageTransition';
import { ViewState, PendingOrder, OrderDetails } from './types';
import { Noise } from './components/ui/Noise';
import { Cursor } from './components/ui/Cursor';
import { Preloader } from './components/ui/Preloader';

// Feature Imports
import { Hero } from './features/hero/Hero';

// Lazy Load heavy components
const Catalog = React.lazy(() => import('./features/catalog/Catalog').then(m => ({ default: m.Catalog })));
const Customizer = React.lazy(() => import('./features/customizer/Customizer').then(m => ({ default: m.Customizer })));
const Checkout = React.lazy(() => import('./features/checkout/Checkout').then(m => ({ default: m.Checkout })));
const Success = React.lazy(() => import('./features/checkout/Success').then(m => ({ default: m.Success })));
const Admin = React.lazy(() => import('./features/admin/Admin').then(m => ({ default: m.Admin })));

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
  </div>
);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple Error Boundary for 3D Context crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  public static getDerivedStateFromError(): ErrorBoundaryState { 
    return { hasError: true }; 
  }
  
  public render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center">Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; details: OrderDetails } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  React.useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setView('CUSTOMIZER');
    window.scrollTo(0, 0);
  };

  const handleCheckout = (order: PendingOrder) => {
    setPendingOrder(order);
    setView('CHECKOUT');
    window.scrollTo(0, 0);
  };

  const handleOrderSuccess = (orderId: string, details: OrderDetails) => {
    setConfirmedOrder({ id: orderId, details });
    setView('SUCCESS');
    window.scrollTo(0, 0);
  };

  const handleReset = () => {
    setPendingOrder(null);
    setConfirmedOrder(null);
    setView('HOME');
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (view) {
      case 'HOME':
        return <Hero onStart={() => setView('CATALOG')} />;
      case 'CATALOG':
        return <Catalog onSelectProduct={handleProductSelect} />;
      case 'CUSTOMIZER':
        return <Customizer productId={selectedProduct} onCheckout={handleCheckout} />;
      case 'CHECKOUT':
        return <Checkout order={pendingOrder} onBack={() => setView('CUSTOMIZER')} onSuccess={handleOrderSuccess} />;
      case 'SUCCESS':
         return pendingOrder && confirmedOrder ? (
           <Success orderId={confirmedOrder.id} orderDetails={confirmedOrder.details} pendingOrder={pendingOrder} onReset={handleReset} />
         ) : <Hero onStart={() => setView('CATALOG')} />;
      case 'ADMIN':
        return <Admin />;
      default:
        return <Hero onStart={() => setView('CATALOG')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300 text-black dark:text-white font-sans selection:bg-accent selection:text-white relative">
      <Preloader />
      <Noise />
      <Cursor />
      
      <Header currentView={view} onNavigate={(v) => { setView(v); window.scrollTo(0, 0); }} />
      
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1 mt-16 z-40 animate-pulse relative">
          OFFLINE MODE - BROWSING CACHED CONTENT
        </div>
      )}

      <main className={`flex-grow relative ${isOffline ? '' : 'pt-0'}`}>
        <ErrorBoundary>
          <PageTransition viewKey={view}>
            <Suspense fallback={<LoadingSpinner />}>
              {renderView()}
            </Suspense>
          </PageTransition>
        </ErrorBoundary>
      </main>
      
      <Footer onAdminClick={() => setView('ADMIN')} />
    </div>
  );
};

export const App = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
};