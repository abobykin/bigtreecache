import { colors, uid } from 'quasar'
import { database, ROOT_NODE_ID } from 'src/data/db'

// Node
export const Node = function (label, id = null, parent_id = null) {
  if (!id) {
    id = uid()
  }
  this.id = id
  this.parent_id = null
  this.label = label
  this.children = new Map()
  this.disabled = false
  this.is_cached = false
  this.is_editing = false
  this.new_label = ''

  // Clone a node
  this.clone = function () {
    let map = new Map()
    let starting = map.set(this.id, this)
    let recurseNodes = function (nodeMap) {
      let clonedNodeMap = new Map()
      nodeMap.forEach((node, key) => {
        let currentNode = new Node('')
        for (const [index, value] of Object.entries(node)) {
          currentNode[index] = node[index]
        }
        currentNode.children = new Map()
        if (node.children.size) {
          currentNode.children = recurseNodes(node.children)
        }
        clonedNodeMap.set(currentNode.id, currentNode)
      })
      return clonedNodeMap
    }
    let cloned = recurseNodes(starting)
    return cloned.get(this.id)
  }
}

// Tree
export const Tree = function (node, label = 'Database') {
  if (!node) {
    const new_node = new Node(label, ROOT_NODE_ID)
    node = new_node
  }

  // Set root
  let map = new Map()
  this._root = map.set(node.id, node)

  // Build basic Tree
  this.import = function (database) {
    const context = this
    database.forEach((entry) => {
      context.new(entry[0], entry[1], entry[2])
    })
    return context
  }

  // Get root node
  this.root = function () {
    const n = this._root.entries().next().value
    if (n instanceof Array) {
      return n[1]
    }
    if (n instanceof Node) {
      return n
    }
    console.warn("Error. Can't take a root node")
    return false
  }

  // Run over tree
  this.deepscan = function (callback) {
    ;(function recursive(currentNodeMap) {
      currentNodeMap.forEach((currentNode, key) => {
        recursive(currentNode.children)
      })

      callback(currentNodeMap)
    })(this._root)
  }

  // Queued run over tree
  this.widescan = function (callback) {
    let queue = new Queue()

    queue.enqueue(this._root)

    let currentTreeMap = queue.dequeue()

    while (currentTreeMap) {
      currentTreeMap.forEach((currentTree, key) => {
        queue.enqueue(currentTree.children)
      })

      callback(currentTreeMap)
      currentTreeMap = queue.dequeue()
    }
  }

  // Universal method to find based on condititions at callback()
  this.traverse = function (callback, method = null) {
    if (!method) {
      method = this.widescan
    }
    method.call(this, callback)
  }

  // Get a cloned Node by id from the Tree
  this.extract = function (node_id) {
    let node = this.get(node_id)
    return node.clone()
  }

  // Get Node as is (as source, linked) by id from the Tree
  this.get = function (node_id, as_new = false) {
    let node = null
    let callback = function (nodeMap) {
      let result = nodeMap.get(node_id)
      if (result) {
        node = result
      }
    }
    this.traverse(callback)

    if (!node) {
      console.warn('Node with id ' + node_id + ' is not found')
    }
    return node
  }

  // Export specified node as a JS object
  this.export = function (only_cached = false, node_id = null) {
    let preparedObj = {}
    let tree
    if (node_id) {
      let node = this.get(node_id)
      tree = new Tree(node)
    } else {
      tree = this
    }

    let createObject = function (nodeMap) {
      let objects = []
      nodeMap.forEach((node) => {
        let currentObj = {}
        for (const [index, value] of Object.entries(node)) {
          if (index !== 'key' && index !== 'children') {
            currentObj[index] = node[index]
          }
        }
        // Set manually since we have different key-naming here
        currentObj.expandable = true
        currentObj.key = node.id
        currentObj.children = new Map()

        if (node.children.size) {
          currentObj.children = createObject(node.children)
        }
        if (only_cached) {
          if (node.is_cached) {
            objects.push(currentObj)
          }
        } else {
          objects.push(currentObj)
        }
      })
      return objects
    }

    preparedObj = createObject(tree._root)

    return preparedObj
  }

  // Put/replace Node at the Tree
  this.patch = function (node) {
    let callback = function (nodeMap) {
      let result = nodeMap.get(node.id)
      if (result) {
        nodeMap.set(node.id, node.clone())
      }
    }
    this.traverse(callback)

    return true
  }

  // Create a new child to specified Node (id)
  this.new = function (to_id, as_id = null, label = 'New', is_cached = false) {
    // A new Node to add
    let child = new Node(label, as_id)
    let parent = null
    // Search parent node
    let callback = function (nodeMap) {
      let node = nodeMap.get(to_id)
      if (node) {
        parent = node
      }
    }
    this.traverse(callback)

    if (parent) {
      parent.children.set(child.id, child)
      child.parent_id = parent.id
      if (is_cached) {
        child.is_cached = is_cached
      }
      return this
    } else {
      console.warn('Error on add: No parent found')
      return false
    }
  }

  // Most commonly for attach (move to cache) specified node to (this) cache tree
  this.append = function (node_for_attach) {
    let context = this
    // Common method to find children and remove it from root
    function children_processing(attaching_node, parent) {
      let children = new Map()
      // Find children
      let children_callback = function (nodeMap) {
        nodeMap.forEach((node) => {
          if (node.parent_id == attaching_node.id) {
            children.set(node.id, node.clone())
          }
        })
      }
      context.traverse(children_callback)
      // Attach to node
      if (children.size) {
        attaching_node.children = children
        children.forEach((child) => {
          context.delete(child.id)
        })
      }
      // Add to parent
      parent.children.set(attaching_node.id, attaching_node)
      return children
    }

    node_for_attach = node_for_attach.clone()
    node_for_attach.children = new Map()
    // Case 0: The parent of the selected node is the root node
    if (node_for_attach.parent_id == ROOT_NODE_ID) {
      children_processing(node_for_attach, context.root())
      return
    }
    // Case 1: Selected node has a direct parent in the cache (tree)
    let parent = null
    let parent_callback = function (nodeMap) {
      if (parent) {
        return
      }
      let node = nodeMap.get(node_for_attach.parent_id)
      if (node) {
        parent = node
      }
    }
    context.traverse(parent_callback)
    // A parent found
    if (parent) {
      children_processing(node_for_attach, parent)
      return context
    } else {
      // Case 2: Selected node is a direct parent of a node/nodes in the cache (tree)
      // Case 3: Node has no a direct child or the direct parent in the cache (tree)
      children_processing(node_for_attach, context.root())
      return context
    }
  }

  // Extend this tree with another specified (cache) tree
  this.update = function (cache_tree) {
    let database_tree = this

    // Attach/update nodes in DB
    const tree_callback = function (nodeMap) {
      const is_root = nodeMap.get(cache_tree.root().id)
      // Work with non root cache tree nodes
      if (!is_root) {
        nodeMap.forEach((node) => {
          node = node.clone()
          // Case 0: find node self
          let has_node_self = database_tree.get(node.id)
          if (has_node_self) {
            has_node_self.label = node.label
            // Disable node and children
            if (node.disabled) {
              database_tree.disable(node.id)
            }
          } else {
            // Case 1: find node parent
            let has_node_parent = database_tree.get(node.parent_id)
            if (has_node_parent) {
              has_node_parent.children.set(node.id, node)
              // Impossible case?
              if (has_node_parent.disabled) {
                database_tree.disable(node.id)
              }
            } else {
              // Case 2: root
              database_tree.root().children.set(node.id, node)
            }
          }
          //}
        })
      }
    }
    cache_tree.traverse(tree_callback)

    // Sync disabled state in cache
    const sync_callback = function (nodeMap) {
      const is_root = nodeMap.get(cache_tree.root().id)
      if (!is_root) {
        nodeMap.forEach((node) => {
          let node_from_db = database_tree.get(node.id)
          if (node_from_db && node_from_db.disabled) {
            cache_tree.disable(node.id)
          }
        })
      }
    }
    cache_tree.traverse(sync_callback)
  }

  // Clone whole tree
  this.clone = function () {
    const node = this.root().clone()
    return new Tree(node)
  }

  // Make disabled (remove) specified node at tree
  this.disable = function (node_id) {
    this.marker(node_id, 'disabled', true)
  }

  // Set specified property for selected node and all children
  this.marker = function (node_id, property, value) {
    const node = this.get(node_id)
    const tree = new Tree(node)
    let callback = function (nodeMap) {
      nodeMap.forEach((currentNode) => {
        currentNode[property] = value
      })
    }
    tree.traverse(callback)
    const patchingNode = tree.root()
    this.patch(patchingNode)
  }

  // Delete a node
  this.delete = function (node_id) {
    const node = this.get(node_id)
    let parent = this.get(node.parent_id)
    if (!parent) {
      parent = this.root()
    }
    parent.children.delete(node_id)
    return this
  }
}

/*
A function to represent a queue

Created by Kate Morley - https://code.iamkate.com/javascript/queues/ - and released under the terms
of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode
*/

/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front.
 */
function Queue() {
  let queue = []
  let offset = 0

  this.getLength = function () {
    return queue.length - offset
  }

  this.isEmpty = function () {
    return queue.length == 0
  }

  this.enqueue = function (item) {
    queue.push(item)
  }

  this.dequeue = function () {
    if (queue.length == 0) return undefined

    let item = queue[offset]

    if (++offset * 2 >= queue.length) {
      queue = queue.slice(offset)
      offset = 0
    }

    return item
  }

  this.peek = function () {
    return queue.length > 0 ? queue[offset] : undefined
  }
}
