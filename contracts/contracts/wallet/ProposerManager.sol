// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OnlySelf} from "./OnlySelf.sol";

abstract contract ProposerManager is OnlySelf {
    /// @notice Emitted when the proposer address is changed.
    event ChangedProposer(address proposer);

    // keccak256("proposer_manager.proposer.address")
    bytes32 internal constant PROPOSER_STORAGE_SLOT =
        0xad6bfd7cbdf454ef80831c196eeeb83bd86c9d731dfcdd32b8138556b87ea00a;

    /// @notice Sets the proposer address in storage.
    /// @param _proposer The new proposer address.
    function _setProposer(address _proposer) internal {
        assembly {
            sstore(PROPOSER_STORAGE_SLOT, _proposer)
        }
    }

    /// @notice Updates the proposer address and emits an event.
    /// @param _proposer The new proposer address.
    function setProposer(address _proposer) public onlySelf {
        _setProposer(_proposer);
        emit ChangedProposer(_proposer);
    }

    /// @notice Retrieves the current proposer address from storage.
    /// @return _proposer The current proposer address.
    function getProposer() public view returns (address _proposer) {
        assembly {
            _proposer := sload(PROPOSER_STORAGE_SLOT)
        }
    }
}
