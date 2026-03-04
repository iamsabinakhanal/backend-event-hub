export type GalleryIdParams = {
  id: string;
};

export type GalleryCategoryParams = {
  category: string;
};

export type GalleryCreateBody = {
  title?: string;
  description?: string;
  category?: string;
  image_url?: string;
};

export type GalleryUpdateBody = {
  title?: string;
  description?: string;
  category?: string;
  image_url?: string;
};
