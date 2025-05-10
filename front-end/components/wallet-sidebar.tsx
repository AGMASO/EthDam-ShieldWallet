"use client";

import type * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
// import type { SafeInfoResponse } from "@safe-global/api-kit";

// Import our own types instead
interface Network {
  id: string;
  name: string;
  icon?: string;
}

interface Signer {
  id: string;
  name: string;
  address: string;
}

interface ShieldWalletInfo {
  _id?: string;
  accountName: string;
  addressWallet: string;
  selectedNetwork: Network;
  signers: Signer[];
  threshold: number;
  creator: string;
}

import {
  Home,
  Wallet,
  RefreshCw,
  History,
  BookOpen,
  Grid,
  Settings,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WalletAccount {
  id: string;
  name: string;
  owners: number;
  address: string;
  balance: string;
  currency: string;
  isActive?: boolean;
}

function NetworkHeader() {
  const { address, chain } = useAccount();
  return (
    <div className='bg-[#1184B6]/10 dark:bg-[#1184B6]/20 p-2 flex justify-center'>
      <h2 className='text-sm'>{chain?.name}</h2>
    </div>
  );
}

//!me ha creado aqui un hardcoded account, edto habira que cambiarlo
//! dinamicamente
const account: WalletAccount = {
  id: "1",
  name: "trial2",
  owners: 3,
  address: "sep:0xbCb0...71b9",
  balance: "0",
  currency: "$",
  isActive: true,
};

//!Section for the wallet accounts
function WalletHeader() {
  return (
    <SidebarHeader className='border-b pb-0'>
      <NetworkHeader />
      <div className='p-4'>
        <div
          className={`flex items-center justify-between mb-2 p-2 rounded-lg ${
            account.isActive ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
        >
          <div className='flex items-center gap-3'>
            <Avatar className='h-8 w-8 bg-[#1184B6] text-white flex items-center justify-center'>
              <span className='text-base font-medium'>{account.owners}/3</span>
            </Avatar>
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{account.address}</span>
              <span className='text-xs text-muted-foreground'>
                {account.balance} {account.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className='px-4 pb-4'>
        <Link href='/transactions'>
          <Button
            variant='default'
            className='w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
          >
            New transaction
          </Button>
        </Link>
      </div>
    </SidebarHeader>
  );
}

const helpItems = [{ icon: HelpCircle, label: "Need help?", href: "#" }];

export function WalletSidebar({
  activeSafe,
  safeInfo,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeSafe?: string;
  safeInfo?: ShieldWalletInfo | null;
}) {
  const pathname = usePathname();
  const navigationItems = [
    { icon: Home, label: "Home", href: `/home/${activeSafe}` },
  ];

  // Use the activeSafe prop if provided
  const activeAccount = activeSafe
    ? {
        ...account,
        address:
          activeSafe.substring(0, 6) +
          "..." +
          activeSafe.substring(activeSafe.length - 4),
        isActive: true,
      }
    : account;

  // Update WalletHeader to use the activeAccount
  //! No esta funcionando dinamicamente.
  const WalletHeaderWithAccount = () => (
    <SidebarHeader className='border-b pb-0'>
      <NetworkHeader />
      <div className='p-4'>
        <div
          className={`flex items-center justify-between mb-2 p-2 rounded-lg ${
            activeAccount.isActive ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
        >
          <div className='flex items-center gap-3'>
            <Avatar className='h-8 w-8 bg-[#1184B6] text-white flex items-center justify-center'>
              <span className='text-base font-medium'>
                {activeAccount.owners}/3
              </span>
            </Avatar>
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>
                {activeAccount.address}
              </span>
              <span className='text-xs text-muted-foreground'>
                {activeAccount.balance} {activeAccount.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SidebarHeader>
  );

  return (
    <Sidebar className='border-r pt-20' {...props}>
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                className={
                  pathname === item.href
                    ? "bg-[#1184B6]/10 dark:bg-[#1184B6]/20 text-[#1184B6] dark:text-[#1184B6]"
                    : ""
                }
              >
                <Link
                  href={item.href}
                  prefetch
                  className='flex items-center gap-3'
                >
                  <item.icon className='h-5 w-5' />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className='mt-4 border-t pt-4'>
          <SidebarMenu>
            {helpItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.href}
                    prefetch
                    className='flex items-center gap-3'
                  >
                    <item.icon className='h-5 w-5' />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
        <div className='mt-4 border-t pt-4 px-4'>
          <div className='flex items-center gap-2 text-sm text-green-600'></div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
