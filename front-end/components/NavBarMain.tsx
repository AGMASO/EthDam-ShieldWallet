"use client";

import { Bell, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
export default function NavBarMain() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    // Fade in effect on initial load
    const fadeInTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Sticky effect on scroll
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => {
      clearTimeout(fadeInTimeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Spacer div to prevent content from being hidden under the navbar */}
      <div className='h-16'></div>

      <header
        className={`
          fixed top-0 left-0 right-0 w-full
          flex items-center justify-between p-4
          transition-all duration-500 ease-in-out z-30
          ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }
          ${
            isSticky
              ? "bg-white/95 backdrop-blur-sm shadow-md z-50"
              : "bg-white border-b border-gray-100"
          }
        `}
      >
        <div className='flex flex-row items-center'>
          <Link
            href='/'
            className='flex items-center relative z-40 cursor-pointer'
          >
            <Image
              src='/shieldLogo.png'
              alt='Shield Logo'
              width={40}
              height={40}
              priority
            />
            <div className='flex items-center'>
              <span className='text-xl pl-1 font-light text-[#1184B6] font-montserrat'>
                Shield
              </span>
              <span className='text-xl font-bold text-[#1184B6] font-montserrat'>
                Wallet
              </span>
            </div>
          </Link>
        </div>
        <div className='flex items-center gap-4'>
          <Bell className='w-5 h-5 text-gray-500' />
          <ConnectButton />
        </div>
      </header>
    </>
  );
}
