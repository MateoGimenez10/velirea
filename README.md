# VELIREA

El sitio público y el panel de la dueña se publican juntos desde la rama main en el proyecto velirea de Netlify. El catálogo comienza con las siete categorías de la tienda. Las prendas se cargan desde el panel.

## Configurar el acceso

1. En Netlify, abrí el proyecto velirea y entrá en Project configuration → Environment variables.
2. Agregá VELIREA_OWNER_PASSWORD como variable secreta del contexto Production. Elegí una contraseña única de al menos 20 caracteres con un gestor de contraseñas. El alcance debe incluir Functions.
3. En Deploys, ejecutá Trigger deploy → Deploy project. Esperá el estado Published.
4. Abrí https://velirea.netlify.app/admin/ e ingresá la contraseña. Desde allí podés cargar prendas, fotos y categorías.

Para cambiar o recuperar el acceso, reemplazá el valor de la variable y volvé a desplegar. La sesión dura ocho horas. Cerrar sesión la invalida en el servidor. La dueña debe conservar el acceso a su cuenta de Netlify.

## Publicación y almacenamiento

Netlify lee netlify.toml, instala las dependencias, ejecuta npm run build, publica dist y despliega netlify/functions/shop.mjs. La función lee la contraseña en ejecución. El directorio público contiene el sitio y el formulario de ingreso.

Los datos se guardan en el almacén persistente del sitio velirea-shop-v1. Netlify proporciona las credenciales de acceso al almacén a la función. Volver a publicar el mismo proyecto conserva los datos. Eliminar el proyecto o el almacén elimina su acceso. El consumo está sujeto al plan de Netlify. Consultá el [almacenamiento de Netlify](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) y la [configuración de variables](https://docs.netlify.com/build/functions/environment-variables/).

El correo de contacto de la portada sigue pendiente de configuración. Las fotografías editoriales y sus créditos están en credits.html.

## Desarrollo

Con Node 22 o superior, ejecutá npm ci, npm test y npm run build. Las pruebas de integración usan el servidor local de archivos de Netlify Blobs. Para desarrollar en el navegador con funciones y almacenamiento locales, usá Netlify Dev desde la raíz. Configurá una contraseña de desarrollo en el entorno local. El contrato del catálogo está en [catalog/README.md](catalog/README.md).
