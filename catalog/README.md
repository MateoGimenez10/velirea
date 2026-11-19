# Catálogo

La tienda carga GET /api/shop/catalog con las categorías y prendas visibles. El panel en /admin/ lee y guarda una versión completa del catálogo con sesión de la dueña. Cada guardado compara la revisión y usa una escritura condicional para detectar ediciones simultáneas.

Una categoría tiene identificador estable, nombre, slug, orden y visibilidad. Renombrarla conserva los enlaces existentes. Las prendas guardan categoría, nombre, descripción, precio entero en centavos ARS, talles, estado manual, visibilidad y una lista de fotos. Una prenda agotada puede seguir publicada.

Las fotos se convierten a JPEG en el navegador, con hasta 1600 píxeles de lado mayor. La primera es la portada. La función valida las imágenes y sus dimensiones, las guarda en Netlify Blobs y comprueba la visibilidad antes de entregarlas. Quitar una foto o eliminar una prenda retira su referencia del catálogo. Los objetos de imagen que quedan sin referencias permanecen privados en el almacén.

El panel conserva la edición en memoria hasta pulsar Guardar. La confirmación de guardado aparece después de recibir la respuesta del servidor. Si otra sesión cambió el catálogo hay que recargar y volver a aplicar la edición.
