'use client';

export const usePrint = () => {
  const printOrder = (order: any, type: 'comanda' | 'ticket' | 'factura') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsContent = order.items?.map((item: any) => `
      <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 5px; border-bottom: 1px dashed #eee; padding-bottom: 2px; padding-right: 15px;">
        <span style="flex: 1; padding-right: 2px; word-break: break-word;">${item.quantity}x ${item.name || item.product?.name || 'Producto'}</span>
        <span style="width: auto; text-align: right; flex-shrink: 0;">$${(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
      </div>
    `).join('') || '';

    const business = order.business || {};

    const content = `
      <html>
        <head>
          <title>Imprimir ${type.toUpperCase()}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { 
              width: 46mm; 
              font-family: 'Courier New', Courier, monospace; 
              padding: 0; 
              margin: 0 auto;
              color: black;
              line-height: 1.2;
              font-size: 12px;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header-info { font-size: 12px; margin-bottom: 5px; word-break: break-word; }
            .business-name { font-size: 18px; margin-bottom: 2px; text-transform: uppercase; font-weight: bold; letter-spacing: -1px; }
            .divider { border-top: 1px dashed black; margin: 8px 0; }
            .footer { font-size: 12px; margin-top: 15px; border-top: 1px solid black; padding-top: 5px; }
            .item-list { margin: 10px 0; }
            .total-row { font-size: 18px; margin-top: 5px; border-top: 1px solid black; padding-top: 5px; }
            .afip-box { 
                border: 1px solid black; 
                padding: 5px; 
                margin-top: 10px; 
                font-size: 12px;
                text-align: left;
            }
            .invoice-type {
                border: 2px solid black;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                margin: 0 auto 5px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center">
            ${type === 'factura' ? `
                <div class="invoice-type bold">${order.afipInvoiceType === 1 || order.afipInvoiceType === 6 ? 'B' : 'C'}</div>
                <div class="bold" style="font-size: 14px;">ORIGINAL</div>
            ` : ''}
            <div class="bold business-name">${business.name || 'GURU RESTO'}</div>
            <div class="header-info">
                ${business.address ? `<b>Dir:</b> ${business.address}<br>` : ''}
                ${business.phone ? `<b>Tel:</b> ${business.phone}<br>` : ''}
                ${business.afipCuit ? `<b>CUIT:</b> ${business.afipCuit}` : ''}
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
            ${order.customer?.address ? `<span class="bold">Dir:</span> ${order.customer.address}<br>` : ''}
          </div>

          <div class="divider"></div>
          
          <div class="bold" style="font-size: 16px; margin-bottom: 5px; text-decoration: underline;">DETALLE</div>
          <div class="item-list">
            ${itemsContent}
          </div>

          <div class="divider"></div>

          <div class="total-row">
            <span class="bold">TOTAL: $${Math.round(parseFloat(order.total))}</span>
          </div>
          <div class="header-info" style="font-size: 12px;">
            Cond. de Venta: ${order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta/Transferencia'}
          </div>

          ${type === 'factura' && order.afipCae ? `
            <div class="afip-box">
                <div class="bold">CAE: ${order.afipCae}</div>
                <div class="bold">Vto. CAE: ${new Date(order.afipCaeExpiration).toLocaleDateString('es-AR')}</div>
                <div style="margin-top: 5px; font-style: italic; font-size: 10px;">
                    Comprobante autorizado por AFIP
                </div>
            </div>
          ` : ''}

          <div class="footer center">
            ${type === 'comanda' ? '<b>--- FIN DE COMANDA ---</b>' : '<b>¡Gracias por elegirnos!</b>'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return { printOrder };
};

