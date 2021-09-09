<template>
  <div class="q-pa-md controls-block">
    <q-btn-group spread>
      <q-btn
        color="blue"
        label="+"
        @click="addNode(currentNode.key)"
        :disabled="noCurrentNode"
      />
      <q-btn
        color="blue"
        label="-"
        @click="removeNode(currentNode.key)"
        :disabled="noCurrentNodeExtended"
      />
      <q-btn
        color="blue"
        label="Edit"
        @click="toggleEditNode(currentNode.key)"
        :disabled="noCurrentNodeExtended"
      />
      <q-btn
        color="green"
        label="Apply"
        @click="save(currentNode.key, currentNode.value)"
        :disabled="!cacheDataObject.length"
      />
      <q-btn
        color="red"
        label="Reset"
        @click="reset"
        :disable="!cacheDataObject.length"
      />
    </q-btn-group>
  </div>
</template>

<script>
export default {
  name: 'ControlsBlock',

  props: {
    currentNode: Object,
    addNode: Function,
    removeNode: Function,
    save: Function,
    reset: Function,
    toggleEditNode: Function,
    cacheDataObject: Object,
  },

  computed: {
    noCurrentNode() {
      return this.currentNode && this.currentNode.key === null
    },
    noCurrentNodeExtended() {
      return (
        this.currentNode &&
        (this.currentNode.key === null ||
          this.currentNode.value.parent_id === null)
      )
    },
  },
}
</script>
