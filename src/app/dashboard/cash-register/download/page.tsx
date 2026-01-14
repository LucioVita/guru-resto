'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';

export default function DownloadPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const data = searchParams.get('data');
    const filename = searchParams.get('filename');

    useEffect(() => {
        if (data && filename) {
            // Auto-download the CSV
            const csvContent = atob(decodeURIComponent(data));
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [data, filename]);

    const handleDownloadAgain = () => {
        if (data && filename) {
            const csvContent = atob(decodeURIComponent(data));
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-16 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        Caja Cerrada Exitosamente
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-gray-700">
                            La caja ha sido cerrada correctamente. El archivo CSV con el resumen de ventas del día se ha descargado automáticamente.
                        </p>
                        <p className="text-sm text-gray-500">
                            Si la descarga no comenzó automáticamente, haz clic en el botón de abajo.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleDownloadAgain} className="gap-2">
                            <Download className="h-4 w-4" />
                            Descargar CSV Nuevamente
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/dashboard/cash-register')}>
                            Volver a Caja
                        </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                        <p className="font-semibold text-blue-900 mb-2">📊 Contenido del CSV:</p>
                        <ul className="text-blue-800 space-y-1 list-disc list-inside">
                            <li>Todos los pedidos del día con detalles completos</li>
                            <li>Información de clientes y métodos de pago</li>
                            <li>Datos de facturación AFIP (CAE, número de factura)</li>
                            <li>Resumen de caja con montos inicial, final y diferencias</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
