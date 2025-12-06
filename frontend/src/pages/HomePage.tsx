import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  Shield,
  RotateCcw,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchProducts, fetchCategories } from '@/store/slices/productsSlice';
import { Button, Card, Skeleton } from '@/components/common';
import { ProductGrid, QuickViewModal } from '@/components/products';
import { ROUTES } from '@/utils/constants';
import type { Product } from '@/types';

const heroSlides = [
  {
    title: 'New Season Arrivals',
    subtitle: 'Check out all the new trends',
    cta: 'Shop Now',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    bgColor: 'from-blue-600 to-purple-600',
  },
  {
    title: 'Summer Sale',
    subtitle: 'Up to 50% off on selected items',
    cta: 'Shop Sale',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
    bgColor: 'from-orange-500 to-pink-500',
  },
  {
    title: 'Premium Quality',
    subtitle: 'Discover our exclusive collection',
    cta: 'Explore',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
    bgColor: 'from-green-500 to-teal-500',
  },
];

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $50',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure transactions',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated support team',
  },
];

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: products, categories, isLoading } = useAppSelector(
    (state) => state.products
  );

  // Ensure categories is always an array
  const categoriesList = Array.isArray(categories) ? categories : [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden rounded-2xl">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor} opacity-90`}
            />
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            />
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-xl text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 opacity-90">
                    {slide.subtitle}
                  </p>
                  <Link to={ROUTES.PRODUCTS}>
                    <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                      {slide.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <feature.icon className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
          </Card>
        ))}
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="text-gray-500 mt-1">
              Browse our wide selection of products
            </p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))
            : categoriesList.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`${ROUTES.PRODUCTS}?category=${category._id}`}
                  className="group text-center"
                >
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 group-hover:ring-2 ring-primary-500 transition-all">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
                        <span className="text-4xl font-bold text-primary-600">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <p className="text-gray-500 mt-1">
              Hand-picked just for you
            </p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ProductGrid
          products={products}
          isLoading={isLoading}
          columns={4}
          onQuickView={setQuickViewProduct}
        />
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Subscribe to Our Newsletter
        </h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">
          Get the latest updates on new products and upcoming sales directly in your inbox.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <Button className="bg-white text-primary-600 hover:bg-gray-100">
            Subscribe
          </Button>
        </form>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default HomePage;
