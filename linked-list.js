function LinkedList() {
  this.length = 0
  this.head = null
}

LinkedList.prototype = {
  constructor: LinkedList,

  add(data) {
    if (this.head === null) {
      this.head = this.createNode(data)
    } else {
      this.appendNode(data)
    }
    this.length = this.length += 1
  },

  remove(index) {
    this.length = this.length -= 1
    if (index === 0) {
      const current = this.head
      this.head = current.next
      return current.data
    }
    const { previous, current } = this.traverse(index)
    previous.next = current.next
    return current.data
  },

  item(index) {
    if (index === 0){
      return this.head.data
    }
    const { current } = this.traverse(index)
    return current.data
  },
}

Object.defineProperties(LinkedList.prototype, {
  createNode: {
    value: function createNode(data) {
      return { data, next: null }
    }
  },
  appendNode: {
    value: function appendNode(data) {
      const lastNode = this.getLastNode(this.head)
      lastNode.next = this.createNode(data)
    }
  },
  getLastNode: {
    value: function getLastNode(node) {
      return node.next
        ? this.getLastNode(node.next)
        : node
    }
  },
  traverse: {
    value: function traverse(index, iteration={index: 0}) {
      if (index <= -1 || index >= this.length) {
        return null
      } else if (!iteration.current) {
        return this.traverse(index, {
          previous: this.head,
          current: this.head.next,
          index: iteration.index + 1
        })
      } else if (iteration.index < index) {
        return this.traverse(index, {
          previous: iteration.current,
          current: iteration.current.next,
          index: iteration.index + 1
        })
      } else if (iteration.index === index) {
        return iteration
      }
    }
  },
  aggregate: {
    value: function aggregate(node, accumulator=[]) {
      if (!node) {
        return this.aggregate(this.head)
      }
      accumulator.push(node.data)
      return node.next
        ? this.aggregate(node.next, accumulator)
        : accumulator
    }
  }
})