import { useState } from 'react';
import type { Route } from './Route';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsListPage } from './pages/TransactionsListPage';
import { TransactionFormPage } from './pages/TransactionFormPage';
import { AccountFormPage } from './pages/AccountFormPage';

export function App() {
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });
  // Canvia de valor cada vegada que cal forçar que el Dashboard
  // recarregui dades (p.ex. després de crear un compte o un moviment).
  const [dashboardKey, setDashboardKey] = useState(0);

  function navigate(next: Route) {
    if (next.name === 'dashboard') {
      setDashboardKey((k) => k + 1);
    }
    setRoute(next);
  }

  switch (route.name) {
    case 'dashboard':
      return <DashboardPage key={dashboardKey} onSelectAccount={navigate} onNavigate={navigate} />;
    case 'new-account':
      return <AccountFormPage onNavigate={navigate} />;
    case 'transactions':
      return (
        <TransactionsListPage accountId={route.accountId} onNavigate={navigate} />
      );
    case 'new-transaction':
      return (
        <TransactionFormPage accountId={route.accountId} onNavigate={navigate} />
      );
  }
}
