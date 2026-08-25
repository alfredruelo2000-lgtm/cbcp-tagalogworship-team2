import { createFileRoute } from '@tanstack/react-router';
import AdminDashboardOverview from '@/components/dashboard/AdminDashboardOverview';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: AdminDashboardOverview,
});
