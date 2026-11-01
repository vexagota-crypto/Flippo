// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FlippoToken
 * @dev Test ERC-20 token for Flippo ($FLIPPO) on Robinhood Chain Testnet
 * Self-contained without external dependencies for easy deployment on Remix IDE.
 */
contract FlippoToken {
    string public name = "Flippo";
    string public symbol = "FLIPPO";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * @notice Deploy Flippo token.
     * @param initialSupply Whole tokens to mint to deployer (e.g. 100000000 for 100M). If 0, defaults to 100,000,000 FLIPPO.
     */
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        uint256 supply = initialSupply > 0 ? initialSupply : 100_000_000;
        _mint(msg.sender, supply * 10 ** decimals);
    }

    /// @dev Mint tokens in wei (exact 18-decimal precision)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function for easy tier testing on Robinhood Testnet.
     * @param to The recipient address (e.g. your test wallet)
     * @param tokenAmount Whole token amount (e.g. 100000 for Bronze, 500000 for Silver, 2000000 for Gold, 5000000 for Platinum, 10000000 for Diamond)
     */
    function faucet(address to, uint256 tokenAmount) external {
        _mint(to, tokenAmount * 10 ** decimals);
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        allowance[sender][msg.sender] = currentAllowance - amount;
        _transfer(sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from zero address");
        require(recipient != address(0), "ERC20: transfer to zero address");
        require(balanceOf[sender] >= amount, "ERC20: insufficient balance");

        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to zero address");
        totalSupply += amount;
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}
