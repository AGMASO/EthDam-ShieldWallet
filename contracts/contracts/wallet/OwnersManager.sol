// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OnlySelf} from "./OnlySelf.sol";

/// @title Owners Manager
/// @notice Manages the owners linked list and threshold settings for contract operations.
abstract contract OwnersManager is OnlySelf {
    /// @notice Emitted when a new owner is added.
    event AddedOwner(address Owner);
    /// @notice Emitted when an owner is removed.
    event RemovedOwner(address Owner);
    /// @notice Emitted when thresholds are changed.
    /// @param managementThreshold New management threshold.
    /// @param executionThreshold New execution threshold.
    /// @param revocationThreshold New revocation threshold.
    event ChangedThresholds(
        uint256 managementThreshold,
        uint256 executionThreshold,
        uint256 revocationThreshold
    );

    /// @dev Thrown when the new threshold exceeds the total number of owners.
    error ThresholdHigherThanOwnersCount();
    /// @dev Thrown when provided threshold values are inconsistent.
    error InconsistentThresholds();
    /// @dev Thrown when there are not enough owners.
    error NotEnoughOwners();
    /// @dev Thrown when an owner address is invalid.
    error InvalidOwner();
    /// @dev Thrown when an owner is already added.
    error OwnerAlreadyAdded();
    /// @dev Thrown when the previous owner provided in the linked list is invalid.
    error InvalidPrevOwner();

    /// @dev Special address acting as the head of the owners linked list.
    address internal constant HEAD = address(0x1);

    /// @notice Mapping for owners forming a linked list.
    /// @dev Maps an owner address to the next owner in the list.
    mapping(address => address) internal owners;

    /// @notice Total count of the current owners.
    uint256 internal ownerCount;

    /// @notice Enum representing types of thresholds.
    enum ThresholdType {
        MANAGEMENT,
        EXECUTION,
        REVOCATION
    }

    /// @notice Management threshold value.
    uint256 internal managementThreshold;
    /// @notice Execution threshold value.
    uint256 internal executionThreshold;
    /// @notice Revocation threshold value.
    uint256 internal revocationThreshold;

    function thresholdTypeToThreshold(
        ThresholdType thresholdType
    ) public view returns (uint256 threshold) {
        if (thresholdType == ThresholdType.MANAGEMENT) {
            threshold = managementThreshold;
        } else if (thresholdType == ThresholdType.EXECUTION) {
            threshold = executionThreshold;
        } else if (thresholdType == ThresholdType.REVOCATION) {
            threshold = revocationThreshold;
        }
    }

    /// @notice Adds a new owner and optionally updates the threshold values.
    /// @param _owner Address of the new owner.
    /// @param _managementThreshold New management threshold.
    /// @param _executionThreshold New execution threshold.
    /// @param _revocationThreshold New revocation threshold.
    function addOwnerWithThreshold(
        address _owner,
        uint256 _managementThreshold,
        uint256 _executionThreshold,
        uint256 _revocationThreshold
    ) public onlySelf {
        require(
            _owner != address(0) && _owner != HEAD && _owner != address(this),
            InvalidOwner()
        );
        require(owners[_owner] == address(0), OwnerAlreadyAdded());

        owners[_owner] = owners[HEAD];
        owners[HEAD] = _owner;
        ++ownerCount;

        emit AddedOwner(_owner);

        if (
            _managementThreshold != managementThreshold ||
            _executionThreshold != executionThreshold ||
            _revocationThreshold != revocationThreshold
        ) {
            changeThresholds(
                _managementThreshold,
                _executionThreshold,
                _revocationThreshold
            );
        }
    }

    /// @notice Removes an owner and optionally updates the threshold values.
    /// @param _prevOwner Address of the owner preceding the owner to be removed.
    /// @param _owner Address of the owner to remove.
    /// @param _managementThreshold New management threshold.
    /// @param _executionThreshold New execution threshold.
    /// @param _revocationThreshold New revocation threshold.
    function removeOwnerWithThreshold(
        address _prevOwner,
        address _owner,
        uint256 _managementThreshold,
        uint256 _executionThreshold,
        uint256 _revocationThreshold
    ) public onlySelf {
        require(
            --ownerCount > _managementThreshold,
            ThresholdHigherThanOwnersCount()
        );
        require(_owner != address(0) && _owner != HEAD, InvalidOwner());
        require(owners[_prevOwner] == _owner, InvalidPrevOwner());

        owners[_prevOwner] = owners[_owner];
        owners[_owner] = address(0);

        emit RemovedOwner(_owner);

        if (
            _managementThreshold != managementThreshold ||
            _executionThreshold != executionThreshold ||
            _revocationThreshold != revocationThreshold
        ) {
            changeThresholds(
                _managementThreshold,
                _executionThreshold,
                _revocationThreshold
            );
        }
    }

    /// @notice Replaces an existing owner with a new owner.
    /// @param _prevOwner Address of the owner preceding the old owner.
    /// @param _oldOwner Existing owner address to be replaced.
    /// @param _newOwner New owner address to add.
    function swapOwner(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    ) public onlySelf {
        require(
            _newOwner != address(0) &&
                _newOwner != HEAD &&
                _newOwner != address(this),
            InvalidOwner()
        );
        require(owners[_newOwner] == address(0), OwnerAlreadyAdded());
        require(_oldOwner != address(0) && _oldOwner != HEAD, InvalidOwner());
        require(owners[_prevOwner] == _newOwner, InvalidPrevOwner());

        owners[_newOwner] = owners[_oldOwner];
        owners[_prevOwner] = _newOwner;
        owners[_oldOwner] = address(0);

        emit RemovedOwner(_oldOwner);
        emit AddedOwner(_newOwner);
    }

    /// @notice Updates the thresholds for management, execution, and revocation.
    /// @param _managementThreshold New management threshold.
    /// @param _executionThreshold New execution threshold.
    /// @param _revocationThreshold New revocation threshold.
    function changeThresholds(
        uint256 _managementThreshold,
        uint256 _executionThreshold,
        uint256 _revocationThreshold
    ) public onlySelf {
        require(
            _managementThreshold <= ownerCount,
            ThresholdHigherThanOwnersCount()
        );
        require(_managementThreshold != 0, NotEnoughOwners());
        require(
            _executionThreshold < _managementThreshold,
            InconsistentThresholds()
        );
        require(
            _revocationThreshold < _executionThreshold,
            InconsistentThresholds()
        );
        require(_revocationThreshold != 0, InconsistentThresholds());

        managementThreshold = _managementThreshold;
        executionThreshold = _executionThreshold;
        revocationThreshold = _revocationThreshold;

        emit ChangedThresholds(
            _managementThreshold,
            _executionThreshold,
            _revocationThreshold
        );
    }

    /// @notice Initializes the owners linked list and threshold values.
    /// @param _owners Array of initial owner addresses.
    /// @param _managementThreshold Initial management threshold.
    /// @param _executionThreshold Initial execution threshold.
    /// @param _revocationThreshold Initial revocation threshold.
    function _setupOwnersAndThresholds(
        address[] calldata _owners,
        uint256 _managementThreshold,
        uint256 _executionThreshold,
        uint256 _revocationThreshold
    ) internal {
        require(
            _managementThreshold <= _owners.length,
            ThresholdHigherThanOwnersCount()
        );
        require(_managementThreshold != 0, NotEnoughOwners());
        require(
            _executionThreshold < _managementThreshold,
            InconsistentThresholds()
        );
        require(
            _revocationThreshold < _executionThreshold,
            InconsistentThresholds()
        );
        require(_revocationThreshold != 0, InconsistentThresholds());

        address currentOwner = HEAD;
        uint256 ownersLength = _owners.length;
        for (uint256 i = 0; i < ownersLength; ++i) {
            address owner = _owners[i];
            require(
                owner != address(0) &&
                    owner != HEAD &&
                    owner != address(this) &&
                    currentOwner != owner,
                InvalidOwner()
            );
            require(owners[owner] == address(0), OwnerAlreadyAdded());
            owners[currentOwner] = owner;
            currentOwner = owner;
        }
        owners[currentOwner] = HEAD;
        ownerCount = ownersLength;
        managementThreshold = _managementThreshold;
        executionThreshold = _executionThreshold;
        revocationThreshold = _revocationThreshold;
    }

    /// @notice Retrieves the current management threshold.
    /// @return The management threshold.
    function getManagementThreshold() public view returns (uint256) {
        return managementThreshold;
    }

    /// @notice Retrieves the current execution threshold.
    /// @return The execution threshold.
    function getExecutionThreshold() public view returns (uint256) {
        return executionThreshold;
    }

    /// @notice Retrieves the current revocation threshold.
    /// @return The revocation threshold.
    function getRevocationThreshold() public view returns (uint256) {
        return revocationThreshold;
    }

    /// @notice Checks if a given address is an owner.
    /// @param owner The address to verify.
    /// @return True if the address is an owner, false otherwise.
    function isOwner(address owner) public view returns (bool) {
        return !(owner == HEAD || owners[owner] == address(0));
    }

    /// @notice Retrieves the list of all owner addresses.
    /// @return An array containing all owner addresses.
    function getOwners() public view returns (address[] memory) {
        address[] memory array = new address[](ownerCount);
        uint256 index = 0;
        address currentOwner = owners[HEAD];
        while (currentOwner != HEAD) {
            array[index] = currentOwner;
            currentOwner = owners[currentOwner];
            ++index;
        }
        return array;
    }

    // TODO: Add Gap for upgradability or EIP 7201 namespace
}
