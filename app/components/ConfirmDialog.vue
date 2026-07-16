<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
}>(), {
  confirmLabel: '確認',
  destructive: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleOpenChange(open: boolean) {
  if (!open && props.open)
    emit('cancel')
}
</script>

<template>
  <UiDialog :open="open" @update:open="handleOpenChange">
    <UiDialogContent :show-close-button="false">
      <UiDialogHeader>
        <UiDialogTitle>{{ title }}</UiDialogTitle>
        <UiDialogDescription>{{ description }}</UiDialogDescription>
      </UiDialogHeader>
      <UiDialogFooter>
        <UiButton type="button" variant="outline" @click="emit('cancel')">
          キャンセル
        </UiButton>
        <UiButton type="button" :variant="destructive ? 'destructive' : 'default'" @click="emit('confirm')">
          {{ confirmLabel }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
