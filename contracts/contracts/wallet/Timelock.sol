// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OnlySelf} from "./OnlySelf.sol";

abstract contract Timelock is OnlySelf {
    enum ExecutionState {
        Unset,
        Waiting,
        Ready,
        Done
    }

    error ExecutionAlreadyProposed(bytes32 id);

    event ChangedDelay(uint256 newDelay);

    mapping(bytes32 id => uint256) private _timestamps;

    // keccak256("delay_manager.delay.uint256")
    bytes32 internal constant DELAY_STORAGE_SLOT =
        0x8ae618cad2a2faa0603d54fba1a4c04474a4b669e4072855c6ccf687dc536a4c;

    uint256 internal constant _DONE_TIMESTAMP = uint256(1);

    function setDelay(uint256 _delay) public onlySelf {
        _setDelay(_delay);
        emit ChangedDelay(_delay);
    }

    function _setDelay(uint256 _delay) internal {
        assembly {
            sstore(DELAY_STORAGE_SLOT, _delay)
        }
    }

    function _schedule(bytes32 id) internal {
        if (isExecution(id)) {
            revert ExecutionAlreadyProposed(id);
        }
        _timestamps[id] = block.timestamp + getDelay();
    }

    // TODO: Add _done(id) internal

    function getTimestamp(bytes32 id) public view virtual returns (uint256) {
        return _timestamps[id];
    }

    function getExecutionState(
        bytes32 id
    ) public view virtual returns (ExecutionState) {
        uint256 timestamp = _timestamps[id];
        if (timestamp == 0) {
            return ExecutionState.Unset;
        } else if (timestamp == _DONE_TIMESTAMP) {
            return ExecutionState.Done;
        } else if (timestamp > block.timestamp) {
            return ExecutionState.Waiting;
        } else {
            return ExecutionState.Ready;
        }
    }

    function isExecution(bytes32 id) public view returns (bool) {
        return getExecutionState(id) != ExecutionState.Unset;
    }

    function getDelay() internal view returns (uint256 _delay) {
        assembly {
            _delay := sload(DELAY_STORAGE_SLOT)
        }
    }

    // TODO: Add Gap for upgradability or EIP 7201 namespace (if we add Gap  there is no need to go low levelish to store the proposer)
}
