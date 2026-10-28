import Image from 'next/image';
import { Card, CardContent, CardFooter } from '../ui/card';

interface HeaderProps {
  label: string;
}
export function Header({ label }: HeaderProps) {
  return (
<header className="w-full flex justify-center">
<div className="flex items-center space-x-2 m-10">
    <div className="bg-yellow-400 px-4 py-1 rounded-md shadow-md">
      <span className="text-black text-lg font-bold">GARAGE</span>
    </div>
    <span className="text-white text-lg font-semibold">MITRE</span>
  </div>
</header>

  );
}

