<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useNetworkDetails } from './useNetworkDetails'
import HostNameRouting from '@/components/networks/hostName/HostNameRouting.vue'
import HostNameDNS from '@/components/networks/hostName/HostNameDNS.vue'
import HostNameRankings from '@/components/networks/hostName/HostNameRankings.vue'
import HostNameCustom from '@/components/networks/hostName/HostNameCustom.vue'

const { 
  activeMenu, 
  routeHash, 
  pageTitle, 
  identifier: domainName 
} = useNetworkDetails({
  activeTab: 'routing',
  identifierKey: 'hostname',
  routeName: 'hostname',
  getInfoQuery: (hostname) => [{ 
    statement: `MATCH (d:HostName {name: $hostname}) RETURN d.name AS name`, 
    parameters: { hostname } 
  }]
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer">
    <h1 class="text-center">
      {{ pageTitle }}
    </h1>
    <h3 class="text-center">
      <div>Weekly report</div>
    </h3>
    <QCard flat>
      <QTabs
        v-model="activeMenu"
        dense
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="routing"> Routing </QTab>
        <QTab name="dns"> DNS </QTab>
        <QTab name="rankings"> Rankings </QTab>
        <QTab name="custom"> Custom </QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels v-if="pageTitle" v-model="activeMenu">
        <QTabPanel name="routing">
          <HostNameRouting :page-title="pageTitle" :host-name="domainName" />
        </QTabPanel>
        <QTabPanel name="dns">
          <HostNameDNS :page-title="pageTitle" :host-name="domainName" />
        </QTabPanel>
        <QTabPanel name="rankings">
          <HostNameRankings :page-title="pageTitle" :host-name="domainName" />
        </QTabPanel>
        <QTabPanel name="custom">
          <HostNameCustom :page-title="pageTitle" :host-name="domainName" :hash="routeHash" />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style>
.cards {
  display: inline-block;
}
</style>