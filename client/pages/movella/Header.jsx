import React from "react";
import { Logo } from "./Icons";
import "./Hero.css";

const NavLink = ({ href, children }) => (
  <a
    href={href}
    className="text-gray-600 hover:text-green-600 transition-colors px-3 py-2"
  >
    {children}
  </a>
);

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="#" aria-label="Home">
              <Logo className="text-green-600" />
            </a>
          </div>
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink href="#">How It Works</NavLink>
            <NavLink href="#">Showcase</NavLink>
          </nav>
          {/* <div className="flex items-center space-x-2">
            <a
              href="#"
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              Log In
            </a>
            <a
              href="#"
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors"
            >
              Start for Free
            </a>
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
