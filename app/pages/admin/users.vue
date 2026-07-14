<script setup lang="ts">
import type { User } from "~~/server/database/schema"

definePageMeta({ middleware: ["require-admin"] })

const { user: currentUser } = useUserSession()
const { data: users, refresh } = await useFetch<User[]>("/api/admin/users", { key: "admin-users" })

const updatingId = ref<number | null>(null)
const roles = ["viewer", "editor", "admin"] as const

useHead({ title: "ユーザー管理" })

async function changeRole(target: User, role: typeof roles[number]) {
  if (role === target.role)
    return
  updatingId.value = target.id
  try {
    await $fetch("/api/admin/users", { method: "POST", body: { userId: target.id, role } })
    await refresh()
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl py-6">
    <h1 class="mb-6 text-xl font-semibold">
      ユーザー管理
    </h1>
    <UiTable>
      <UiTableHeader>
        <UiTableRow>
          <UiTableHead>ユーザー名</UiTableHead>
          <UiTableHead>Discord ID</UiTableHead>
          <UiTableHead>権限</UiTableHead>
        </UiTableRow>
      </UiTableHeader>
      <UiTableBody>
        <UiTableRow v-for="target in users" :key="target.id">
          <UiTableCell>{{ target.username }}</UiTableCell>
          <UiTableCell class="font-mono text-xs">
            {{ target.discordId }}
          </UiTableCell>
          <UiTableCell>
            <select
              class="rounded border bg-background px-2 py-1 text-sm"
              :value="target.role"
              :disabled="updatingId === target.id || (target.id === currentUser?.id && target.role === 'admin')"
              @change="changeRole(target, ($event.target as HTMLSelectElement).value as typeof roles[number])"
            >
              <option v-for="role in roles" :key="role" :value="role">
                {{ role }}
              </option>
            </select>
          </UiTableCell>
        </UiTableRow>
      </UiTableBody>
    </UiTable>
  </div>
</template>
