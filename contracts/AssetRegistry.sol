// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AssetRegistry {
    struct Asset {
        uint256 id;
        address owner;
        string description;
        uint256 registeredAt;
    }

    mapping(uint256 => Asset) private _assets;
    mapping(uint256 => bool) private _exists;
    uint256 private _nextId = 1;

    event AssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        string description,
        uint256 timestamp
    );

    event OwnershipTransferred(
        uint256 indexed assetId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    function registerAsset(string calldata description) external returns (uint256) {
        uint256 assetId = _nextId++;
        require(!_exists[assetId], "Already exists");

        Asset memory a = Asset(assetId, msg.sender, description, block.timestamp);
        _assets[assetId] = a;
        _exists[assetId] = true;

        emit AssetRegistered(assetId, msg.sender, description, block.timestamp);
        return assetId;
    }

    function transferAsset(uint256 assetId, address newOwner) external {
        require(_exists[assetId], "Asset missing");
        require(newOwner != address(0), "Invalid new owner");

        Asset storage a = _assets[assetId];
        require(msg.sender == a.owner, "Only owner");

        address prev = a.owner;
        a.owner = newOwner;

        emit OwnershipTransferred(assetId, prev, newOwner, block.timestamp);
    }

    function getAsset(uint256 assetId)
        external
        view
        returns (uint256 id, address owner, string memory description, uint256 registeredAt)
    {
        require(_exists[assetId], "Asset missing");
        Asset storage a = _assets[assetId];
        return (a.id, a.owner, a.description, a.registeredAt);
    }

    function exists(uint256 assetId) external view returns (bool) {
        return _exists[assetId];
    }

    function nextId() external view returns (uint256) {
        return _nextId;
    }
}
