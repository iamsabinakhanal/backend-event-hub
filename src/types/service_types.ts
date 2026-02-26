export type ServiceIdParams = {
  id: string;
};

export type ServiceCategoryParams = {
  category: string;
};

export type ServiceCreateBody = {
  name?: string;
  description?: string;
  price?: number | string;
  category?: string;
  duration?: number | string;
  image_url?: string;
  features?: string[] | string;
};

export type ServiceUpdateBody = {
  name?: string;
  description?: string;
  price?: number | string;
  category?: string;
  duration?: number | string;
  image_url?: string;
  features?: string[] | string;
};

export type ServiceSearchQuery = {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  category?: string;
};
