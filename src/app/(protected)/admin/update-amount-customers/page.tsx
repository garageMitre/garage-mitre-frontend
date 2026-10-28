export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import UpdateAmountCustomerCard from './components/update-amount-customer-card';

export default async function UpdateAmountCustomersPage() {
  return (
    <PageShell>
      <PageHeader
        title="Actualizar montos"
        description="Actualizá el monto de los inquilinos."
      />
      <UpdateAmountCustomerCard/>
    </PageShell>
  );
}
