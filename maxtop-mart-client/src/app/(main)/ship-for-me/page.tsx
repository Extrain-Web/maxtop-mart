import ShipForMePage from '@/components/home/ShipForMePage';
import { Suspense } from 'react';

export const metadata = {
    title: 'Ship For Me | Sinortiglobal',
    description: 'Simplify your shipping with our Ship for Me service.',
};

export default function ShipForMe() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <ShipForMePage />
        </Suspense>
    );
}
