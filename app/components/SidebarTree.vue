<script setup lang="ts">
interface TreeNode {
  label: string
  path?: string
  children: TreeNode[]
}

defineProps<{ nodes: TreeNode[] }>()

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
        class="block rounded px-2 py-1 hover:bg-muted"
        active-class="bg-muted font-medium"
      >
        {{ node.label }}
      </NuxtLink>
      <span v-else class="block px-2 py-1 font-medium text-muted-foreground">
        {{ node.label }}
      </span>
      <SidebarTree v-if="node.children.length" :nodes="node.children" class="ml-3 border-l pl-2" />
    </li>
  </ul>
</template>
