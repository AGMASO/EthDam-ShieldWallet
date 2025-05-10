// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title ShieldWalletFactory
/// @notice Factory contract for deploying ShieldWallet proxy instances.
contract ShieldWalletFactory {
    /// @notice Emitted when a new ShieldWallet proxy is created.
    event ShieldWalletCreated(ERC1967Proxy indexed proxy, address singleton);

    /// @notice Deploys a new ShieldWallet proxy contract.
    /// @param _implementation The address of the implementation (singleton) contract.
    /// @param initializer The initializer calldata to be passed to the proxy.
    /// @return proxy An instance of ERC1967Proxy representing the deployed ShieldWallet.
    function deployShieldWallet(
        address _implementation,
        bytes memory initializer
    ) external payable returns (ERC1967Proxy proxy) {
        require(isContract(_implementation), "Implementation contract not deployed");
        
        proxy = new ERC1967Proxy(
            _implementation,
            initializer
        );
        emit ShieldWalletCreated(proxy, _implementation);
    }

    /// @notice Checks whether an address contains deployed contract code.
    /// @param account The address to check.
    /// @return True if a contract is deployed at the address, false otherwise.
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}
