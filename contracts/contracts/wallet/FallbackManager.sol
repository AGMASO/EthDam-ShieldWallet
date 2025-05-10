// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OnlySelf} from "./OnlySelf.sol";

/// @title Fallback Manager
abstract contract FallbackManager is OnlySelf {
    /// @notice Emitted when the fallback handler is updated.
    event ChangedFallbackHandler(address handler);

    /// @notice Emitted when Ether is received.
    event EtherReceived(address indexed sender, uint256 value);

    /// @notice Error thrown when address(this) is provided as handler.
    error InvalidFallbackHandler();

    /// keccak256("fallback_manager.handler.address")
    bytes32 internal constant FALLBACK_HANDLER_STORAGE_SLOT =
        0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5;

    /// @notice Sets the fallback handler address in storage.
    /// @param handler The address to be set as the fallback handler.
    function _setFallbackHandler(address handler) internal {
        require(handler != address(this), InvalidFallbackHandler());
        assembly {
            sstore(FALLBACK_HANDLER_STORAGE_SLOT, handler)
        }
    }

    /// @notice Updates the fallback handler and emits a change event.
    /// @param handler The new fallback handler address.
    function setFallbackHandler(address handler) public onlySelf {
        _setFallbackHandler(handler);
        emit ChangedFallbackHandler(handler);
    }

    /// @notice Receives Ether and emits an EtherReceived event.
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    /// @notice Forwards calls with non-matching function selectors to the fallback handler.
    /// @dev Uses inline assembly to forward calldata along with the caller's address.
    /// If no fallback handler is set, the call returns silently.
    fallback() external {
        assembly {
            // Load fallback handler address from storage.
            let handler := sload(FALLBACK_HANDLER_STORAGE_SLOT)

            // If no fallback handler is set, return without executing further.
            if iszero(handler) {
                return(0, 0)
            }

            // Allocate memory for the calldata.
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())

            // Append the caller address (shifted left by 12 bytes to remove padding) after the calldata.
            mstore(add(ptr, calldatasize()), shl(96, caller()))

            // Call the fallback handler with the appended calldata and caller address.
            let success := call(
                gas(),
                handler,
                0,
                ptr,
                add(calldatasize(), 20),
                0,
                0
            )
            // Copy the returned data.
            returndatacopy(ptr, 0, returndatasize())
            if iszero(success) {
                revert(ptr, returndatasize())
            }
            return(ptr, returndatasize())
        }
    }
}
