# FOUR DRESS — tienda online

## Archivos
- `index.html`: estructura de la tienda.
- `styles.css`: diseño adaptable, colores y animaciones.
- `app.js`: filtros, productos, carrito y preparación del pedido.
- `products.js`: catálogo editable.
- `assets/`: imágenes y logo.

## Probar en tu computadora
La forma más simple: extraer primero TODO el ZIP y luego abrir `index.html` desde la carpeta extraída `FOUR_DRESS_tienda` en Chrome o Edge. No abrir el HTML desde la vista previa del ZIP.
Para desarrollo, también podés abrir la carpeta en Visual Studio Code y usar Live Server.

## Publicar en Render
1. Subí el contenido de esta carpeta a un repositorio de GitHub.
2. En Render elegí **New +** → **Static Site**.
3. Conectá el repositorio.
4. Build Command: dejar vacío.
5. Publish Directory: `.` (punto).
6. Crear el sitio. Render te va a dar una URL pública.

## Datos pendientes
- Los precios están como “A consultar” hasta que se carguen.
- El pedido se prepara por correo a alanlacombe01@gmail.com.
- Para enviar pedidos directamente por WhatsApp, falta el número comercial.
- Los talles S, M, L y XL son iniciales y se pueden ajustar.
- El stock todavía no está conectado a una base de datos.

## Editar catálogo
Abrí `products.js`. Cada producto tiene:
- `name`: nombre de la prenda.
- `variant`: color o diseño.
- `category`: categoría del filtro.
- `image`: ruta a la foto.
- `price`: precio en pesos (usar un número, por ejemplo 35000). Si queda `null`, se muestra “A consultar”.
- `description`: descripción breve.
