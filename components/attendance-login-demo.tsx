"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type FormErrors = {
  account?: string
  password?: string
}

export function AttendanceLoginDemo() {
  const router = useRouter()
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formMessage, setFormMessage] = useState("")
  const [wechatOpen, setWechatOpen] = useState(false)
  const [otherWechat, setOtherWechat] = useState(false)
  const [wechatMessage, setWechatMessage] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormMessage("")

    const nextErrors: FormErrors = {}
    if (!account.trim()) nextErrors.account = "请输入员工工号或用户名。"
    if (!password) nextErrors.password = "请输入密码。"

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (account.trim().toLowerCase() !== "admin" || password !== "12345") {
      setErrors({
        account: "演示账号或密码不正确，请使用下方提供的登录信息。",
        password: "演示账号或密码不正确，请使用下方提供的登录信息。",
      })
      return
    }

    setErrors({})
    window.sessionStorage.setItem("attendance-demo-authenticated", "true")
    router.push("/attendance")
  }

  const openWechat = () => {
    setOtherWechat(false)
    setWechatMessage("")
    setWechatOpen(true)
  }

  const handleWechatAccount = () => {
    setWechatMessage("微信公众号授权尚未接入，当前微信账号无法验证，尚未登录。")
  }

  return (
    <main className="h5-shell login-shell">
      <div className="phone-frame login-phone">
        <div className="login-status-bar" aria-label="手机状态栏"><span>9:41</span><span aria-hidden="true">5G　◉　▰</span></div>
        <header className="p0-app-header"><span aria-hidden="true" /><h1>考勤打卡（天宇正清）</h1><span aria-hidden="true" /></header>
        

        <div className="login-content">
          <section className="login-intro" aria-labelledby="login-intro-title">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-emerald-800 shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-500" />让考勤简单、清晰、有序
            </div>
            <h1 id="login-intro-title" className="max-w-xl text-4xl font-semibold leading-[1.28] tracking-tight text-slate-900 lg:text-[48px]">
              每一次准时到岗，<br />都值得被认真记录。
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">
              登录员工考勤助手，查看班次安排、完成日常打卡，并跟进个人考勤记录。
            </p>
            <div className="mt-8 grid max-w-lg grid-cols-[minmax(0,1fr)_minmax(150px,190px)] items-center gap-4 sm:gap-6">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm">
                  <span className="mb-4 grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarCheck2 size={18} aria-hidden="true" /></span>
                  <strong className="block text-sm font-medium text-slate-800">班次与打卡</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">查看当天安排，及时完成签到签退</span>
                </div>
                <div className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm">
                  <span className="mb-4 grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><MapPin size={18} aria-hidden="true" /></span>
                  <strong className="block text-sm font-medium text-slate-800">考勤地点</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">确认考勤范围，了解打卡状态</span>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[174px] pb-8" aria-label="iPhone 16 上的考勤助手界面示意">
                <div className="relative z-10 rounded-[2.25rem] border-[5px] border-[#202321] bg-[#202321] p-[5px] shadow-[0_20px_40px_-18px_rgba(15,23,42,0.55)]">
                  <div className="relative min-h-[300px] overflow-hidden rounded-[1.7rem] bg-[#f5f8f5] px-3 pb-4 pt-4">
                    <div className="absolute left-1/2 top-2 h-[17px] w-[62px] -translate-x-1/2 rounded-full bg-[#202321]" aria-hidden="true" />
                    <div className="flex items-center justify-between pt-1 text-[8px] font-semibold text-slate-700"><span>9:41</span><span aria-hidden="true">●●● ▰</span></div>
                    <div className="mt-6 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-800"><CalendarCheck2 size={12} aria-hidden="true" />考勤助手</div>
                    <p className="mt-5 text-[8px] text-slate-500">星期一 · 6月16日</p>
                    <h3 className="mt-1 text-sm font-semibold tracking-tight text-slate-900">早上好，员工</h3>
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between"><span className="text-[8px] font-medium text-slate-500">今日签到</span><span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] text-emerald-700">待打卡</span></div>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-800">09:00</p>
                      <p className="mt-1 flex items-center gap-1 text-[7px] text-slate-400"><MapPin size={9} aria-hidden="true" />办公地点 · 范围内</p>
                    </div>
                    <div className="mt-3 rounded-lg bg-emerald-700 py-2.5 text-center text-[9px] font-semibold text-white">开始打卡</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white p-2"><span className="text-[7px] text-slate-400">本周出勤</span><strong className="mt-1 block text-[10px] text-slate-700">5 天</strong></div>
                      <div className="rounded-lg bg-white p-2"><span className="text-[7px] text-slate-400">本月迟到</span><strong className="mt-1 block text-[10px] text-slate-700">0 次</strong></div>
                    </div>
                    <div className="absolute bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-slate-300" aria-hidden="true" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 h-7 w-20 -translate-x-1/2 rounded-b-2xl border-x-[5px] border-b-[5px] border-[#b9c4bd]" aria-hidden="true" />
                <div className="absolute bottom-0 left-1/2 h-2 w-28 -translate-x-1/2 rounded-full bg-[#cbd5ce] shadow-sm" aria-hidden="true" />
                <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-slate-400">iPhone 16 · 界面示意</p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} aria-hidden="true" />员工账号仅供本人使用，请妥善保管登录信息
            </div>
          </section>

          <section className="login-card" aria-labelledby="login-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium tracking-[0.12em] text-emerald-700">员工入口</p>
                <h2 id="login-title" className="text-[26px] font-semibold tracking-tight text-slate-900">欢迎回来</h2>
                <p className="mt-2 text-sm text-slate-500">使用员工账号登录考勤系统</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Fingerprint size={23} aria-hidden="true" /></span>
            </div>

            <div className="login-demo-credentials" role="note">
              <span>演示账号</span><strong>admin</strong><span>密码</span><strong>12345</strong>
            </div>

            <form noValidate onSubmit={handleSubmit}>
              <FieldGroup className="gap-3">
                <Field data-invalid={Boolean(errors.account)}>
                  <FieldLabel htmlFor="attendance-account" className="text-xs font-medium text-slate-700">员工工号 / 用户名</FieldLabel>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                    <Input
                      id="attendance-account"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="请输入工号或用户名"
                      value={account}
                      aria-invalid={Boolean(errors.account)}
                      onChange={(event) => {
                        setAccount(event.target.value)
                        setErrors((current) => ({ ...current, account: undefined }))
                        setFormMessage("")
                      }}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/60 pl-10 text-sm shadow-none placeholder:text-slate-400 focus-visible:bg-white"
                    />
                  </div>
                  {errors.account && <FieldError className="text-xs">{errors.account}</FieldError>}
                  {!errors.account && <FieldDescription className="sr-only">请输入公司分配的员工工号或用户名。</FieldDescription>}
                </Field>

                <Field data-invalid={Boolean(errors.password)}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="attendance-password" className="text-xs font-medium text-slate-700">密码</FieldLabel>
                    <span className="text-[11px] text-slate-400">请妥善保管个人密码</span>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                    <Input
                      id="attendance-password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="请输入密码"
                      value={password}
                      aria-invalid={Boolean(errors.password)}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setErrors((current) => ({ ...current, password: undefined }))
                        setFormMessage("")
                      }}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/60 pl-10 pr-12 text-sm shadow-none placeholder:text-slate-400 focus-visible:bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      aria-label={passwordVisible ? "隐藏密码" : "显示密码"}
                      aria-pressed={passwordVisible}
                    >
                      {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </Button>
                  </div>
                  {errors.password && <FieldError className="text-xs">{errors.password}</FieldError>}
                  {!errors.password && <FieldDescription className="sr-only">请输入密码。</FieldDescription>}
                </Field>
              </FieldGroup>

              {formMessage && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900" role="alert">{formMessage}</p>}

              <Button type="submit" size="lg" className="mt-4 h-11 w-full rounded-xl text-sm font-semibold shadow-sm">
                登录考勤系统<ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            </form>

            <div className="login-alt-methods my-4 flex items-center gap-3 text-[11px] text-slate-400" aria-hidden="true">
              <Separator className="flex-1" /><span>其他登录方式</span><Separator className="flex-1" />
            </div>

            <Button type="button" variant="outline" size="lg" onClick={openWechat} className="login-alt-methods h-11 w-full gap-2.5 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
              <span className="grid size-6 place-items-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white" aria-hidden="true">微</span>
              微信账号登录
            </Button>
            <p className="mt-5 text-center text-xs leading-5 text-slate-400">如无法登录，请联系企业考勤管理员。</p>
          </section>
        </div>

        <footer className="login-page-footer">
          <span>© 2026 考勤助手</span>
          <span className="inline-flex items-center gap-1.5"><UsersRound size={13} aria-hidden="true" />企业员工专用入口</span>
        </footer>
      </div>

      {wechatOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) setWechatOpen(false)
          }}
        >
          <section className="relative w-full max-w-[390px] rounded-[26px] border border-white/80 bg-white p-6 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="wechat-dialog-title">
            <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-400" onClick={() => setWechatOpen(false)} aria-label="关闭微信账号选择">
              <X aria-hidden="true" />
            </Button>
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Fingerprint size={22} aria-hidden="true" /></div>
            <div className="text-center">
              <h2 id="wechat-dialog-title" className="text-lg font-semibold text-slate-900">微信账号登录</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">选择用于考勤系统的微信账号</p>
            </div>

            {!otherWechat ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">微</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="truncate text-sm font-medium text-slate-800">当前已登录的微信账号</strong>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check size={13} aria-hidden="true" />微信客户端已登录</span>
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-800">当前账号</span>
                </div>
                <Button type="button" onClick={handleWechatAccount} className="mt-4 h-11 w-full rounded-xl text-sm">
                  使用此微信账号
                </Button>
                <Button type="button" variant="outline" onClick={() => { setOtherWechat(true); setWechatMessage("") }} className="mt-2 h-11 w-full rounded-xl border-slate-200 text-sm">
                  使用其他微信账号
                </Button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound size={20} aria-hidden="true" /></span>
                <strong className="mt-3 block text-sm font-medium text-slate-800">切换微信账号</strong>
                <p className="mt-2 text-xs leading-5 text-slate-500">正式接入微信公众号授权后，可在微信中切换并确认要使用的账号。</p>
                <Button type="button" variant="outline" onClick={() => { setOtherWechat(false); setWechatMessage("") }} className="mt-4 h-10 w-full rounded-xl text-sm">
                  <ArrowLeft data-icon="inline-start" aria-hidden="true" />返回当前账号
                </Button>
              </div>
            )}

            {wechatMessage && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900" role="alert">{wechatMessage}</p>}
            <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">演示界面不会验证微信身份或创建登录会话。</p>
          </section>
        </div>
      )}
    </main>
  )
}
