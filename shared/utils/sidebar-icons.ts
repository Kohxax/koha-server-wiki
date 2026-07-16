export const sidebarIconNames = [
  "Cog", "Server", "BookOpen", "Folder", "Info", "Wrench", "Hammer", "HardHat",
  "CircuitBoard", "Cpu", "Database", "Network", "Shield", "Terminal", "Code",
  "FileText", "Lightbulb", "Map", "Package", "Rocket",
] as const

export type SidebarIconName = typeof sidebarIconNames[number]

export const sidebarIconOptions: { name: SidebarIconName, label: string }[] = [
  { name: "Cog", label: "設定・工業" },
  { name: "Server", label: "サーバー" },
  { name: "BookOpen", label: "ドキュメント" },
  { name: "Folder", label: "フォルダ" },
  { name: "Info", label: "案内" },
  { name: "Wrench", label: "整備" },
  { name: "Hammer", label: "建築" },
  { name: "HardHat", label: "作業" },
  { name: "CircuitBoard", label: "回路" },
  { name: "Cpu", label: "CPU" },
  { name: "Database", label: "データ" },
  { name: "Network", label: "ネットワーク" },
  { name: "Shield", label: "セキュリティ" },
  { name: "Terminal", label: "コマンド" },
  { name: "Code", label: "開発" },
  { name: "FileText", label: "資料" },
  { name: "Lightbulb", label: "アイデア" },
  { name: "Map", label: "地図" },
  { name: "Package", label: "パッケージ" },
  { name: "Rocket", label: "プロジェクト" },
]
