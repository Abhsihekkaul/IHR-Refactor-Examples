import { ref, watch, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import report from '@/plugins/report'

export function useNetworkDetails(options: {
  activeTab?: string
  getInfoQuery: (identifier: any) => any[]
  routeName: string
  identifierKey: string
}) {
  const {
    activeTab = 'overview', 
    getInfoQuery, 
    routeName, 
    identifierKey
  } = options

  const iyp_api = inject('iyp_api')
  const route = useRoute()
  const router = useRouter()

  const activeMenu = ref(route.query.active ? route.query.active : activeTab)
  const routeHash = ref(route.hash)
  const loadingStatus = ref(false)
  const identifier = ref(route.params[identifierKey])
  const entityName = ref(null)

  const fetchData = async () => {
    if (!identifier.value) return

    let queries = getInfoQuery(identifier.value)
    loadingStatus.value = true

    try {
      let res = await iyp_api.run(queries)
      entityName.value = res[0][0].name
      loadingStatus.value = false
    } catch (e) {
      loadingStatus.value = false
      console.error('Failed to fetch data:', e)
    }
  }

  const pageTitle = computed(() => {
    return entityName.value
  })

  const pushRoute = () => {
    router.push(
      Tr.i18nRoute({
        replace: true,
        query: Object.assign({}, route.query, {
          active: activeMenu.value
        })
      })
    )
  }

  watch(
    () => route.params[identifierKey],
    (newIdentifier) => {
      if (newIdentifier !== identifier.value) {
        identifier.value = newIdentifier
        if (identifier.value) {
          activeMenu.value = activeTab
          fetchData()
        }
      }
    }
  )

  watch(activeMenu, () => {
    if ('display' in route.query) {
      delete route.query.display
    }
    pushRoute()
  })

  onMounted(() => {
    if (identifier.value) {
      fetchData()
    } else {
      router.push(
        Tr.i18nRoute({
          name: routeName
        })
      )
    }
  })

  return {
    activeMenu,
    routeHash,
    loadingStatus,
    identifier,
    entityName,
    pageTitle,
    fetchData
  }
}