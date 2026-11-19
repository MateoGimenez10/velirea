# VELIREA

Página de inicio de un emprendimiento de ropa femenina, con diseño responsive, navegación móvil y botón de contacto visible.

## Archivos

- `index.html`: página principal.
- `page.css`: estilos propios de VELIREA.
- `catalog/`: catálogo por categorías, componentes y fuente de datos de demostración. El contrato para una futura API se explica en [catalog/README.md](catalog/README.md).
- `assets/`: fotografías y sistema de interfaz.
- `fonts/`: tipografías locales y sus licencias OFL.
- `credits.html`: fuentes de las fotografías de referencia.

Es un sitio estático: no requiere instalar dependencias ni ejecutar una compilación. Para publicarlo en un hosting compatible, la carpeta de publicación es la raíz del repositorio.

## Datos pendientes

Las fotografías de Pexels sirven como referencia visual y deben reemplazarse por imágenes del catálogo real de VELIREA. Los créditos y enlaces de origen están en `credits.html`.

El canal de contacto real se agregará más adelante. Actualmente los botones de portada y cabecera llevan al bloque de consultas, y el botón final usa el correo reservado de muestra `hola@velirea.example`. Hay que reemplazarlo antes del lanzamiento comercial.

El dominio propio y la URL absoluta de la imagen para compartir también se configurarán al elegir hosting. El sitio funciona sin conexión con ChatGPT Sites.

## Revisión

El diseño fue revisado en anchos de 1440, 1024, 820, 768, 390 y 320 píxeles. Las fotografías tienen texto alternativo, el menú admite teclado y las animaciones respetan la preferencia de movimiento reducido.

Las tipografías Bricolage Grotesque y Figtree incluyen sus licencias en `fonts/`. El sistema de interfaz proviene de la skill design-taste-frontend y se conserva sin modificaciones.
