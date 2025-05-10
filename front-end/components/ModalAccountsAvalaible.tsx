import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Copy, Loader2 } from "lucide-react";
import SafeApiKit from "@safe-global/api-kit";
import type { SafeInfoResponse } from "@safe-global/api-kit";
import { useAccount } from "wagmi";
import { AlertDialog } from "./ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";

interface ModalAccountsAvailableProps {
  isOpen: boolean;
  onClose: () => void;
  safes: any[]; // Now expects an array of MultisigWallet objects
}

const ModalAccountsAvalaible: React.FC<ModalAccountsAvailableProps> = ({
  isOpen,
  onClose,
  safes,
}) => {
  const { address, chain } = useAccount();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied!",
      description: "The address has been copied to your clipboard.",
      duration: 2000,
    });
  };

  return (
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='sm:max-w-[80vw] sm:h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-md'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>
              Your ShieldWallet Accounts
            </DialogTitle>
          </DialogHeader>

          <div className='py-6'>
            <h2 className='text-lg font-medium mb-6'>
              Select an account to access
            </h2>

            {safes.length === 0 ? (
              <div className='text-center py-12 bg-gray-50 rounded-xl'>
                <p className='text-gray-500'>No ShieldWallet accounts found</p>
                <p className='text-sm text-gray-400 mt-2'>
                  Create a new ShieldWallet account to get started
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {safes.map((safe, index) => (
                  <div
                    key={safe.addressWallet}
                    className='border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300'
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                        <Image
                          src='/shieldLogo2.png'
                          alt='Shield Logo'
                          width={20}
                          height={20}
                          className='rounded-full'
                        />

                        <div>
                          <h3 className='font-medium'>
                            {safe.accountName || "No account name found"}
                          </h3>
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => copyToClipboard(safe.addressWallet)}
                        title='Copy address'
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>

                    <div className='mb-4'>
                      <div className='bg-gray-100 p-3 rounded-lg break-all'>
                        <code className='text-xs'>
                          Address: {safe.addressWallet}
                        </code>
                      </div>
                    </div>

                    <div className='space-y-1 mb-4'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-gray-500'>Owners:</span>
                        <span className='font-medium'>
                          {safe.signers?.length || "Not Found"}
                        </span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-gray-500'>Threshold:</span>
                        <span className='font-medium'>{safe.threshold}</span>
                      </div>

                      <div className='flex justify-between text-xs'>
                        <span className='text-gray-500'>Network:</span>
                        <span className='font-medium'>
                          {safe.selectedNetwork?.name || "-"}
                        </span>
                      </div>
                    </div>

                    <div className='flex justify-end'>
                      <Link href={`/home/${safe.addressWallet}`}>
                        <Button
                          variant='outline'
                          className='gap-2 hover:bg-black hover:text-white transition-colors'
                        >
                          Open ShieldWallet
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className='border-t pt-4 '>
            <Button
              className='bg-gradient-to-r from-gradient-2-start to-gradient-2-end text-white hover:bg-gradient-1-end hover:scale-105 transition-all duration-300 ease-in-out'
              onClick={onClose}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModalAccountsAvalaible;
