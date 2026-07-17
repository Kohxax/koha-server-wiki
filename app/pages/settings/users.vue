<script setup lang="ts">
import type { Role, UserDto } from "~~/shared/types/api"

definePageMeta({ middleware: ["require-admin"] })

const { user: currentUser } = useUserSession()
const { data: users, refresh } = await useFetch<UserDto[]>("/api/admin/users", { key: "admin-users" })

const updatingId = ref<number | null>(null)
const roles = ["viewer", "editor", "admin"] as const

useHead({ title: "ユーザー管理" })

async function changeRole(target: UserDto, role: Role) {
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
          <UiTableHead class="w-12">
            アイコン
          </UiTableHead>
          <UiTableHead>ユーザー名</UiTableHead>
          <UiTableHead>Discord ID</UiTableHead>
          <UiTableHead>権限</UiTableHead>
        </UiTableRow>
      </UiTableHeader>
      <UiTableBody>
        <UiTableRow v-for="target in users" :key="target.id">
          <UiTableCell>
            <UiAvatar class="size-8">
              <UiAvatarImage v-if="target.avatarUrl" :src="target.avatarUrl" :alt="target.username" />
              <UiAvatarFallback>{{ target.username.slice(0, 1).toUpperCase() }}</UiAvatarFallback>
            </UiAvatar>
          </UiTableCell>
          <UiTableCell>{{ target.username }}</UiTableCell>
          <UiTableCell class="font-mono text-xs">
            {{ target.discordId }}
          </UiTableCell>
          <UiTableCell>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton
                  size="sm"
                  variant="outline"
                  :disabled="updatingId === target.id || (target.id === currentUser?.id && target.role === 'admin')"
                >
                  {{ target.role }}
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="start">
                <UiDropdownMenuRadioGroup :model-value="target.role" @update:model-value="changeRole(target, $event as typeof roles[number])">
                  <UiDropdownMenuRadioItem v-for="role in roles" :key="role" :value="role">
                    {{ role }}
                  </UiDropdownMenuRadioItem>
                </UiDropdownMenuRadioGroup>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiTableCell>
        </UiTableRow>
      </UiTableBody>
    </UiTable>
  </div>
</template>
