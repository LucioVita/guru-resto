'use client';

export const usePrint = () => {
    const printOrder = (order: any, type: 'comanda' | 'ticket') => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const itemsContent = order.items?.map((item: any) => `
      <div style="display: flex; justify-between: space-between; font-size: 14px; margin-bottom: 2px;">
        <span>${item.quantity}x ${item.product?.name}</span>
        <span>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
      </div>
    `).join('') || '';

        const content = `
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 80mm; 
              font-family: 'Courier New', Courier, monospace; 
              padding: 5mm; 
              margin: 0;
              color: black;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { font-size: 18px; margin-bottom: 10px; }
            .divider { border-top: 1px dashed black; margin: 10px 0; }
            .footer { font-size: 12px; margin-top: 20px; }
            .item-list { margin: 10px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center bold header">
            ${type === 'comanda' ? 'COCINA - COMANDA' : 'GURU-RESTO'}
          </div>
          <div class="center">
            ${type === 'ticket' ? '¡Gracias por su compra!' : ''}
          </div>
          <div class="divider"></div>
          <div>
            <span class="bold">Orden:</span> #${order.id.slice(-4)}<br>
            <span class="bold">Fecha:</span> ${new Date(order.createdAt).toLocaleString()}<br>
            <span class="bold">Cliente:</span> ${order.customer?.name || 'Mostrador'}
          </div>
          <div class="divider"></div>
          <div class="item-list">
            ${itemsContent}
          </div>
          <div class="divider"></div>
          ${type === 'ticket' ? `
            <div style="text-align: right; font-size: 18px;" class="bold">
              TOTAL: $${order.total}
            </div>
          ` : ''}
          <div class="footer center">
            ${type === 'comanda' ? '--- FIN DE COMANDA ---' : 'Siga su pedido en Guru-Resto'}
          </div>
        </body>
      </html>
    `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    return { printOrder };
};
