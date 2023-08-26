// SPDX-License-Identifier: MIT
// This file was procedurally generated

pragma solidity ^0.8.20;

using TestLibrary for Test global;
using TestPackedLibrary for TestPacked global;

struct Test {
  uint128 a;
  uint64 b;
  uint64 c;
}

type TestPacked is uint256;

library TestLibrary {
  function store(Test storage pointer, TestPacked _packed) internal {
      assembly {
          sstore(pointer.slot, _packed)
      }
  }
  
  function load(Test storage pointer) internal view returns(TestPacked _packed) {
      assembly {
          _packed := sload(pointer.slot)
      }
  }
}

library TestPackedLibrary {  uint256 private constant UINT128_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
  uint256 private constant UINT64_MASK = 0xFFFFFFFFFFFFFFFF;

  uint256 private constant B_OFFSET = 128;
  uint256 private constant C_OFFSET = 192;

  // #### GETTERS ####
  function a(TestPacked _packed) internal pure returns(uint128 _a) {
      assembly {
          _a := and(UINT128_MASK, _packed)
      }
  }

  function b(TestPacked _packed) internal pure returns(uint64 _b) {
      assembly {
          _b := and(UINT64_MASK, shr(B_OFFSET, _packed))
      }
  }

  function c(TestPacked _packed) internal pure returns(uint64 _c) {
      assembly {
          _c := and(UINT64_MASK, shr(C_OFFSET, _packed))
      }
  }

  // #### SETTERS ####
  function setA(TestPacked _packed, uint128 _a) internal pure returns(TestPacked _result) {
      assembly {
          _result := or(and(not(UINT128_MASK), _packed), _a)
      }
  }

  function setB(TestPacked _packed, uint64 _b) internal pure returns(TestPacked _result) {
      assembly {
          _result := or(and(not(shl(B_OFFSET, UINT64_MASK)), _packed), shl(B_OFFSET, _b))
      }
  }

  function setC(TestPacked _packed, uint64 _c) internal pure returns(TestPacked _result) {
      assembly {
          _result := or(and(not(shl(C_OFFSET, UINT64_MASK)), _packed), shl(C_OFFSET, _c))
      }
  }
}