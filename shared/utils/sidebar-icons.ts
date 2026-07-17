const legacySidebarIconNames = [
  "Cog", "Server", "BookOpen", "Folder", "Info", "Wrench", "Hammer", "HardHat",
  "CircuitBoard", "Cpu", "Database", "Network", "Shield", "Terminal", "Code",
  "FileText", "Lightbulb", "Map", "Package", "Rocket",
] as const

export const sidebarIconNames = [
  ...legacySidebarIconNames,
  "House", "Castle", "Factory", "Warehouse", "Pickaxe", "Shovel", "Sword", "Wheat",
  "Sprout", "Carrot", "Tractor", "Trees", "Mountain", "TrainTrack", "Fish", "CookingPot",
  "FlaskConical", "Zap",
] as const

export type SidebarIconName = typeof sidebarIconNames[number]

export const sidebarIconOptions: { name: SidebarIconName, label: string }[] = [
  { name: "House", label: "拠点・自宅" },
  { name: "Castle", label: "城・建築" },
  { name: "Factory", label: "工場" },
  { name: "Warehouse", label: "倉庫" },
  { name: "Pickaxe", label: "採掘" },
  { name: "Shovel", label: "整地" },
  { name: "Sword", label: "冒険・戦闘" },
  { name: "Wheat", label: "農業" },
  { name: "Sprout", label: "栽培" },
  { name: "Carrot", label: "畜産・農作物" },
  { name: "Tractor", label: "農場" },
  { name: "Trees", label: "林業・自然" },
  { name: "Mountain", label: "地形・採掘場" },
  { name: "TrainTrack", label: "鉄道・交通" },
  { name: "Fish", label: "釣り・水辺" },
  { name: "CookingPot", label: "料理" },
  { name: "FlaskConical", label: "醸造" },
  { name: "CircuitBoard", label: "レッドストーン" },
  { name: "Zap", label: "電力・自動化" },
  { name: "Map", label: "地図" },
]
