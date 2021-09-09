<template>
  <q-card>
    <q-card-section>
      <q-tree
        ref="qDbTree"
        :nodes="data"
        node-key="key"
        default-expand-all
        v-model:selected="selected"
        :duration="500"
        @click="nodeSelected($event)"
      >
        <template v-slot:default-header="item">
          <div class="row items-center">
            <div :class="{ disabled: item.node.is_cached }">
              <span class="text">{{ item.node.label }}</span>
              <template v-if="item.node.is_cached">
                <q-icon
                  name="multiple_stop"
                  class="cursor-default"
                  title="In cache"
                />
              </template>
            </div>
          </div>
        </template>
      </q-tree>
    </q-card-section>
  </q-card>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'DbViewer',

  props: {
    chooseDbNode: Function,
    dataObject: Array,
  },

  setup(props) {
    const selected = ref(null)
    const data = ref(props.dataObject) || []
    const qDbTree = ref(null)

    return {
      selected,
      data,
      qDbTree,
    }
  },

  methods: {
    nodeSelected(e) {
      this.chooseDbNode(this.selected)
    },
  },
  updated() {
    this.data = this.dataObject || []
    this.$nextTick(() => {
      this.$refs.qDbTree.expandAll()
    })
  },
}
</script>
