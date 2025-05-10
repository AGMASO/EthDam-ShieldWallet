import React from "react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export default function CodersComp() {
  return (
    <div className='flex-col justify-items-center min-h-fit p-6 text-white bg-gradient-to-r from-[#1184B6] to-[#0B5D8A] rounded-md pt-4 shadow-[0_0_15px_rgba(17,132,182,0.5)] hover:shadow-[0_0_20px_rgba(17,132,182,0.7)] transition-shadow duration-300'>
      <div className='flex justify-center mb-8'>
        <p className='text-3xl font-medium'>Creators</p>
      </div>
      <div className='flex flex-row justify-between items-center mt-6'>
        <Link
          className='flex items-center gap-1 hover:text-blue-200 transition-colors pr-[60px]'
          href='https://github.com/agmaso'
          target='_blank'
        >
          <span className='font-montserrat font-light'>AGMASO</span>
          <FaGithub className='text-xl' />
        </Link>
        <Link
          className='flex items-center gap-1 hover:text-blue-200 transition-colors'
          href='https://github.com/GianfrancoBazzani'
          target='_blank'
        >
          <span className='font-montserrat font-light'> GIANFRANCO</span>
          <FaGithub className='text-xl' />
        </Link>
      </div>
    </div>
  );
}
