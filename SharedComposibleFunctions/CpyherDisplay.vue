<!-- src/components/CypherDisplay.vue -->
<template>
    <div class="cypher-display">
      <pre><code class="language-cypher">{{ query }}</code></pre>
      <q-btn 
        icon="content_copy" 
        label="Copy Query" 
        @click="copyQuery"
        color="primary"
        flat
      />
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const props = defineProps({
    query: {
      type: String,
      required: true
    }
  })
  
  const copyQuery = () => {
    navigator.clipboard.writeText(props.query).then(() => {
      // Optional: Show a notification that query was copied
      console.log('Query copied to clipboard')
    }).catch(err => {
      console.error('Failed to copy query: ', err)
    })
  }
  </script>
  
  <style scoped>
  .cypher-display {
    background-color: #f4f4f4;
    padding: 15px;
    border-radius: 4px;
  }
  
  pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
  </style>