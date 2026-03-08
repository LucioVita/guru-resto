# Guía de Configuración: Ubicación y Costos de Envío

Esta guía explica cómo configurar las zonas de entrega y los costos de envío automáticos para tu aplicación Guru Resto.

## 1. Crear las Zonas de Entrega (GeoJSON)

Utilizamos [geojson.io](https://geojson.io) para definir geográficamente las áreas de delivery.

1.  Ve a [geojson.io](https://geojson.io).
2.  Busca tu ciudad en el mapa.
3.  Usa la herramienta de **Polígono** (icono de pentágono) para dibujar tu zona de entrega.
   > **¡IMPORTANTE!:** No uses la herramienta de "Línea" (icono de raya). El sistema solo funciona con áreas cerradas (**Polygons**).
4.  **IMPORTANTE (Configurar el precio):**
    *   Una vez dibujado el polígono, haz clic **sobre el área del polígono** en el mapa.
    *   Se abrirá un cuadro blanco (pop-up). Haz clic en **"add row"**.
    *   En la columna de la izquierda escribe: `price`.
    *   En la columna de la derecha escribe el valor del envío (ejemplo: `500`).
    *   Si no ves el cuadro, intenta hacer clic justo en el centro del área que dibujaste.
5.  Repite el proceso si tienes diferentes zonas con diferentes precios.
6.  En el panel derecho de geojson.io, verás una pestaña llamada **"JSON"**. Copia todo ese contenido.

## 2. Guardar en Guru Resto

1.  Inicia sesión en tu panel de Guru Resto.
2.  Ve a la sección **Facturación** (o Ajustes si eres Super Admin).
3.  Busca el recuadro **Delivery & Zones**.
4.  Pega el contenido JSON que copiaste de geojson.io.
5.  Haz clic en **Save Changes**.

## 3. Integración con n8n y EvolutionAPI

Para que el sistema calcule el envío automáticamente, tu flujo de n8n debe enviar las coordenadas del cliente al endpoint de pedidos (`/api/orders`).

### Formato esperado del JSON en n8n:

Cuando el cliente comparte su ubicación por WhatsApp, EvolutionAPI te entrega la latitud y longitud. Debes incluirlas así en tu petición POST:

```json
{
  "customer": {
    "name": "Nombre Cliente",
    "phone": "5491112345678",
    "address": "Calle Falsa 123",
    "lat": -33.67809, 
    "lng": -65.46028
  },
  "items": [
    { "name": "Pizza Muzza", "quantity": 1, "price": 8000 }
  ],
  "total": 8000,
  "source": "whatsapp"
}
```

### ¿Qué hace el sistema automáticamente?

1.  **Valida la ubicación**: Comprueba si el punto (`lat`, `lng`) cae dentro de alguno de tus polígonos.
2.  **Aplica el costo**: Si está dentro, extrae el `price` que definiste en el GeoJSON.
3.  **Actualiza el total**: Suma el costo de envío al total del pedido.
4.  **Responde a n8n**: La API devuelve el `shippingCost` calculado para que puedas informárselo al cliente por WhatsApp.

---
*Nota: Si las coordenadas están fuera de todas tus zonas definidas, el `shipping_cost` será 0 por defecto, pero el sistema registrará la ubicación del cliente de todas formas.*
