<script setup lang="ts">
import { PencilIcon } from "@lucide/vue"
import { useLinkPreviewContext } from "~/composables/link-preview"
import type { LinkPreviewRect } from "~/lib/link-preview-position"
import { canEdit as hasEditRole } from "~~/shared/utils/permissions"

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
const canEdit = computed(() => hasEditRole(user.value?.role))
const isEditing = useDiagramEditing()
const canReedit = computed(() => canEdit.value && isEditing.value)
const mediaId = computed(() => Number(props.mediaId))
const drawioDialogOpen = ref(false)
const initialXml = ref("")
const loading = ref(false)
const errorMessage = ref("")
const { versionedSrc, refreshVersion } = useDiagramMediaVersions()
const imageSrc = computed(() => versionedSrc(props.src))
const linkPreview = useLinkPreviewContext()

async function editDiagram() {
  if (!Number.isInteger(mediaId.value) || mediaId.value <= 0) {
    errorMessage.value = "図表情報が不正です"
    return
  }

  loading.value = true
  errorMessage.value = ""
  try {
    initialXml.value = await $fetch<string>(imageSrc.value, { responseType: "text" })
    drawioDialogOpen.value = true
  } catch {
    errorMessage.value = "図表を読み込めませんでした"
  } finally {
    loading.value = false
  }
}

function handleSaved() {
  refreshVersion(props.src)
}

const objectRef = ref<HTMLObjectElement>()
let linkedDocument: Document | undefined

function asElement(value: EventTarget | null): Element | null {
  if (!value || typeof value !== "object")
    return null

  const candidate = value as { closest?: unknown }
  return typeof candidate.closest === "function" ? value as Element : null
}

function linkFromTarget(target: EventTarget | null): Element | null {
  return asElement(target)?.closest("a") ?? null
}

function isWithinLink(target: EventTarget | null, link: Element): boolean {
  return linkFromTarget(target) === link
}

function getDiagramLinkRect(link: Element): LinkPreviewRect {
  const linkRect = link.getBoundingClientRect()
  const objectRect = objectRef.value?.getBoundingClientRect()
  const documentElement = link.ownerDocument.documentElement
  if (!objectRect || !documentElement.clientWidth || !documentElement.clientHeight)
    return linkRect

  const scaleX = objectRect.width / documentElement.clientWidth
  const scaleY = objectRect.height / documentElement.clientHeight
  return {
    left: objectRect.left + linkRect.left * scaleX,
    top: objectRect.top + linkRect.top * scaleY,
    right: objectRect.left + linkRect.right * scaleX,
    bottom: objectRect.top + linkRect.bottom * scaleY,
  }
}

function handleDiagramMouseOver(event: Event) {
  const link = linkFromTarget(event.target)
  if (link)
    linkPreview?.showLinkPreview(link, () => getDiagramLinkRect(link))
}

function handleDiagramMouseOut(event: MouseEvent) {
  const link = linkFromTarget(event.target)
  if (!link || isWithinLink(event.relatedTarget, link))
    return
  linkPreview?.hideLinkPreview()
}

function handleDiagramFocusIn(event: Event) {
  const link = linkFromTarget(event.target)
  if (link)
    linkPreview?.showLinkPreview(link, () => getDiagramLinkRect(link))
}

function handleDiagramFocusOut(event: FocusEvent) {
  const link = linkFromTarget(event.target)
  if (!link || isWithinLink(event.relatedTarget, link))
    return
  linkPreview?.hideLinkPreview()
}

function removeDiagramLinkListeners() {
  if (!linkedDocument)
    return
  linkedDocument.removeEventListener("mouseover", handleDiagramMouseOver)
  linkedDocument.removeEventListener("mouseout", handleDiagramMouseOut)
  linkedDocument.removeEventListener("focusin", handleDiagramFocusIn)
  linkedDocument.removeEventListener("focusout", handleDiagramFocusOut)
  linkedDocument = undefined
}

function prepareDiagramLinks() {
  const document = objectRef.value?.contentDocument
  if (!document)
    return

  removeDiagramLinkListeners()
  linkedDocument = document
  document.addEventListener("mouseover", handleDiagramMouseOver)
  document.addEventListener("mouseout", handleDiagramMouseOut)
  document.addEventListener("focusin", handleDiagramFocusIn)
  document.addEventListener("focusout", handleDiagramFocusOut)
  document.querySelectorAll("a").forEach((link) => {
    link.setAttribute("target", "_blank")
    link.setAttribute("rel", "noopener noreferrer")
  })
}

// ハイドレーション前にloadイベントが発火済みの場合に備えたフォールバック
onMounted(() => {
  prepareDiagramLinks()
})

onBeforeUnmount(() => {
  removeDiagramLinkListeners()
})
</script>

<template>
  <figure class="my-6">
    <div class="group relative">
      <object
        ref="objectRef"
        :data="imageSrc"
        type="image/svg+xml"
        :aria-label="alt || '図表'"
        class="mx-auto block h-auto max-w-full"
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
