<script setup>
import {
  QSpinner,
  QTabs,
  QTab,
  QTabPanels,
  QTabPanel,
  QTable,
  QTh,
  QTooltip,
  QInput,
  QBtn,
  QTr,
  QTd,
  QIcon,
  useQuasar,
  exportFile,
  QMarkupTable,
  copyToClipboard
} from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'
import '@/styles/chart.css'
import hljs from 'highlight.js'
import hljsCypher from 'highlightjs-cypher'
import 'highlight.js/scss/vs.scss'

hljs.registerLanguage('cypher', hljsCypher)

const iyp_api = inject('iyp_api')
const $q = useQuasar()

const props = defineProps(['countryCode', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const ixps = ref({
  data: [],
  loading: true,
  query: `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'peeringdb.ix'}]-(i:IXP)
    MATCH (i)-[:EXTERNAL_ID]-(p:PeeringdbIXID)
    OPTIONAL MATCH (i)-[:MANAGED_BY]-(o:Organization)
    OPTIONAL MATCH (i)-[:MEMBER_OF]-(a:AS)
    RETURN c.country_code AS cc, i.name AS ixp, p.id AS id, o.name AS org, COUNT(DISTINCT a) AS nb_members`,
  columns: [
    {
      name: 'IXP',
      label: 'PeeringDB ID',
      align: 'left',
      field: (row) => row.id,
      format: (val) => `IXP${val}`,
      sortable: true,
      description: 'Identifier used in the PeeringDB database and website.'
    },
    {
      name: 'Name',
      label: 'Name',
      align: 'left',
      field: (row) => row.ixp,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Name of the IXP as given by PeeringDB.'
    },
    {
      name: 'Number of members',
      label: 'Number of members',
      align: 'left',
      field: (row) => row.nb_members,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Number of members according to PeeringDB.'
    }
  ],
  pagination: {
    sortBy: 'Number of members',
    descending: true
  }
})

// Table specific reactive variables
const activeTab = ref('chart')
const filter = ref('')
const colToUnderline = ref(['IXP', 'Name'])
const metadata = ref({})
const loadingStatusMetadata = ref(false)
const cypherQuery = ref('')

const load = () => {
  ixps.value.loading = true
  // Run the cypher query
  let query_params = { cc: props.countryCode }
  // Update the Cypher query display with parameter substitution
  cypherQuery.value = ixps.value.query.replace(/\$cc/, `'${props.countryCode}'`)
  
  iyp_api.run([{ statement: ixps.value.query, parameters: query_params }]).then((results) => {
    ixps.value.data = results[0]
    ixps.value.loading = false
  })
}

// Export table functionality
const wrapCsvValue = (val, formatFn, row) => {
  let formatted = formatFn !== void 0 ? formatFn(val, row) : val

  formatted = formatted === void 0 || formatted === null ? '' : String(formatted)

  formatted = formatted.split('"').join('""')
  return `"${formatted}"`
}

const exportTable = () => {
  const content = [ixps.value.columns.map((col) => wrapCsvValue(col.label))]
    .concat(
      ixps.value.data.map((row) =>
        ixps.value.columns
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : row[col.field === void 0 ? col.name : col.field],
              col.format,
              row
            )
          )
          .join(',')
      )
    )
    .join('\r\n')

  const status = exportFile('ixps-export.csv', content, 'text/csv')

  if (status !== true) {
    $q.notify({
      message: 'Browser denied file download...',
      color: 'negative',
      icon: 'warning'
    })
  }
}

// Navigation functions
const toUnderline = (name) => {
  if (colToUnderline.value.includes(name)) {
    return {
      underline: true,
      'cursor-pointer': true
    }
  }
}

const routeToEntity = (entity, data) => {
  if (entity === 'IXP') {
    let ixpid = Array.isArray(data.id) ? data.id[0] : data.id
    routeToIXP(ixpid)
  }
}

const routeToIXP = (id) => {
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: `IXP${id}` }
    })
  )
}

// Metadata functionality - this section is critical for the Metadata tab
const getMetadataQuery = () => {
  // Start with the base query from ixps
  let query = ixps.value.query.replace(/(RETURN|return)(?:.)*/gm, '')
  query = query.replace(/(CALL|call)(?:.|\n)*}/gm, '')
  query = query.replace(/(ORDER|order)(?:.|\n)*/gm, '')
  query = query.replace(/(WHERE|where)(?:.|n)*/gm, '')
  query = query.replace(/\[(?:.)*?:/gm, '[:')
  query = query.replace(/\*(?!\d)/gm, '')
  query = query.split('[:')
  const queryVars = []
  for (let i = 1; i < query.length; i++) {
    queryVars.push(`edge${i - 1}`)
    query[i] = `${queryVars[i - 1]}:${query[i]}`
  }
  query = `${query.join('[')} `
  const collectList = `WITH *, CASE WHEN var0 IS :: LIST<RELATIONSHIP> THEN var0 ELSE [var0] END AS var
    WITH *, head(var) AS var0
    WITH *, COLLECT(DISTINCT [var0.reference_org, var0.reference_url_data, var0.reference_url_info, var0.reference_time_fetch, var0.reference_time_modification]) AS var1`
  const listVars = []
  queryVars.forEach((el, index) => {
    listVars.push(`list${index}`)
    query += collectList.replaceAll('var0', el).replace('var1', listVars[index])
    if (index < queryVars.length - 1) {
      query += ' '
    }
  })
  query += ` UNWIND ${listVars.join('+')} AS metadata_list RETURN DISTINCT metadata_list`
  // Include parameter substitution for metadata query
  return query.replace(/\$cc/, `'${props.countryCode}'`)
}

