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
import { HomeDashboard } from "@/components/home-dashboard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

//!EL safeAddress, es decir. la direccion del safe, se obtiene mediante params. Co nesto ya tendremos
//! el account dinamicamente.
//! tiene que haber algun metodo para sacar la info relativa a esta Safeaddress desde nuestro Backend:
//! Pending Tx, Owners , Threshold, nonce, version Ejemplo de Safe
// export type SafeInfoResponse = {
//   readonly address: string;
//   readonly nonce: string;
//   readonly threshold: number;
//   readonly owners: string[];
//   readonly singleton: string;
//   readonly modules: string[];
//   readonly fallbackHandler: string;
//   readonly guard: string;
//   readonly version: string;
// };

// Define the network schema shape matching your MongoDB model
interface Network {
  id: string;
  name: string;
  icon?: string;
}

// Define the signer schema shape matching your MongoDB model
interface Signer {
  id: string;
  name: string;
  address: string;
}

// Define the shape of MultisigWallet
interface ShieldWalletInfo {
  _id?: string;
  accountName: string;
  addressWallet: string;
  selectedNetwork: Network;
  signers: Signer[];
  threshold: number;
  creator: string;
}

export default function HomePage() {
  const [shieldWalletInfo, setShieldWalletInfo] =
    useState<ShieldWalletInfo | null>(null);
  const params = useParams();
  //!Saca el address de params de la url
  const shieldWalletAddress = params.shieldWalletAccount as string;
  const { address, chain } = useAccount();

  useEffect(() => {
    const getInfoOfSafe = async () => {
      if (!shieldWalletAddress || !address || !chain?.id) {
        console.log("Error: No Safe Account detected");
        return;
      }
      //!Hay que cambiarlo por nuestro Backend
      try {
        //!API SAFE
        // const apiKit = new SafeApiKit({
        //   chainId: BigInt(chain?.id),
        // });
        // const response = await apiKit.getSafeInfo(safeAccount);
        // console.log("Safe info response:", response);
        // // Directly set the response to safeInfo state since it matches our SafeInfoResponse interface
        // setSafeInfo(response);
        //!END
        // Fetch shield wallet details from our backend
        const response = await fetch(
          `/api/shieldwallet/${shieldWalletAddress}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch shield wallet details");
        }

        const data = await response.json();
        console.log("Shield wallet details:", data.walletWithDetails);

        // Store the wallet info directly from the backend response
        setShieldWalletInfo(data.walletWithDetails);
      } catch (error) {
        console.error("Error fetching shield wallet info:", error);
      }
    };

    getInfoOfSafe();
  }, [shieldWalletAddress, address, chain?.id]);

  return (
    <>
      <NavBarMain />
      <SidebarProvider>
        <WalletSidebar
          activeSafe={shieldWalletAddress}
          safeInfo={shieldWalletInfo}
        />
        <SidebarInset>
          <div className='flex flex-col h-full'>
            <HomeDashboard shieldWalletInfo={shieldWalletInfo} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
