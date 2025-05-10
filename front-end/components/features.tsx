import { Shield, Lock, Wallet } from "lucide-react";
import React from "react";

const Features = () => {
  return (
    <main className='container mx-auto flex-1 flex flex-col items-center justify-center text-center px-4 py-20'>
      <div className='flex flex-col items-center justify-center'>
        <h2 className='text-4xl font-bold text-white'>
          A simple extreme secure wallet
        </h2>
        <p className='text-gray-300 text-center text-xl max-w-2xl pt-4'>
          Robust and optimized for high-net-worth individuals — built for
          simplicity, hardened for security.
        </p>
      </div>
      <div className='mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl'>
        <div className='bg-[#003856]/80 backdrop-blur-sm p-6 rounded-xl border border-[#1184B6]/20 flex flex-col items-center hover:bg-[#003856]/90 transition-colors duration-300'>
          <div className='h-12 w-12 rounded-full bg-[#1184B6]/20 flex items-center justify-center mb-4'>
            <Shield className='h-6 w-6 text-[#1184B6]' />
          </div>
          <h3 className='text-xl font-semibold text-white'>Secure Storage</h3>
          <p className='mt-2 text-gray-300 text-center'>
            Industry-leading security protocols to keep your assets safe
          </p>
        </div>
        <div className='bg-[#003856]/80 backdrop-blur-sm p-6 rounded-xl border border-[#1184B6]/20 flex flex-col items-center hover:bg-[#003856]/90 transition-colors duration-300'>
          <div className='h-12 w-12 rounded-full bg-[#1184B6]/20 flex items-center justify-center mb-4'>
            <Lock className='h-6 w-6 text-[#1184B6]' />
          </div>
          <h3 className='text-xl font-semibold text-white'>Multi-Signature</h3>
          <p className='mt-2 text-gray-300 text-center'>
            Require multiple approvals for enhanced transaction security
          </p>
        </div>
        <div className='bg-[#003856]/80 backdrop-blur-sm p-6 rounded-xl border border-[#1184B6]/20 flex flex-col items-center hover:bg-[#003856]/90 transition-colors duration-300'>
          <div className='h-12 w-12 rounded-full bg-[#1184B6]/20 flex items-center justify-center mb-4'>
            <Wallet className='h-6 w-6 text-[#1184B6]' />
          </div>
          <h3 className='text-xl font-semibold text-white'>Asset Management</h3>
          <p className='mt-2 text-gray-300 text-center'>
            Easily manage all your digital assets in one secure place
          </p>
        </div>
      </div>
    </main>
  );
};

export default Features;
