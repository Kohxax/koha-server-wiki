<script setup lang="ts">
import {
  BookOpenIcon, CircuitBoardIcon, CodeIcon, CogIcon, CpuIcon, DatabaseIcon, FileTextIcon,
  FolderIcon, HammerIcon, HardHatIcon, InfoIcon, LightbulbIcon, MapIcon, NetworkIcon,
  PackageIcon, RocketIcon, ServerIcon, ShieldIcon, TerminalIcon, WrenchIcon,
} from "@lucide/vue"
import type { Component } from "vue"
import type { SidebarIconName } from "~~/shared/utils/sidebar-icons"

interface TreeNode {
  label: string
  path?: string
  icon?: SidebarIconName
  children: TreeNode[]
}

defineProps<{ nodes: TreeNode[] }>()

const iconComponents: Record<SidebarIconName, Component> = {
  Cog: CogIcon,
  Server: ServerIcon,
  BookOpen: BookOpenIcon,
  Folder: FolderIcon,
  Info: InfoIcon,
  Wrench: WrenchIcon,
  Hammer: HammerIcon,
  HardHat: HardHatIcon,
  CircuitBoard: CircuitBoardIcon,
  Cpu: CpuIcon,
  Database: DatabaseIcon,
  Network: NetworkIcon,
  Shield: ShieldIcon,
  Terminal: TerminalIcon,
  Code: CodeIcon,
  FileText: FileTextIcon,
  Lightbulb: LightbulbIcon,
  Map: MapIcon,
  Package: PackageIcon,
  Rocket: RocketIcon,
}

function linkTo(path: string) {
  return path === "home" ? "/" : `/wiki/${path}`
}
</script>

<template>
  <ul class="space-y-1 text-sm">
    <li v-for="node in nodes" :key="node.path ?? node.label">
      <NuxtLink
        v-if="node.path"
        :to="linkTo(node.path)"
        class="flex items-center gap-2 rounded border-l-2 border-transparent px-2 py-1 hover:bg-muted"
        active-class="border-primary bg-primary/10 font-medium text-primary"
      >
        <component v-if="node.icon" :is="iconComponents[node.icon]" class="size-4 shrink-0" />
        {{ node.label }}
      </NuxtLink>
      <span v-else class="flex items-center gap-2 px-2 py-1 font-medium text-muted-foreground">
        <component v-if="node.icon" :is="iconComponents[node.icon]" class="size-4 shrink-0" />
        {{ node.label }}
      </span>
      <SidebarTree v-if="node.children.length" :nodes="node.children" class="ml-3 border-l pl-2" />
    </li>
  </ul>
</template>
