<script setup lang="ts">
import {
  ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, BookOpenIcon, CircuitBoardIcon,
  CodeIcon, CogIcon, CpuIcon, DatabaseIcon, FileTextIcon, FolderIcon, HammerIcon, HardHatIcon,
  InfoIcon, LightbulbIcon, MapIcon, NetworkIcon, PackageIcon, RocketIcon, ServerIcon, ShieldIcon,
  TerminalIcon, WrenchIcon, XIcon,
} from "@lucide/vue"
import type { Component } from "vue"
import type { TreeNode } from "~~/server/utils/tree"
import { sidebarIconOptions, type SidebarIconName } from "~~/shared/utils/sidebar-icons"
import {
  indentNode,
  moveNodeDown,
  moveNodeUp,
  outdentNode,
  outlineToTree,
  treeToOutline,
  type OutlineNode,
} from "~~/shared/utils/sidebar-outline"

definePageMeta({ middleware: ["require-editor"] })

interface SidebarResponse { mode: "auto" | "manual", tree: TreeNode[], manualTree: TreeNode[] }

const { data: sidebar, refresh } = await useFetch<SidebarResponse>("/api/sidebar", { key: "admin-sidebar" })
const { data: allPagesTree } = await useFetch<TreeNode[]>("/api/pages/tree", { key: "admin-sidebar-pages" })

const mode = ref<"auto" | "manual">(sidebar.value?.mode ?? "auto")
// The outline editor always works on the persisted manual tree, independent of the
// currently displayed mode, so switching auto -> manual -> auto never loses edits.
const outline = ref<OutlineNode[]>(treeToOutline(sidebar.value?.manualTree ?? []))
const saving = ref(false)
let nextId = 0

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

function availablePages(): { path: string, label: string }[] {
  const result: { path: string, label: string }[] = []
  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.path)
        result.push({ path: node.path, label: node.label })
      walk(node.children)
    }
  }
  walk(allPagesTree.value ?? [])
  return result
}

async function changeMode(newMode: "auto" | "manual") {
  mode.value = newMode
  await $fetch("/api/sidebar", { method: "PUT", body: { mode: newMode } })
  await Promise.all([refresh(), refreshNuxtData("sidebar")])
}

function addHeading() {
  outline.value = [...outline.value, { id: `new${nextId++}`, label: "新しい見出し", level: 0 }]
}

function addPage(path: string) {
  const page = availablePages().find(p => p.path === path)
  if (!page)
    return
  outline.value = [...outline.value, { id: `new${nextId++}`, label: page.label, path: page.path, level: 0 }]
}

function removeNode(index: number) {
  outline.value = outline.value.filter((_, i) => i !== index)
}

function setIcon(index: number, icon?: SidebarIconName) {
  const node = outline.value[index]
  if (!node)
    return
  outline.value[index] = { ...node, icon }
}

async function saveTree() {
  saving.value = true
  try {
    await $fetch("/api/sidebar", { method: "PUT", body: { tree: outlineToTree(outline.value) } })
    await Promise.all([refresh(), refreshNuxtData("sidebar")])
  } finally {
    saving.value = false
  }
}

const selectedPageToAdd = ref("")

useHead({ title: "サイドバー設定" })
</script>

<template>
  <div class="mx-auto max-w-3xl py-6">
    <h1 class="mb-6 text-xl font-semibold">
      サイドバー設定
    </h1>

    <div class="mb-6 flex items-center gap-4">
      <span class="text-sm font-medium">モード:</span>
      <UiButton :variant="mode === 'auto' ? 'default' : 'outline'" size="sm" @click="changeMode('auto')">
        自動
      </UiButton>
      <UiButton :variant="mode === 'manual' ? 'default' : 'outline'" size="sm" @click="changeMode('manual')">
        手動
      </UiButton>
    </div>

    <template v-if="mode === 'manual'">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <UiButton size="sm" variant="outline" @click="addHeading">
          見出しを追加
        </UiButton>
        <select v-model="selectedPageToAdd" class="border bg-background px-2 py-1 text-sm">
          <option value="" disabled>
            ページを選択...
          </option>
          <option v-for="page in availablePages()" :key="page.path" :value="page.path">
            {{ page.label }} ({{ page.path }})
          </option>
        </select>
        <UiButton
          size="sm"
          variant="outline"
          :disabled="!selectedPageToAdd"
          @click="addPage(selectedPageToAdd); selectedPageToAdd = ''"
        >
          ページを追加
        </UiButton>
      </div>

      <ul class="space-y-1">
        <li
          v-for="(node, index) in outline"
          :key="node.id"
          class="flex items-center gap-2 border p-2"
          :style="{ marginLeft: `${node.level * 1.5}rem` }"
        >
          <UiInput v-model="node.label" class="h-7 flex-1" :disabled="!!node.path" />
          <span v-if="node.path" class="whitespace-nowrap text-xs text-muted-foreground">
            {{ node.path }}
          </span>
          <UiDropdownMenu v-if="!node.path">
            <UiDropdownMenuTrigger as-child>
              <UiButton size="icon-sm" variant="ghost" title="アイコンを選択">
                <component :is="node.icon ? iconComponents[node.icon] : FolderIcon" />
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end" class="w-72 p-2">
              <div class="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
                アイコンを選択（{{ sidebarIconOptions.length }}種類）
                <UiButton size="sm" variant="ghost" @click="setIcon(index)">なし</UiButton>
              </div>
              <div class="grid grid-cols-5 gap-1">
                <UiButton
                  v-for="option in sidebarIconOptions"
                  :key="option.name"
                  size="icon-sm"
                  :variant="node.icon === option.name ? 'secondary' : 'ghost'"
                  :title="option.label"
                  @click="setIcon(index, option.name)"
                >
                  <component :is="iconComponents[option.name]" />
                </UiButton>
              </div>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
          <UiButton size="icon-sm" variant="ghost" title="上へ" @click="outline = moveNodeUp(outline, index)">
            <ArrowUpIcon />
          </UiButton>
          <UiButton size="icon-sm" variant="ghost" title="下へ" @click="outline = moveNodeDown(outline, index)">
            <ArrowDownIcon />
          </UiButton>
          <UiButton size="icon-sm" variant="ghost" title="インデント" @click="outline = indentNode(outline, index)">
            <ArrowRightIcon />
          </UiButton>
          <UiButton size="icon-sm" variant="ghost" title="アウトデント" @click="outline = outdentNode(outline, index)">
            <ArrowLeftIcon />
          </UiButton>
          <UiButton size="icon-sm" variant="ghost" title="削除" @click="removeNode(index)">
            <XIcon />
          </UiButton>
        </li>
      </ul>

      <UiButton class="mt-4" :disabled="saving" @click="saveTree">
        保存
      </UiButton>
    </template>

    <p v-else class="text-sm text-muted-foreground">
      現在は自動モードです。ページのパス階層から自動的にツリーが生成されます。
    </p>
  </div>
</template>
