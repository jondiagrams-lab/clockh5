import type { Metadata } from "next"
import { AttendanceH5 } from "@/components/attendance-h5"

export const metadata: Metadata = {
  title: "考勤原型 · 考勤助手",
  description: "员工移动考勤助手交互原型。",
}

export default function AttendancePage() {
  return <AttendanceH5 />
}
