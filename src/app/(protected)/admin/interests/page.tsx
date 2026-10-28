export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { CreditCardIcon, User, Wallet } from 'lucide-react';
import { getCustomers, getinterests, getParkingTypes } from '@/services/customers.service';
import { getUsers } from '@/services/users.service';
import CardInterest from './components/create-interest-card';


export default async function InterestPage() {
  const interests = await getinterests();
  

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
        <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Administrar Intereses</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona los intereses de los clientes.
          </p>
        </div>
      </div>
      <CardInterest interests={interests}/>
    </div>
  );
}
