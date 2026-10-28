export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { getinterests } from '@/services/customers.service';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import CardInterest from './components/create-interest-card';


export default async function InterestPage() {
  const interests = await getinterests();

  return (
    <PageShell>
      <PageHeader
        title="Administrar intereses"
        description="Gestioná los intereses de los clientes."
      />
      <CardInterest interests={interests}/>
    </PageShell>
  );
}
