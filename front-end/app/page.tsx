"use client";

import GetStartedSection from "@/components/get-started-section";
import { useAccount, useChainId } from "wagmi";
import HeroComponent from "@/components/HeroComp";
import Image from "next/image";
import NavBarMainCropped from "@/components/NavBarMainCropped";
import { useEffect, useState } from "react";
import Features from "@/components/features";
import CodersComp from "@/components/coders-comp";

export default function Home() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(0);

  useEffect(() => {
    // Initialize scroll position and image opacity on component mount
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);

      // Calculate opacity based on scroll position
      // Start fading in immediately with the first scroll, reach full opacity at 300px
      const scrollThreshold = 50; // When to start showing the image
      const fadeDistance = 300; // Distance over which to fade to full opacity

      if (position < scrollThreshold) {
        setImageOpacity(0);
      } else {
        const newOpacity = Math.min(
          (position - scrollThreshold) / fadeDistance,
          1
        );
        setImageOpacity(newOpacity);
      }
    };

    // Call once to set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate subtle scale/translation effects based on scroll
  const scale = 1 + imageOpacity * 0.05; // Subtle zoom from 1.0 to 1.05
  const translateY = (1 - imageOpacity) * -10; // Move up from -10px to 0px

  return (
    <div className='flex flex-col min-h-screen relative'>
      {/* Background elements */}
      <div className='fixed inset-0 z-0'>
        {/* Initial solid color background */}
        <div className='absolute inset-0 bg-gradient-to-b from-slate-900 to-black' />

        {/* Background image that fades in on scroll */}
        <div
          style={{
            opacity: imageOpacity,
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
            transform: `scale(${scale}) translateY(${translateY}px)`,
            transformOrigin: "center center",
          }}
          className='absolute inset-0'
        >
          <Image
            src='/safe-wallet-background.png'
            alt='Safe Wallet background'
            fill
            className='object-cover'
            priority
          />
        </div>

        {/* Overlay that stays consistent but adjusts with image opacity */}
        <div className='absolute inset-0 bg-black/50' />
      </div>

      {/* Content - all wrapped with relative z-10 to sit above the background */}
      <div className='relative z-10 flex flex-col min-h-screen'>
        <NavBarMainCropped />

        {isDisconnected && (
          <main className='flex-1 flex flex-col'>
            <HeroComponent />
            <Features />

            <CodersComp />
          </main>
        )}

        {isConnected && (
          <main className='flex-1 flex flex-row justify-center items-center'>
            <GetStartedSection />
          </main>
        )}
      </div>
    </div>
  );
}
