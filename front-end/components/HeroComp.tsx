import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useState, useEffect } from "react";

export default function HeroComponent() {
  const [showButton, setShowButton] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fadeInTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(fadeInTimeout);
  }, []);
  return (
    <div className='min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[70vh] flex flex-col items-center justify-center'>
      <div className='flex justify-center items-center p-5 max-w-6xl mx-auto'>
        <h1 className='text-[6vw] text-center md:text-[65px] leading-tight select-none tracking-tightest font-extrabold'>
          <span
            data-content='Simple to Use.'
            className='relative block before:content-[attr(data-content)] before:w-full before:z-0 before:block before:absolute before:top-0 before:px-2 before:bottom-0 before:left-0 before:text-center before:text-[#050810] before:animate-gradient-background-1'
          >
            <span className='px-2 text-transparent bg-clip-text bg-gradient-to-r from-[#1184B6] to-gradient-1-end animate-gradient-foreground-1'>
              Simple to Use.
            </span>
          </span>
          <span
            data-content='Hard to Abuse.'
            className='relative block before:content-[attr(data-content)] before:w-full before:z-0 before:block before:absolute before:top-0 before:px-2 before:bottom-0 before:left-0 before:text-center before:text-[#050810] before:animate-gradient-background-2'
          >
            <span className='px-2 text-transparent bg-clip-text bg-gradient-to-r from-[#1184B6] to-gradient-2-end animate-gradient-foreground-2'>
              Hard to Abuse.
            </span>
          </span>
          <span
            className='relative block before:content-[attr(data-content)] before:w-full before:z-0 before:block before:absolute before:top-0 before:px-2 before:bottom-0 before:left-0 before:text-center before:text-[#04060c] before:animate-gradient-background-3'
            data-content='Never get Hacked.'
          >
            <span className='px-2 text-transparent bg-clip-text bg-gradient-to-r from-[#1184B6] to-[#D9D9D9] animate-gradient-foreground-3'>
              Never get Hacked.
            </span>
          </span>
        </h1>
      </div>

      <div
        className={`pt-[50px] transition-all duration-1000 ease-in-out
          ${isVisible ? "opacity-100 " : "opacity-0 "}  `}
      >
        <div className='button-glow relative'>
          <ConnectButton label='Launch App' />
          <div className='absolute inset-0 -z-10 rounded-xl blur-[40px] bg-gradient-to-r from-gradient-2-start to-gradient-2-end opacity-100 scale-[1.1]'></div>
        </div>
      </div>
    </div>
  );
}
