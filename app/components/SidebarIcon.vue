<script setup lang="ts">
import {
  BookOpenIcon, CarrotIcon, CastleIcon, CircuitBoardIcon, CodeIcon, CogIcon, CookingPotIcon,
  CpuIcon, DatabaseIcon, FactoryIcon, FileTextIcon, FishIcon, FlaskConicalIcon, FolderIcon,
  HammerIcon, HardHatIcon, HouseIcon, InfoIcon, LightbulbIcon, MapIcon, MountainIcon, NetworkIcon,
  PackageIcon, PickaxeIcon, RocketIcon, ServerIcon, ShieldIcon, ShovelIcon, SproutIcon, SwordIcon,
  TerminalIcon, TractorIcon, TrainTrackIcon, TreesIcon, WarehouseIcon, WheatIcon, WrenchIcon, ZapIcon,
} from "@lucide/vue"
import type { Component } from "vue"
import type { SidebarIconName } from "~~/shared/utils/sidebar-icons"

defineProps<{ name: SidebarIconName }>()

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
  House: HouseIcon,
  Castle: CastleIcon,
  Factory: FactoryIcon,
  Warehouse: WarehouseIcon,
  Pickaxe: PickaxeIcon,
  Shovel: ShovelIcon,
  Sword: SwordIcon,
  Wheat: WheatIcon,
  Sprout: SproutIcon,
  Carrot: CarrotIcon,
  Tractor: TractorIcon,
  Trees: TreesIcon,
  Mountain: MountainIcon,
  TrainTrack: TrainTrackIcon,
  Fish: FishIcon,
  CookingPot: CookingPotIcon,
  FlaskConical: FlaskConicalIcon,
  Zap: ZapIcon,
}
</script>

<template>
  <component :is="iconComponents[name]" />
</template>
