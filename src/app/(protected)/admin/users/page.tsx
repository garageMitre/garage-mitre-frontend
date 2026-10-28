export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { CreditCardIcon, User } from 'lucide-react';
import { getCustomers, getParkingTypes } from '@/services/customers.service';
import { getUsers } from '@/services/users.service';
import { UsersTable } from './components/users-table';
import { userColumns } from './components/user-columns';


export default async function UserPage() {
  const users = await getUsers();
  

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
        <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Administrar Usuarios</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona todos los usuarios.
          </p>
        </div>
      </div>
      <UsersTable
        columns={userColumns}
        data={users?.data || []}
      />
    </div>
  );
}
