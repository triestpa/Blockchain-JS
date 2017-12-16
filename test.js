const assert = require('assert')
const { BlockChainNode } = require('.')

const difficulty = 3

console.log('Initializing Wallets and Blockchains')
const node0 = new BlockChainNode(null, difficulty)
const node1 = new BlockChainNode(null, difficulty, node0.getBlocks())

console.log('Mining Node0/Wallet0 For Initial Balance of 30 Coins')
node0.generateCoins(30)

console.log('Verifying Wallet 0 Balance of 30 Coins')
let balanceNode0 = node0.getBalance()
assert.equal(balanceNode0, (10 * difficulty))

console.log('Making Payments To Wallet 1')
node0.pay(node1.wallet.publicKey, 10)
node0.pay(node1.wallet.publicKey, 8)

console.log('Verifying Debited Balance on Wallet 0')
balanceNode0 = node0.getBalance()
assert.equal(balanceNode0, 30 + (2 * difficulty) - (10 + 8))

console.log('Syncing Transactions To Node 1')
node1.sync(node0.getBlocks())

console.log('Verifying Wallet 1 Balance of 18 Coins')
let balanceNode1 = node1.getBalance()
assert.equal(balanceNode1, (10 + 8))

console.log('Verifying That Node 0 and Node 1 Contain Identical Blockchains.')
assert.deepEqual(node1.blockchain, node0.blockchain)

console.log('Making Payment From Node 1 To Node 0.')
node1.pay(node0.wallet.publicKey, 1)

console.log('Syning Transaction To Node 0.')
node0.sync(node1.getBlocks())

console.log('Verifying New Balances For Wallet 0 and Wallet 1.')
assert.equal(node0.getBalance(), 30 + (2 * difficulty) - (10 + 8) + 1)
assert.equal(node1.getBalance(), (10 + 8) + (1 * difficulty) - 1)

console.log('Verifying That Node0 and Node1 Contain Identical Blockchains.')
assert.deepEqual(node1.blockchain, node0.blockchain)
