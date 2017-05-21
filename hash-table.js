class HashTable {
  constructor() {
    this.memory = []
  }

  hashKey(key) {
    let hash = 0
    for (let ii = 0; ii < key.length; ii++) {
      const code = key.charCodeAt(ii)
      hash = ((hash << 5) - hash) + code | 0
    }
    return hash
  }

  get(key) {
    const address = this.hashKey(key)
    return this.memory[address]
  }

  set(key, value) {
    const address = this.hashKey(key)
    this.memory[address] = value
  }

  remove(key) {
    const address = this.hashKey(key)
    if (this.memory[address]) {
      delete this.memory[address]
    }
  }
}

export default HashTable