import { computed, inject, provide } from "vue"
import type { ComputedRef, InjectionKey } from "vue"

const diagramEditingKey: InjectionKey<ComputedRef<boolean>> = Symbol("diagram-editing")

export function provideDiagramEditing(isEditing: ComputedRef<boolean>) {
  provide(diagramEditingKey, isEditing)
}

export function useDiagramEditing() {
  return inject(diagramEditingKey, computed(() => false))
}
