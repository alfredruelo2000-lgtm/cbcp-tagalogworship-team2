import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: () => <Outlet />,
});

// We need to keep the actual component logic somewhere.
// Let's move AdminDashboardOverview to a new component file.
