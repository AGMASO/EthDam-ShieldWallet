"use client";
import { WalletSidebar } from "../../../components/wallet-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  Plus,
} from "lucide-react";
import NavBarMain from "@/components/NavBarMain";
import { useParams } from "next/navigation";
//!Dummie page para transactions, quizas eliminar
export default function HomePage() {
  const params = useParams();
  const safeAccount = params.safeAccount as string;
  return (
    <>
      <NavBarMain />
      <SidebarProvider>
        <WalletSidebar activeSafe={safeAccount} />
        <SidebarInset>
          <div className='flex flex-col h-full'>
            <header className='border-b p-6'>
              <h1 className='text-2xl font-bold'>Safe [WALLET]</h1>
              <div className='mt-6'>
                <h2 className='text-sm text-muted-foreground'>
                  Total asset value
                </h2>
                <div className='flex items-baseline mt-1'>
                  <span className='text-4xl font-bold'>0</span>
                  <span className='text-4xl font-bold text-muted-foreground'>
                    ,00 $
                  </span>
                </div>
              </div>
              <div className='flex gap-2 mt-6'>
                <Button variant='outline' className='gap-2'>
                  <ArrowUpRight className='h-4 w-4' />
                  Send
                </Button>
                <Button variant='outline' className='gap-2'>
                  <ArrowDownLeft className='h-4 w-4' />
                  Receive
                </Button>
                <Button variant='outline' className='gap-2'>
                  <RefreshCw className='h-4 w-4' />
                  Swap
                </Button>
              </div>
            </header>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
              <div>
                <h2 className='text-xl font-medium mb-4'>Top assets</h2>
                <div className='border rounded-lg p-6'>
                  <h3 className='text-xl font-medium mb-2'>
                    Add funds to get started
                  </h3>
                  <p className='text-muted-foreground'>
                    Add funds directly from your bank account or copy your
                    address to send tokens from a different account.
                  </p>
                </div>
              </div>

              <div>
                <h2 className='text-xl font-medium mb-4'>
                  Pending transactions
                </h2>
                <div className='border rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]'>
                  <div className='text-muted-foreground mb-4'>
                    <Clock className='h-16 w-16 mx-auto mb-4' />
                  </div>
                  <p className='text-center text-muted-foreground'>
                    This Safe Account has no queued transactions
                  </p>
                </div>
              </div>
            </div>

            <div className='p-6'>
              <h2 className='text-xl font-medium mb-4'>Safe Apps</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='border rounded-lg p-4'>
                  <div className='flex items-start gap-4'>
                    <div className='bg-blue-100 p-2 rounded-lg'>
                      <div className='h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center text-white'>
                        <RefreshCw className='h-6 w-6' />
                      </div>
                    </div>
                    <div>
                      <h3 className='font-medium'>CoW Swap</h3>
                      <p className='text-sm text-muted-foreground mt-1'>
                        CoW Swap finds the lowest prices from all decentralized
                        exchanges and DEX aggregators & saves you more with p2p
                        trading and protection from MEV
                      </p>
                    </div>
                  </div>
                </div>

                <div className='border rounded-lg p-6 flex flex-col items-center justify-center'>
                  <div className='bg-gray-100 rounded-full p-4 mb-4'>
                    <div className='h-12 w-12 flex items-center justify-center'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-10 w-10 rounded-full'
                      >
                        <Plus className='h-6 w-6' />
                      </Button>
                    </div>
                  </div>
                  <Button variant='default'>Explore Safe Apps</Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
