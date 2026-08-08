import React, { ReactNode, Suspense, useRef, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PageTransition } from '@/components/layout/PageTransition';
import { Cursor } from '@/components/ui/Cursor';
import { Noise } from '@/components/ui/Noise';
import { Preloader } from '@/components/ui/Preloader';
import { PwaPrompt } from '@/components/ui/PwaPrompt';
import { PLATFORM_STATUS, getPlatformText } from '@/config/platform';
import { AppProvider, useAppContext } from '@/contexts/AppContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { Hero } from '@/features/hero/Hero';
import { routeToPath, routes, useAppRouter } from '@/routing/appRouter';
import { SubmitOrderResult } from '@/services/api';
import { createDesignDraft } from '@/services/drafts';
import { OrderDetails, PendingOrder, Product, ViewState } from '@/types';

const Catalog = React.lazy(() =>
  import('@/features/catalog/Catalog').then((module) => ({ default: module.Catalog })),
);
const Guide = React.lazy(() =>
  import('@/features/guide/Guide').then((module) => ({ default: module.Guide })),
);
const Designs = React.lazy(() =>
  import('@/features/designs/Designs').then((module) => ({ default: module.Designs })),
);
const Customizer = React.lazy(() =>
  import('@/features/customizer/Customizer').then((module) => ({ default: module.Customizer })),
);
const ProductionExportDock = React.lazy(() =>
  import('@/features/customizer/ProductionExportDock').then((module) => ({
    default: module.ProductionExportDock,
  })),
);
const Checkout = React.lazy(() =>
  import('@/features/checkout/Checkout').then((module) => ({ default: module.Checkout })),
);
const Success = React.lazy(() =>
  import('@/features/checkout/Success').then((module) => ({ default: module.Success })),
);

const LoadingSpinner = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white" />
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
        <div className="flex min-h-[50vh] items-center justify-center p-8 text-center">
          <div>
            <h2 className="mb-3 text-2xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-gray-500">Refresh the page to restart the studio.</p>
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

interface LastSubmission {
  result: SubmitOrderResult;
  pendingOrder: PendingOrder;
  details: OrderDetails;
}

const AppContent = () => {
  const { language } = useAppContext();
  const { showToast } = useToast();
  const { route, view, navigate } = useAppRouter();
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<LastSubmission | null>(null);
  const creatingDraftRef = useRef(false);

  const handleProductSelect = async (product: Product) => {
    if (creatingDraftRef.current) return;
    creatingDraftRef.current = true;
    setBusyProductId(product.id);

    try {
      const initialColor = product.colors[0];
      if (!initialColor) throw new Error('The product has no available colors.');

      const draft = await createDesignDraft({
        productId: product.id,
        color: initialColor,
      });
      navigate(routes.customizer(draft.id));
    } catch {
      showToast(
        language === 'ar'
          ? 'تعذر إنشاء مسودة تصميم على هذا الجهاز.'
          : 'A recoverable design draft could not be created on this device.',
        'error',
      );
    } finally {
      creatingDraftRef.current = false;
      setBusyProductId(null);
    }
  };

  const handleOrderSuccess = (
    result: SubmitOrderResult,
    pendingOrder: PendingOrder,
    details: OrderDetails,
  ) => {
    setLastSubmission({ result, pendingOrder, details });
    navigate(routes.success(result.orderId));
  };

  const handleReset = () => {
    setLastSubmission(null);
    navigate(routes.home());
  };

  const handleHeaderNavigation = (nextView: ViewState) => {
    if (nextView === 'CATALOG') {
      navigate(routes.catalog());
      return;
    }

    if (nextView === 'GUIDE') {
      navigate(routes.guide());
      return;
    }

    if (nextView === 'DESIGNS') {
      navigate(routes.designs());
      return;
    }

    navigate(routes.home());
  };

  const renderRoute = () => {
    switch (route.view) {
      case 'HOME':
        return (
          <Hero
            onStart={() => navigate(routes.catalog())}
            onOpenDesigns={() => navigate(routes.designs())}
          />
        );
      case 'CATALOG':
        return <Catalog onSelectProduct={handleProductSelect} busyProductId={busyProductId} />;
      case 'GUIDE':
        return (
          <Guide
            onOpenCatalog={() => navigate(routes.catalog())}
            onOpenDesigns={() => navigate(routes.designs())}
          />
        );
      case 'DESIGNS':
        return (
          <Designs
            onOpenDraft={(draftId) => navigate(routes.customizer(draftId))}
            onCreateNew={() => navigate(routes.catalog())}
          />
        );
      case 'CUSTOMIZER':
        return (
          <>
            <Customizer
              draftId={route.draftId}
              onCheckout={(draftId) => navigate(routes.checkout(draftId))}
              onMissingDraft={() => navigate(routes.designs(), { replace: true })}
            />
            <ProductionExportDock draftId={route.draftId} />
          </>
        );
      case 'CHECKOUT':
        return (
          <Checkout
            draftId={route.draftId}
            onBack={() => navigate(routes.customizer(route.draftId))}
            onMissingDraft={() => navigate(routes.designs(), { replace: true })}
            onSuccess={handleOrderSuccess}
          />
        );
      case 'SUCCESS': {
        const matchingSubmission =
          lastSubmission?.result.orderId === route.orderId ? lastSubmission : null;

        return (
          <Success
            orderId={route.orderId}
            orderDetails={matchingSubmission?.details}
            pendingOrder={matchingSubmission?.pendingOrder}
            onReset={handleReset}
            onOpenDesigns={() => navigate(routes.designs())}
            onStartNew={() => navigate(routes.catalog())}
          />
        );
      }
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-paper font-sans text-ink transition-colors duration-300 selection:bg-accent selection:text-white dark:bg-background dark:text-primary">
      <Preloader />
      <Noise />
      <Cursor />
      <PwaPrompt />

      <Header currentView={view} onNavigate={handleHeaderNavigation} />

      {PLATFORM_STATUS.phase === 'prototype' && (
        <div
          className="relative z-40 mt-16 border-b border-black/10 bg-[#e9e3d8] px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.16em] text-black/65 dark:border-white/10 dark:bg-[#101010] dark:text-white/55"
          role="status"
        >
          {getPlatformText(PLATFORM_STATUS.notice, language)}
        </div>
      )}

      <main className="relative flex-grow">
        <ErrorBoundary>
          <PageTransition viewKey={routeToPath(route)}>
            <Suspense fallback={<LoadingSpinner />}>{renderRoute()}</Suspense>
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
