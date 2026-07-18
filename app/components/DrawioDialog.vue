<script setup lang="ts">
import {
  buildExitAction,
  buildExportRequestAction,
  buildLoadAction,
  createDiagramMarkdown,
  dataUrlToBlob,
  DRAWIO_ORIGIN,
  parseDrawioMessage,
  shouldHandleDrawioMessage,
} from "~~/shared/utils/drawio"

const props = defineProps<{
  initialXml?: string
  editingMediaId?: number
}>()

const open = defineModel<boolean>("open", { default: false })
const emit = defineEmits<{
  insert: [markdown: string]
  saved: [media: { id: number, filename: string }]
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const saving = ref(false)
const exportRequested = ref(false)
const errorMessage = ref("")

const iframeSrc = computed(() => `${DRAWIO_ORIGIN}/?embed=1&proto=json&spin=1&ui=min`)

function postToDrawio(message: Record<string, unknown>) {
  iframeRef.value?.contentWindow?.postMessage(JSON.stringify(message), DRAWIO_ORIGIN)
}

async function handleExport(dataUrl: string) {
  if (saving.value)
    return

  saving.value = true
  errorMessage.value = ""
  try {
    const blob = dataUrlToBlob(dataUrl)
    const form = new FormData()
    form.append("file", blob, "diagram.svg")

    if (props.editingMediaId) {
      const updated = await $fetch<{ id: number, filename: string }>(`/api/media/${props.editingMediaId}`, {
        method: "PUT",
        body: form,
      })
      emit("saved", updated)
    } else {
      form.append("kind", "diagram")
      const created = await $fetch<{ id: number, filename: string }>("/api/media", { method: "POST", body: form })
      emit("insert", createDiagramMarkdown(created))
      emit("saved", created)
    }

    postToDrawio(buildExitAction())
    open.value = false
  } catch {
    errorMessage.value = "図の保存に失敗しました"
    exportRequested.value = false
  } finally {
    saving.value = false
  }
}

function onMessage(event: MessageEvent) {
  if (!shouldHandleDrawioMessage({
    origin: event.origin,
    isOpen: open.value,
    source: event.source,
    iframeWindow: iframeRef.value?.contentWindow ?? null,
  }))
    return

  const msg = parseDrawioMessage(event.data)
  if (!msg)
    return

  switch (msg.event) {
    case "init":
      postToDrawio(buildLoadAction(props.initialXml ?? ""))
      break
    case "save":
      if (saving.value || exportRequested.value)
        return
      exportRequested.value = true
      postToDrawio(buildExportRequestAction(msg.xml))
      break
    case "export":
      if (typeof msg.data === "string")
        void handleExport(msg.data)
      break
    case "exit":
      open.value = false
      break
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    saving.value = false
    exportRequested.value = false
    errorMessage.value = ""
  }
})

onMounted(() => window.addEventListener("message", onMessage))
onBeforeUnmount(() => window.removeEventListener("message", onMessage))
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="flex h-[90vh] max-w-[95vw] flex-col p-0 sm:max-w-[95vw]">
      <UiDialogHeader class="shrink-0 p-4 pb-0">
        <UiDialogTitle>図表エディタ (draw.io)</UiDialogTitle>
      </UiDialogHeader>
      <p v-if="errorMessage" class="px-4 text-sm text-destructive">
        {{ errorMessage }}
      </p>
      <p v-if="saving" class="px-4 text-sm text-muted-foreground">
        保存中...
      </p>
      <iframe
        v-if="open"
        ref="iframeRef"
        :src="iframeSrc"
        class="min-h-0 w-full flex-1 border-0"
        title="draw.io editor"
      />
    </UiDialogContent>
  </UiDialog>
</template>
