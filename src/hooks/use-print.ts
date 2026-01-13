'use client';

export const usePrint = () => {
  const printOrder = (order: any, type: 'comanda' | 'ticket' | 'factura') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsContent = order.items?.map((item: any) => `
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
        <span style="flex: 1;">${item.quantity}x ${item.product?.name || 'Producto'}</span>
        <span style="width: 60px; text-align: right;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
      </div>
    `).join('') || '';

    const business = order.business || {};

    const content = `
      <html>
        <head>
          <title>Imprimir ${type.toUpperCase()}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 72mm; 
              font-family: 'Arial', sans-serif; 
              padding: 4mm; 
              margin: 0;
              color: black;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header-info { font-size: 11px; margin-bottom: 5px; }
            .business-name { font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            .divider { border-top: 1px dashed black; margin: 8px 0; }
            .footer { font-size: 10px; margin-top: 15px; }
            .item-list { margin: 10px 0; }
            .total-row { font-size: 16px; margin-top: 5px; }
            .afip-box { 
                border: 1px solid black; 
                padding: 5px; 
                margin-top: 10px; 
                font-size: 10px;
                text-align: left;
            }
            .invoice-type {
                border: 1px solid black;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                margin: 0 auto 5px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center">
            ${type === 'factura' ? `
                <div class="invoice-type bold">${order.afipInvoiceType === 1 || order.afipInvoiceType === 6 ? 'B' : 'C'}</div>
                <div class="bold" style="font-size: 12px;">ORIGINAL</div>
            ` : ''}
            <div class="bold business-name">${business.name || 'GURU RESTO'}</div>
            <div class="header-info">
                ${business.address || ''}<br>
                Tel: ${business.phone || ''}<br>
                ${business.afipCuit ? `CUIT: ${business.afipCuit}` : ''}
            </div>
          </div>

          <div class="divider"></div>

          <div class="header-info">
            <span class="bold">${type === 'factura' ? 'Factura' : 'Comprobante'}:</span> 
            ${type === 'factura' ?
        `${String(order.afipInvoicePuntoVenta || 1).padStart(5, '0')}-${String(order.afipInvoiceNumber || 0).padStart(8, '0')}` :
        `#${order.id.slice(-4)}`
      }<br>
            <span class="bold">Fecha:</span> ${new Date(order.createdAt).toLocaleString('es-AR')}<br>
            <span class="bold">Cliente:</span> ${order.customer?.name || 'Consumidor Final'}<br>
            ${order.customer?.phone ? `<span class="bold">Tel:</span> ${order.customer.phone}<br>` : ''}
          </div>

          <div class="divider"></div>
          
          <div class="bold" style="font-size: 12px; margin-bottom: 5px;">DETALLE</div>
          <div class="item-list">
            ${itemsContent}
          </div>

          <div class="divider"></div>

          <div class="total-row right">
            <span class="bold">TOTAL: $${order.total}</span>
          </div>
          <div class="header-info right">
            Cond. de Venta: ${order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta/Transferencia'}
          </div>

          ${type === 'factura' && order.afipCae ? `
            <div class="afip-box">
                <div class="bold">CAE: ${order.afipCae}</div>
                <div class="bold">Vto. CAE: ${new Date(order.afipCaeExpiration).toLocaleDateString('es-AR')}</div>
                <div style="margin-top: 5px; font-style: italic;">
                    Comprobante autorizado por AFIP
                </div>
            </div>
            <div class="center" style="margin-top: 10px;">
                <div style="font-size: 8px;">QR AFIP</div>
                <div style="border: 1px solid #ccc; width: 40mm; height: 10mm; margin: 0 auto; display: flex; items-center; justify-center; font-size: 8px; color: #999;">
                    [Espacio para QR AFIP]
                </div>
            </div>
          ` : ''}

          <div class="footer center">
            ${type === 'comanda' ? '--- FIN DE COMANDA ---' : '¡Gracias por su visita!'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return { printOrder };
};

