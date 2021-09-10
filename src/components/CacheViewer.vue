<template>
  <q-card>
    <q-card-section>
      <q-tree
        ref="qTree"
        :nodes="data"
        node-key="key"
        default-expand-all
        v-model:selected="selected"
        v-model:expanded="expanded"
        :duration="250"
        @click="nodeSelected"
        ><template v-slot:default-header="item">
          <div class="row items-center">
            <div>
              <span class="text">{{ item.node.label }}</span>
            </div>
          </div>
        </template>
        <template v-slot:default-body="item">
          <q-input v-if="item.node.is_editing" v-model="item.node.new_label">
            <template v-if="item.node.new_label.length" v-slot:append>
              <q-icon
                name="done"
                @click="onConfirmChange(item.node)"
                class="cursor-pointer"
              />
            </template>
          </q-input>
        </template>
      </q-tree>
    </q-card-section>

    <!-- Slot for controls block -->
    <slot></slot>
  </q-card>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'CacheViewer',

  props: {
    chooseNode: Function,
    dataObject: Array,
    cacheTree: Object,
    onInputSave: Function,
    selectedCacheNode: String,
  },

  setup(props) {
    const selected = ref(null)
    const data = ref(props.dataObject)
    const ids = ref([])
    const qTree = ref(null)

    return {
      expanded: ref(ids),
      selected,
      data,
      qTree,
    }
  },

  data() {
    return {
      inputText: '',
    }
  },

  methods: {
    nodeSelected() {
      this.chooseNode(this.selected)
    },

    onConfirmChange(nodeDataObject) {
      this.selected = nodeDataObject.key
      this.onInputSave(nodeDataObject)
    },
  },

  updated() {
    // UI layer updates
    this.selected = this.selectedCacheNode
    this.data = this.dataObject || []
    this.$nextTick(() => {
      this.$refs.qTree.expandAll()
    })
    this.expanded = this.cacheTree.ids()
  },
}
</script>
