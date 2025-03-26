// src/composables/useDataFetching.ts
import { ref, watch, onMounted } from 'vue'

export interface DataFetchingOptions {
  api: any
  query: string
  getParams: () => Record
  transformResponse?: (data: any[]) => any[]
}

export function useDataFetching({
  api, 
  query, 
  getParams, 
  transformResponse = (data) => data
}: DataFetchingOptions) {
  const data = ref({
    items: [],
    loading: true,
    error: null,
    total: 0
  })

  const load = async () => {
    try {
      data.value.loading = true
      const params = getParams()
      const results = await api.run([{ 
        statement: query, 
        parameters: params 
      }])
      
      data.value.items = transformResponse(results[0])
      data.value.total = data.value.items.length
      data.value.loading = false
    } catch (error) {
      data.value.error = error
      data.value.loading = false
    }
  }

  watch(getParams, load, { deep: true })
  onMounted(load)

  return { 
    data, 
    load,
    refresh: load 
  }
}