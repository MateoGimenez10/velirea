// DEMONSTRATION ONLY. These names, prices, sizes and statuses are fictional.
// They are not VELIREA's inventory. Replace this source when an API is available.
export const demoCatalog = {
  schemaVersion: 1,
  isDemo: true,
  categories: [
    { id: 'cat-pantalones', slug: 'pantalones', name: 'Pantalones', sortOrder: 10, isVisible: true },
    { id: 'cat-remeras', slug: 'remeras', name: 'Remeras', sortOrder: 20, isVisible: true },
    { id: 'cat-shorts', slug: 'shorts', name: 'Shorts', sortOrder: 30, isVisible: true },
    { id: 'cat-polleras', slug: 'polleras', name: 'Polleras', sortOrder: 40, isVisible: true },
    { id: 'cat-vestidos', slug: 'vestidos', name: 'Vestidos', sortOrder: 50, isVisible: true },
    { id: 'cat-blusas', slug: 'blusas', name: 'Blusas', sortOrder: 60, isVisible: true },
    { id: 'cat-accesorios', slug: 'accesorios', name: 'Accesorios', sortOrder: 70, isVisible: true },
  ],
  products: [
    {
      id: 'demo-jean-recto', categoryId: 'cat-pantalones', name: 'Jean recto azul',
      priceCents: 4890000, currency: 'ARS', sizes: ['36', '38', '40', '42'],
      status: 'available', isVisible: true, isDemo: true, sortOrder: 10,
      images: [{ src: 'assets/img/catalog/jean-recto.jpg', alt: 'Jean azul de tiro alto y corte recto', width: 800, height: 1200 }],
    },
    {
      id: 'demo-pantalon-beige', categoryId: 'cat-pantalones', name: 'Pantalón sastrero beige',
      priceCents: 4250000, currency: 'ARS', sizes: ['S', 'M', 'L'],
      status: 'sold_out', isVisible: true, isDemo: true, sortOrder: 20,
      images: [{ src: 'assets/img/catalog/pantalon-beige.jpg', alt: 'Pantalón de vestir beige con cintura alta', width: 800, height: 1200 }],
    },
    {
      id: 'demo-remera-blanca', categoryId: 'cat-remeras', name: 'Remera básica blanca',
      priceCents: 1850000, currency: 'ARS', sizes: ['S', 'M', 'L', 'XL'],
      status: 'available', isVisible: true, isDemo: true, sortOrder: 10,
      images: [{ src: 'assets/img/catalog/remera-blanca.jpg', alt: 'Remera blanca de mangas cortas y cuello redondo', width: 800, height: 1067 }],
    },
    {
      id: 'demo-short-denim', categoryId: 'cat-shorts', name: 'Short de jean azul',
      priceCents: 2790000, currency: 'ARS', sizes: ['36', '38', '40'],
      status: 'available', isVisible: true, isDemo: true, sortOrder: 10,
      images: [{ src: 'assets/img/catalog/short-denim.jpg', alt: 'Short de jean azul en una fotografía de moda', width: 800, height: 1200 }],
    },
    {
      id: 'demo-blusa-blanca', categoryId: 'cat-blusas', name: 'Blusa blanca de mangas amplias',
      priceCents: 3590000, currency: 'ARS', sizes: ['S', 'M', 'L'],
      status: 'available', isVisible: true, isDemo: true, sortOrder: 10,
      images: [{ src: 'assets/img/catalog/blusa-blanca.jpg', alt: 'Blusa blanca con mangas amplias', width: 800, height: 1000 }],
    },
  ],
};
