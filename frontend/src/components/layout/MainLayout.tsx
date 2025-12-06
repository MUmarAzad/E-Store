import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { CartSidebar } from '@/components/cart';
import { ToastContainer } from '@/components/common';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <Outlet />
      </main>
      <Footer />
      <CartSidebar />
      <ToastContainer />
    </div>
  );
};

export default MainLayout;
