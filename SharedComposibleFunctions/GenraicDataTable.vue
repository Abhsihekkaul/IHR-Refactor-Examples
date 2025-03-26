<!-- src/components/GenericDataTable.vue -->
<template>
    <div class="generic-data-table">
      <!-- Tabs for different views -->
      <q-tabs v-model="activeTab">
        <q-tab name="data" label="Data" />
        <q-tab name="chart" label="Chart" />
        <q-tab name="query" label="Cypher Query" />
        <q-tab name="metadata" label="Metadata" />
      </q-tabs>
  
      <q-tab-panels v-model="activeTab">
        <!-- Data Table Panel -->
        <q-tab-panel name="data">
          <TableDisplay 
            :data="data.items"
            :columns="columns"
            :loading="data.loading"
            @row-click="handleRowClick"
          />
        </q-tab-panel>
  
        <!-- Chart Panel -->
        <q-tab-panel name="chart">
          <slot name="charts" :data="data.items"></slot>
        </q-tab-panel>
  
        <!-- Cypher Query Panel -->
        <q-tab-panel name="query">
          <CypherDisplay :query="query" />
        </q-tab-panel>
  
        <!-- Metadata Panel -->
        <q-tab-panel name="metadata">
          <MetadataDisplay :metadata="metadata" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useDataFetching } from '@/composables/useDataFetching'
  import { extractMetadataFromQuery } from '@/utils/metadataExtractor'
  import TableDisplay from './TableDisplay.vue'
  import CypherDisplay from './CypherDisplay.vue'
  import MetadataDisplay from './MetadataDisplay.vue'
  
  const props = defineProps({
    query: {
      type: String,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    api: {
      type: Object,
      required: true
    },
    getParams: {
      type: Function,
      default: () => ({})
    }
  })
  
  const activeTab = ref('data')
  
  const { data } = useDataFetching({
    api: props.api,
    query: props.query,
    getParams: props.getParams
  })
  
  const metadata = computed(() => extractMetadataFromQuery(props.query))
  
  const emit = defineEmits(['row-click'])
  
  const handleRowClick = (row) => {
    emit('row-click', row)
  }
  </script>
  
  <style scoped>
  .generic-data-table {
    width: 100%;
  }
  </style>