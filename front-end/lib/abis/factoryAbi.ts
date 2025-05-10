export const factoryAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract ERC1967Proxy",
        name: "proxy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "singleton",
        type: "address",
      },
    ],
    name: "ShieldWalletCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_implementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "initializer",
        type: "bytes",
      },
    ],
    name: "deployShieldWallet",
    outputs: [
      {
        internalType: "contract ERC1967Proxy",
        name: "proxy",
        type: "address",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
];
