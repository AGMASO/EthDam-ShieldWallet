"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SafeApiKit from "@safe-global/api-kit";
import ModalAccountsAvalaible from "./ModalAccountsAvalaible";

// Use the type directly from the API response

export default function GetStartedSection() {
  const { address, isConnected, isConnecting, isDisconnected, chain } =
    useAccount();
  const [safes, setSafes] = useState<string[]>([]);
  const [openModalAccounts, setOpenModalAccounts] = useState(false);

  useEffect(() => {
    //!APi de Safe
    // const getSafesOfClient = async () => {
    //   if (!chain?.id || !address) {
    //     console.log("Error: No chainId detected");
    //     return;
    //   }

    //   try {
    //     const apiKit = new SafeApiKit({
    //       chainId: BigInt(chain?.id),
    //     });

    //     const response = await apiKit.getSafesByOwner(address);
    //     console.log("safes from client", response);
    //     setSafes(response.safes);
    //   } catch (error) {
    //     console.error("Error fetching safes:", error);
    //   }
    // };

    // getSafesOfClient();

    //!My API
    const getSafesOfClient = async () => {
      const response = await fetch(
        `/api/shieldwallet/?address=${address?.toLowerCase()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch safes");
      }
      const data = await response.json();
      console.log("safes from client", data);
      setSafes(data.multisigWallet);
    };

    getSafesOfClient();
  }, [address, chain?.id]);

  const handleOpenModalAccounts = () => {
    setOpenModalAccounts(true);
  };

  const handleCloseModalAccounts = () => {
    setOpenModalAccounts(false);
  };

  return (
    <div className='flex flex-col items-center justify-center p-12 bg-gradient-to-r from-[#1184B6] to-gradient-1-end h-fit min-h-[60vh] min-w-[60vw] rounded-xl transition-all duration-1000 ease-in-out'>
      <div className='flex flex-col items-center max-w-md'>
        {isConnected && safes.length > 0 && (
          <>
            <h2 className='text-2xl font-bold mb-4 text-center font-montserrat-light'>
              Welcome Back
            </h2>
            <p className='text-center mb-6 font-montserrat-light text-lg'>
              Open your existing Safe Accounts or create a new one
            </p>
            {/* <div className='bg-green-100 text-green-800 p-4 rounded-md mb-6 text-center'>
              You are already connected
            </div> */}

            <div className='space-y-4 w-full flex flex-col gap-1'>
              <Link href='/new-account' className='w-full'>
                <Button className='w-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-300 ease-in-out'>
                  Create a new account
                </Button>
              </Link>

              <Button
                variant='outline'
                className='w-full border-black text-black hover:bg-gray-100'
                onClick={handleOpenModalAccounts}
              >
                Go to your existing accounts
              </Button>
            </div>
          </>
        )}
        {isConnected && !safes.length && (
          <>
            <h2 className='text-2xl font-bold mb-4 text-center font-montserrat-light'>
              Get Started
            </h2>
            <p className='text-center mb-6 font-montserrat-light text-lg'>
              Create a new ShieldWallet safe
            </p>
            {/* <div className='bg-green-100 text-green-800 p-4 rounded-md mb-6 text-center'>
              You are already connected
            </div> */}

            <div className='space-y-4 w-full flex flex-col gap-1'>
              <Link href='/new-account' className='w-full'>
                <Button className='w-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-300 ease-in-out'>
                  Create a new account
                </Button>
              </Link>
            </div>
          </>
        )}
        {!isConnected && (
          <>
            <p className='text-center mb-6'>
              Connect your wallet to create a new Safe Account or open an
              existing one
            </p>
            <ConnectButton />
          </>
        )}
        <ModalAccountsAvalaible
          isOpen={openModalAccounts}
          onClose={handleCloseModalAccounts}
          safes={safes}
        />
      </div>
    </div>
  );
}