const parseDate = (date) => {
  let date_obj
  if (date === null) {
    return '-'
  } else if (typeof date == 'string') {
    date_obj = new Date(date)
  } else {
    date_obj = new Date(date.toString())
  }
  return date_obj.toLocaleDateString('en-us', { month: 'long', day: 'numeric', year: 'numeric' })
}

const fetchMetadata = async () => {
  loadingStatusMetadata.value = true
  try {
    // Clear previous metadata
    metadata.value = {}
    
    // Get the metadata query with proper parameter substitution
    const metadataQuery = getMetadataQuery()
    
    let res = await iyp_api.run([{ 
      statement: metadataQuery
      // Note: We're not passing parameters here because we substituted them directly in the query
    }])
    
    res[0].forEach((obj) => {
      const list = obj.metadata_list
      if (list[0] === null) {
        return
      }
      const date_fetch = parseDate(list[3])
      const date_modification = parseDate(list[4])
      if (list[0] in metadata.value) {
        metadata.value[list[0]].reference_time_fetch.push(date_fetch)
        metadata.value[list[0]].reference_time_modification.push(date_modification)
        metadata.value[list[0]].reference_url_data.push(list[1])
        metadata.value[list[0]].reference_url_info.push(list[2])
      } else {
        metadata.value[list[0]] = {
          reference_time_fetch: [date_fetch],
          reference_time_modification: [date_modification],
          reference_url_data: [list[1]],
          reference_url_info: [list[2]]
        }
      }
    })
    loadingStatusMetadata.value = false
  } catch (e) {
    console.error("Error fetching metadata:", e)
    loadingStatusMetadata.value = false
    return
  }
}

// Tab transition handler
const transition = (newVal, oldVal) => {
  if (newVal === 'metadata') {
    fetchMetadata()
  }
}

// Watchers
watch(
  () => props.countryCode,
  () => {
    load()
    // Clear metadata when country code changes
    metadata.value = {}
  }
)

watch(activeTab, () => {
  if (activeTab.value === 'chart') {
    // Chart-specific functionality can be added here
  }
})

watch(
  () => ixps.value.data,
  () => {
    // If no data, switch to data tab
    if (!ixps.value.data.length) {
      activeTab.value = 'data'
    }
  }
)

onMounted(() => {
  load()
  // If no chart data, switch to data tab
  if (!ixps.value.data.length) {
    activeTab.value = 'data'
  }
})
</script>

<template>
  <div>
    <div
      v-if="ixps.loading || loadingStatusMetadata"
      class="IHR_loading-spinner"
      style="z-index: 1000"
    >
      <QSpinner color="secondary" size="15em" />
    </div>
    <div>
      <QTabs
        v-model="activeTab"
        class="table-card text-grey bg-grey-2"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="chart" label="CHART" :disable="ixps.data.length <= 0" />
        <QTab name="data" label="DATA" />
        <QTab name="api" label="CYPHER QUERY" />
        <QTab name="metadata" label="METADATA" />
      </QTabs>
      <QTabPanels v-model="activeTab" animated @transition="transition">
        <QTabPanel name="chart">
          <div id="chartContainer">
            <div class="col-6">
              <IypGenericTreemapChart
                v-if="ixps.data.length > 0"
                :chart-data="ixps.data"
                :chart-layout="{ title: 'IXPs in ' + pageTitle + ' weighted by their number of members' }"
                :config="{
                  keys: ['org', 'ixp'],
                  keyValue: 'nb_members',
                  root: pageTitle,
                  hovertemplate: '<b>%{label}</b><br>%{value} members<extra></extra>'
                }"
                @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'ixpName' } })"
              />
            </div>
          </div>
        </QTabPanel>
        <QTabPanel name="data">
          <QTable :rows="ixps.data" :columns="ixps.columns" :filter="filter" :pagination="ixps.pagination" flat>
            <template #header-cell="props">
              <QTh :props="props">
                <QTooltip v-if="props.col.description" anchor="bottom start" self="bottom start">
                  {{ props.col.description }}
                </QTooltip>
                {{ props.col.label }}
              </QTh>
            </template>
            <template #top-right>
              <QInput v-model="filter" debounce="300" placeholder="Search">
                <template #append>
                  <QIcon name="search" />
                  <QTooltip class="bg-accent"> Search in the table </QTooltip>
                </template>
              </QInput>
              <QBtn flat rounded icon-right="archive" @click="exportTable">
                <QTooltip class="bg-accent"> Download CSV file </QTooltip>
              </QBtn>
            </template>
            <template #body="props">
              <QTr :props="props">
                <QTd
                  v-for="column in ixps.columns"
                  :key="column.name"
                  :class="toUnderline(column.name)"
                  :props="props"
                  @click="routeToEntity(column.name, props.row)"
                >
                  {{ column.format(column.field(props.row)) }}
                </QTd>
              </QTr>
            </template>
          </QTable>
        </QTabPanel>
        <QTabPanel name="api" class="text-left q-pa-lg" light>
          <QBtn
            no-caps
            dense
            flat
            @click="copyToClipboard(cypherQuery.replace(/^\s+|\s+$/gm, ''))"
            style="width: 100%"
            align="left"
          >
            <pre
              style="text-align: left"
            ><code style="white-space: pre-wrap;" v-html="hljs.highlight(cypherQuery.replace(/^\s+|\s+$/gm, ''), { language: 'cypher' }).value"></code></pre>
            <QTooltip>Click to copy</QTooltip>
          </QBtn>
          <div>
            <br />IYP Public Instance Link:
            <a href="https://iyp.iijlab.net/">https://iyp.iijlab</a>
            </div>
            </QTabPanel>
            </QTabPanels>
            </div>
            </div>
            </template>