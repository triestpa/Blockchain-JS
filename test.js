const { BlockChainNode } = require('.')

const difficulty = 3

const node0 = new BlockChainNode(difficulty)
node0.mine(10)

console.log(node0.getBalance())

const node1 = new BlockChainNode(difficulty, node0.getBlocks())
const node2 = new BlockChainNode(difficulty, node0.getBlocks())

node0.pay(node1.wallet.publicKey, 1)
node0.pay(node1.wallet.publicKey, 2)

node1.sync(node0.getBlocks())
console.log(node0.getBalance())
console.log(node1.getBalance())

node1.pay(node0.wallet.publicKey, 1)
node0.sync(node1.getBlocks())

console.log(node0.getBalance())
console.log(node1.getBalance())

for (let block of node0.blockchain.blocks) {
  console.log(block)
}
