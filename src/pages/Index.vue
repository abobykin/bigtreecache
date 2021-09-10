<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md row">
      <q-card class="main-card" dark>
        <q-card-section>
          <div class="q-pa-md row">
            <div class="col-5">
              <CacheViewer
                :chooseNode="chooseNode"
                :dataObject="cacheDataObject"
                :cacheTree="cacheTree"
                :onInputSave="editNode"
                :selectedCacheNode="selectedCacheNode"
              />

              <ControlsBlock
                :currentNode="currentNode"
                :addNode="addNode"
                :removeNode="removeNode"
                :save="save"
                :reset="reset"
                :toggleEditNode="toggleEditNode"
                :cacheDataObject="cacheDataObject"
              />
            </div>

            <div class="col-2 flex flex-center">
              <q-btn
                color="green"
                label="<<<"
                @click="attachToCache"
                :disabled="noCurrentDBNode"
              />
            </div>

            <div class="col-5">
              <DbViewer
                :chooseDbNode="chooseDbNode"
                :dataObject="databaseDataObject"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import CacheViewer from '../components/CacheViewer'
import DbViewer from '../components/DbViewer'
import ControlsBlock from '../components/ControlsBlock'
import { Tree, Node } from '../utils/structure'
import { database } from '../data/db'

export default defineComponent({
  name: 'PageIndex',

  components: {
    CacheViewer,
    DbViewer,
    ControlsBlock,
  },

  data() {
    const nullNode = {
      key: null,
      value: null,
    }

    return {
      cacheTree: null,
      cacheDataObject: [],
      databaseTree: null,
      databaseDataObject: [],
      currentNode: {
        key: null,
        value: null,
      },
      currentDbNode: {
        key: null,
        value: null,
      },
      Tree,
      Node,
      nullNode,
      selectedCacheNode: null,
    }
  },

  beforeMount() {
    this.initialize()
  },

  mounted() {},

  methods: {
    initialize() {
      // Database
      const databaseTree = new Tree()
      this.databaseTree = databaseTree.import(database)
      this.databaseDataObject = this.databaseTree.export()
      // Cache
      this.cacheTree = new Tree(null, 'Cache')
      this.cacheDataObject = []
    },

    // Create a new node in the cache tree
    addNode(to_node_id) {
      this.cacheTree.new(to_node_id, null, 'New', true)
      this.cacheDataObject = this.cacheTree.export()
    },

    // Edit a node in the cache tree
    editNode(nodeDataObject) {
      const cacheNode = this.cacheTree.get(nodeDataObject.key)
      cacheNode.label = nodeDataObject.new_label
      cacheNode.is_editing = false
      cacheNode.new_label = ''
      this.cacheDataObject = this.cacheTree.export()
    },

    // Mark specified node in the cache tree as deleted
    removeNode(node_id) {
      this.cacheTree.disable(node_id)
      this.cacheDataObject = this.cacheTree.export()
    },

    // Attach a selected database tree node to the cache tree
    attachToCache() {
      const key = this.currentDbNode.key
      // DB Tree processing
      let selectedDatabaseNode = this.databaseTree.get(key)
      selectedDatabaseNode.is_cached = true
      // Put to cache
      this.cacheTree.append(selectedDatabaseNode)
      // DOM data
      this.databaseDataObject = this.databaseTree.export()
      this.cacheDataObject = this.cacheTree.export()
      this.selectedCacheNode = null
    },

    save() {
      const node = this.cacheTree.root()
      this.databaseTree.update(this.cacheTree)
      this.databaseDataObject = this.databaseTree.export()
    },

    reset() {
      this.initialize()
    },

    chooseNode(key) {
      // UI layer updates
      if (key) {
        let node = this.cacheTree.get(key)
        this.currentNode = {
          key,
          value: node,
        }
        this.currentDbNode = this.nullNode
      } else {
        this.currentNode = this.nullNode
      }
    },

    chooseDbNode(key) {
      // UI layer updates
      if (key) {
        let node = this.databaseTree.get(key)
        this.currentDbNode = {
          key,
          value: node,
        }
        this.currentNode = this.nullNode
      } else {
        this.currentDbNode = this.nullNode
      }
    },

    toggleEditNode(key) {
      const node = this.cacheTree.get(key)
      node.is_editing = true
      this.cacheTree.patch(node)
      this.cacheDataObject = this.cacheTree.export()
    },
  },

  computed: {
    noCurrentDBNode() {
      return (
        this.currentDbNode &&
        (this.currentDbNode.key === null ||
          this.currentDbNode.value.parent_id === null)
      )
    },
  },
})
</script>
