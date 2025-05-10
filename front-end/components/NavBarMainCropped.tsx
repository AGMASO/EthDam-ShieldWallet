"use client";

import { Bell, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
export default function NavBarMainCropped() {
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
      <div className='h-20'></div>

      <header
        className={`
          fixed top-0 left-0 right-0 w-full
          transition-all duration-500 ease-in-out
          ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }
          px-4 py-2 z-50
        `}
      >
        <div
          className={`
            mx-auto max-w-4xl rounded-full px-6 py-3
            flex items-center justify-between
            ${
              isSticky
                ? "bg-[#1184B6]/60 backdrop-blur-sm shadow-lg"
                : "bg-[#1184B6]/80 "
            }
          `}
        >
          <div className='flex items-center'>
            <Image
              src='/shieldLogo.png'
              alt='Shield Logo'
              width={40}
              height={40}
            />
            <div className='flex items-center'>
              <span className='text-xl pl-1 font-extralight text-white font-montserrat'>
                Shield
              </span>
              <span className='text-xl font-bold text-white font-montserrat'>
                Wallet
              </span>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <Bell className='w-5 h-5 text-white/80' />
            <ConnectButton />
          </div>
        </div>
      </header>
    </>
  );
}
