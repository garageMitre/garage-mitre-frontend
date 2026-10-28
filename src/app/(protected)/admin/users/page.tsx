export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { getUsers } from '@/services/users.service';
import { UsersTable } from './components/users-table';
import { userColumns } from './components/user-columns';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';

export default async function UserPage() {
  const users = await getUsers();
  const total = users?.data?.length ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Usuarios del sistema"
        description={
          total > 0
            ? `${total} cuentas activas — operadores y administradores.`
            : 'Creá la primera cuenta para empezar a operar.'
        }
      />
      <UsersTable columns={userColumns} data={users?.data || []} />
    </PageShell>
  );
}
