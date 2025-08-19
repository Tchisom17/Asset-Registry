// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "./AssetRegistry.sol";

contract AssetRegistryTest is Test {
    AssetRegistry registry;
    address alice = address(0x1);
    address bob = address(0x2);
    address carol = address(0x3);

    function setUp() public {
        registry = new AssetRegistry();
    }

    function testRegisterAsset() public {
        vm.prank(alice);
        uint256 id = registry.registerAsset("Laptop");

        (uint256 assetId, address owner, string memory desc, uint256 ts) = registry.getAsset(id);

        assertEq(assetId, 1);
        assertEq(owner, alice);
        assertEq(desc, "Laptop");
        assertGt(ts, 0);
    }

    function testIncrementIds() public {
        vm.prank(alice);
        registry.registerAsset("Asset1");
        vm.prank(bob);
        registry.registerAsset("Asset2");

        uint256 nextId = registry.nextId();
        assertEq(nextId, 3);
    }

    function testOnlyOwnerCanTransfer() public {
        vm.prank(alice);
        uint256 id = registry.registerAsset("Phone");

        vm.expectRevert("Only owner");
        vm.prank(bob);
        registry.transferAsset(id, bob);
    }

    function testTransferOwnership() public {
        vm.prank(alice);
        uint256 id = registry.registerAsset("Camera");

        vm.prank(alice);
        registry.transferAsset(id, bob);

        (, address newOwner,,) = registry.getAsset(id);
        assertEq(newOwner, bob);
    }

    function testRejectZeroAddressTransfer() public {
        vm.prank(alice);
        uint256 id = registry.registerAsset("Tablet");

        vm.expectRevert("Invalid new owner");
        vm.prank(alice);
        registry.transferAsset(id, address(0));
    }

    function testRevertForNonExistentAsset() public {
        vm.expectRevert("Asset missing");
        registry.getAsset(99);

        vm.expectRevert("Asset missing");
        registry.transferAsset(99, bob);
    }
}
