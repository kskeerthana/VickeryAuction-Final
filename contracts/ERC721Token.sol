// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Token is ERC721 {
    constructor() ERC721("ERC721Token", "M721") {
        _mint(msg.sender, 1); 
        _mint(msg.sender, 2);
        _mint(msg.sender, 3);
    }
}
