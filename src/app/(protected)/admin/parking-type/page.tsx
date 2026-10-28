export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { FileSpreadsheet } from 'lucide-react';
import { getParkingTypes } from '@/services/customers.service';
import { ParkingTypeTable } from './components/parking-types-table';
import { parkingTypeColumns } from './components/parking-type-columns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ExportParkingExcel } from '../components/export-parking-excel';

export default async function ParkingTypePage() {
  const parkingTypes = await getParkingTypes();
  const total = parkingTypes?.data?.length ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Tipos de estacionamientos"
        description={
          total > 0
            ? `${total} tipos de estacionamiento registrados.`
            : 'Gestionar los tipos de estacionamientos.'
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ExportParkingExcel parkings={parkingTypes?.data || []} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <ParkingTypeTable
        columns={parkingTypeColumns}
        data={parkingTypes?.data || []}
      />
    </PageShell>
  );
}
