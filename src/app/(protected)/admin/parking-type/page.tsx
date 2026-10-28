export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { ParkingCircle, FileSpreadsheet } from 'lucide-react';
import { getParkingTypes } from '@/services/customers.service';
import { ParkingTypeTable } from './components/parking-types-table';
import { parkingTypeColumns } from './components/parking-type-columns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ExportParkingExcel } from '../components/export-parking-excel';

export default async function ParkingTypePage() {
  const parkingTypes = await getParkingTypes();

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <ParkingCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Tipos de Estacionamientos</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gestionar los tipos de estacionamientos.
            </p>
          </div>
        </div>

        {/* 🧭 Dropdown de acciones */}
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
      </div>

      {/* Tabla */}
      <ParkingTypeTable
        columns={parkingTypeColumns}
        data={parkingTypes?.data || []}
      />
    </div>
  );
}
