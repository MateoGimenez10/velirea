# Catálogo de VELIREA

La portada, la paleta y los estilos globales se conservan. El catálogo usa CSS propio y los mismos tokens de color, espaciado, fuentes, radios y movimiento del sitio.

## Organización

- `data/demo.js`: categorías y productos ficticios, claramente marcados como demostración. No representa el inventario de VELIREA.
- `repository.js`: única entrada de datos asíncrona. Hoy lee el archivo de demostración; más adelante puede consultar una API sin cambiar los componentes.
- `model.js`: validación del contrato, formato de precios, rutas y filtros de visibilidad.
- `components/product-card.js`: tarjeta de presentación; crea nodos y texto sin insertar HTML procedente de los datos.
- `catalog.js`: navegación, estado en la URL, selección de categoría, carga, errores y estados vacíos.
- `catalog.css`: estilos limitados al catálogo y su menú.

## Contrato de datos

El resultado de `loadCatalog()` tiene `schemaVersion: 1`, `isDemo`, `categories` y `products`.

Una categoría tiene `id` estable, `slug` único, `name`, `sortOrder` e `isVisible`. Los enlaces y filtros se generan a partir de estos registros: agregar una categoría no requiere editar el HTML ni las tarjetas.

Una prenda tiene `id` estable, `categoryId`, `name`, `priceCents`, `currency: "ARS"`, `sizes`, `status`, `isVisible`, `sortOrder`, `isDemo` e `images`. Cada imagen lleva `src`, `alt`, `width` y `height`. Los precios son enteros en centavos para evitar errores de redondeo. Se muestran en pesos argentinos.

`status` admite `available` y `sold_out`; la presentación muestra Disponible o Agotado. Agotado no equivale a oculto: una prenda agotada se sigue mostrando. Con `isVisible: false`, la prenda no aparece. Si se oculta una categoría, tampoco aparecen sus prendas ni sus enlaces. La ordenación usa `sortOrder` y un identificador estable.

## Navegación y accesibilidad

Las categorías tienen enlaces como `#coleccion/pantalones`, con soporte para abrir enlaces directos y usar Atrás/Adelante. Los controles son enlaces reales, y el desplegable de Colección usa el elemento nativo `details`. Escape cierra el desplegable. Al elegir desde el menú, el foco pasa al encabezado de los resultados. Un estado anunciado informa de la categoría y la cantidad de prendas.

Las prendas cambian al instante: no hay animación de navegación ni movimiento de precios y talles. El feedback de los filtros usa los tokens existentes de 150 ms, solo para puntero preciso; se desactiva con movimiento reducido y al enfocar con teclado.

## Alcance

No hay carrito, compras, panel, usuarios, inicio de sesión, API, cookies de catálogo, localStorage ni persistencia. El estado de navegación solo está en la URL. No se añadió un servicio de almacenamiento. Cuando exista el panel privado, su API deberá devolver este contrato y encargarse por separado de autorización, edición y persistencia.

Polleras, Vestidos y Accesorios están vacíos deliberadamente para visualizar el estado sin productos.

## Fotografías de demostración

Fotografías descargadas de Pexels y alojadas localmente. No son prendas de VELIREA:

- Jean: https://www.pexels.com/photo/woman-in-jeans-and-white-t-shirt-17515363/
- Pantalón beige: https://www.pexels.com/photo/woman-in-beige-pants-14346033/
- Remera blanca: https://www.pexels.com/photo/a-woman-in-white-shirt-and-denim-jeans-10956683/
- Short: https://www.pexels.com/photo/photograph-of-a-woman-in-denim-shorts-14567135/
- Blusa: https://www.pexels.com/photo/a-woman-wearing-a-white-blouse-with-puffed-sleeves-7736226/

La sección del catálogo usa altura natural para que al agregar prendas no se superpongan ni se recorten. Esto responde al catálogo dinámico solicitado, en vez del ritmo de pantallas fijas de las secciones de presentación anteriores.
