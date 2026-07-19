<script setup lang="ts">
import { PencilIcon } from "@lucide/vue"

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  mediaId?: string | number
}>(), {
  src: "",
  alt: "",
  mediaId: "",
})

const { user } = useUserSession()
const canEdit = computed(() => user.value?.role === "editor" || user.value?.role === "admin")
const isEditing = useDiagramEditing()
const canReedit = computed(() => canEdit.value && isEditing.value)
const mediaId = computed(() => Number(props.mediaId))
const drawioDialogOpen = ref(false)
const initialXml = ref("")
const loading = ref(false)
const errorMessage = ref("")
const imageVersion = ref(0)
const imageSrc = computed(() => imageVersion.value > 0
  ? `${props.src}${props.src.includes("?") ? "&" : "?"}v=${imageVersion.value}`
  : props.src)

async function editDiagram() {
  if (!Number.isInteger(mediaId.value) || mediaId.value <= 0) {
    errorMessage.value = "図表情報が不正です"
    return
  }

  loading.value = true
  errorMessage.value = ""
  try {
    initialXml.value = await $fetch<string>(props.src, { responseType: "text" })
    drawioDialogOpen.value = true
  } catch {
    errorMessage.value = "図表を読み込めませんでした"
  } finally {
    loading.value = false
  }
}

function handleSaved() {
  imageVersion.value = Date.now()
}

function prepareDiagramLinks(event: Event) {
  const object = event.currentTarget as HTMLObjectElement
  object.contentDocument?.querySelectorAll("a").forEach((link) => {
    link.setAttribute("target", "_blank")
    link.setAttribute("rel", "noopener noreferrer")
  })
}
</script>

<template>
  <figure class="my-6">
    <div class="group relative">
      <object
        :data="imageSrc"
        type="image/svg+xml"
        :aria-label="alt || '図表'"
        class="block h-auto w-full max-w-full border border-border"
        @load="prepareDiagramLinks"
      />
      <UiButton
        v-if="canReedit"
        type="button"
        variant="secondary"
        size="sm"
        class="absolute right-2 bottom-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        :disabled="loading"
        @click="editDiagram"
      >
        <PencilIcon />
        draw.ioで再編集
      </UiButton>
    </div>
    <figcaption v-if="$slots.default || alt" class="mt-2 text-center text-xs text-muted-foreground">
      <MDCSlot unwrap="p">{{ alt }}</MDCSlot>
    </figcaption>
    <p v-if="errorMessage" class="mt-2 text-center text-xs text-destructive">
      {{ errorMessage }}
    </p>

    <DrawioDialog
      v-if="canReedit"
      v-model:open="drawioDialogOpen"
      :initial-xml="initialXml"
      :editing-media-id="mediaId"
      @saved="handleSaved"
    />
  </figure>
</template>
