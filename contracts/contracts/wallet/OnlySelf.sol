// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title OnlySelf
/// @notice This contract provides a modifier that restricts functions to be executed only when invoked by the contract itself.
abstract contract OnlySelf {
    /// @notice Error thrown when a function protected by the onlySelf modifier is called by an external account.
    error OnlySelfUnautorized();

    /// @notice Modifier that allows a function to be executed only when called by the contract itself.
    modifier onlySelf() {
        require(msg.sender == address(this), OnlySelfUnautorized());
        _;
    }
}
