import type { Metadata } from "next"
import { AttendanceLoginDemo } from "@/components/attendance-login-demo"

export const metadata: Metadata = {
  title: "员工登录 · 考勤助手",
  description: "员工考勤助手登录交互原型。",
}

export default function Page() {
  return <AttendanceLoginDemo />
}
