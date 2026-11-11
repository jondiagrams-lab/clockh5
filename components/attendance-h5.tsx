"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Fingerprint,
  Home,
  MapPin,
  Plane,
  ShieldCheck,
  UserRound,
  Wifi,
  X,
} from "lucide-react"

type Tab = "首页" | "考勤" | "申请" | "我的"
type ViewMode = "日" | "周" | "月"
type ApplicationKind = "补卡申请" | "请假申请" | "出差申请" | "外出申请" | "加班申请"

const navItems: { label: Tab; icon: typeof Home }[] = [
  { label: "首页", icon: Home },
  { label: "考勤", icon: CalendarDays },
  { label: "申请", icon: FileText },
  { label: "我的", icon: UserRound },
]

const requestItems: { kind: ApplicationKind; icon: typeof Clock3; hint: string }[] = [
  { kind: "补卡申请", icon: Clock3, hint: "漏打卡后提交" },
  { kind: "请假申请", icon: CalendarDays, hint: "按假期规则申请" },
  { kind: "出差申请", icon: Plane, hint: "出差计划与审批" },
  { kind: "外出申请", icon: MapPin, hint: "工作外出备案" },
  { kind: "加班申请", icon: BriefcaseBusiness, hint: "按组织规则申请" },
]

const localISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const todayISO = () => localISO(new Date())
const parseISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}
const shiftDate = (value: string, amount: number) => {
  const date = parseISODate(value)
  date.setDate(date.getDate() + amount)
  return localISO(date)
}
const dateLabel = (value: string, options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", weekday: "long" }) =>
  new Intl.DateTimeFormat("zh-CN", options).format(parseISODate(value))
const getWeekDates = (selected: string) => {
  const start = parseISODate(selected)
  const dayOfWeek = start.getDay() || 7
  start.setDate(start.getDate() - dayOfWeek + 1)
  return Array.from({ length: 7 }, (_, index) => localISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)))
}
const getMonthGrid = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_, index) => localISO(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)))
}
const formatMonth = (month: Date) => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(month)

export function AttendanceH5() {
  const today = todayISO()
  const [activeTab, setActiveTab] = useState<Tab>("首页")
  const [loginOpen, setLoginOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [requestKind, setRequestKind] = useState<ApplicationKind | null>(null)
  const [attendanceMode, setAttendanceMode] = useState<ViewMode>("日")
  const [selectedDate, setSelectedDate] = useState(today)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseISODate(today)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [applicationFilter, setApplicationFilter] = useState("全部")

  const openLogin = () => {
    setLoginOpen(true)
    setRequestKind(null)
  }

  const openRequest = (kind: ApplicationKind) => {
    setRequestKind(kind)
    setLoginOpen(true)
  }

  const openDate = (date: string) => {
    setSelectedDate(date)
    const parsed = parseISODate(date)
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }

  return <main className="h5-shell">
    <div className="phone-frame">
      <StatusBar />
      <header className="topbar">
        <Brand />
        <button className="p0-user-entry" onClick={openLogin}><UserRound size={15} /><span>登录</span><ChevronRight size={14} /></button>
      </header>

      {activeTab === "首页" && <HomeScreen onLogin={openLogin} onRules={() => setRulesOpen(true)} onTab={setActiveTab} onRequest={openRequest} />}
      {activeTab === "考勤" && <AttendanceScreen
        mode={attendanceMode}
        setMode={setAttendanceMode}
        today={today}
        selectedDate={selectedDate}
        onSelectDate={openDate}
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        onRequest={() => openRequest("补卡申请")}
        onLogin={openLogin}
      />}
      {activeTab === "申请" && <ApplicationsScreen filter={applicationFilter} setFilter={setApplicationFilter} onRequest={openRequest} onLogin={openLogin} />}
      {activeTab === "我的" && <ProfileScreen onLogin={openLogin} onRules={() => setRulesOpen(true)} />}

      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={activeTab === label ? "nav-active" : ""} aria-current={activeTab === label ? "page" : undefined} onClick={() => setActiveTab(label)}>
          <Icon size={20} /><span>{label}</span>
        </button>)}
      </nav>

      {loginOpen && <LoginSheet requestKind={requestKind} onClose={() => { setLoginOpen(false); setRequestKind(null) }} />}
      {rulesOpen && <RulesSheet onClose={() => setRulesOpen(false)} />}
    </div>
    <ProductNote />
  </main>
}

function StatusBar() {
  const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })
  return <div className="status-bar"><span>{time}</span><div className="status-icons"><span>5G</span><Wifi size={15} /><span className="battery"><i /></span></div></div>
}

function Brand() {
  return <><div className="brand-mark"><Fingerprint size={20} /></div><div className="brand-copy"><strong>考勤助手</strong><span>员工服务</span></div></>
}

function HomeScreen({ onLogin, onRules, onTab, onRequest }: {
  onLogin: () => void
  onRules: () => void
  onTab: (tab: Tab) => void
  onRequest: (kind: ApplicationKind) => void
}) {
  const today = todayISO()
  return <section className="page-content">
    <div className="welcome-row"><div><p className="eyebrow">{dateLabel(today)}</p><h1>考勤服务</h1><p className="subtle">登录后查看本人班次、打卡与考勤安排</p></div><div className="avatar"><UserRound size={20} /></div></div>

    <section className="p0-card p0-identity-state">
      <span className="p0-state-icon"><ShieldCheck size={19} /></span>
      <div><strong>尚未登录</strong><span>完成企业身份认证后，读取个人考勤数据</span></div>
      <button className="p0-login-cta" onClick={onLogin}>登录 <ChevronRight size={15} /></button>
    </section>

    <section className="p0-card p0-shift">
      <div className="p0-card-head"><div><p className="eyebrow">TODAY&apos;S SHIFT</p><h2>今日班次</h2></div><button className="p0-rule-link" onClick={onRules}>打卡规则 <ChevronRight size={15} /></button></div>
      <div className="p0-empty p0-shift-empty"><CalendarDays size={21} /><strong>暂无班次信息</strong><span>登录后读取排班、班次时间与当天考勤日历</span></div>
    </section>

    <section className="p0-card p0-current-location">
      <div className="p0-location-top"><span className="p0-site-icon"><MapPin size={18} /></span><div><span>位置与考勤范围</span><strong>登录后获取定位并校验围栏</strong></div><LockMarker /></div>
      <div className="p0-location-steps" aria-label="打卡流程"><span className="is-current">登录身份</span><i /><span>获取定位</span><i /><span>校验范围</span><i /><span>确认打卡</span></div>
      <p className="p0-location-copy">未登录前不会请求设备定位；打卡前将先校验当天排班和有效考勤地点。</p>
      <button className="p0-secondary p0-full-button" onClick={onLogin}>登录后获取位置 <ArrowRight size={15} /></button>
    </section>

    <button className="p0-punch" disabled aria-describedby="p0-punch-hint"><Fingerprint size={22} /><span>登录后打卡<small id="p0-punch-hint">需先取得身份、班次、考勤地点与服务端范围校验结果</small></span><ChevronRight size={19} /></button>

    <div className="p0-actions-title"><h2>考勤申请</h2><button className="p0-inline-link" onClick={() => onTab("申请")}>申请记录 <ChevronRight size={14} /></button></div>
    <div className="p0-request-grid">{requestItems.map(({ kind, icon: Icon, hint }) => <button key={kind} onClick={() => onRequest(kind)}><span><Icon size={17} /></span><strong>{kind.replace("申请", "")}</strong><small>{hint}</small></button>)}</div>

    <button className="p0-attendance-entry" onClick={() => onTab("考勤")}><CalendarDays size={18} /><span><strong>考勤统计</strong><small>按日查明细，按周 / 月查看统计</small></span><ChevronRight size={17} /></button>
  </section>
}

function LockMarker() {
  return <span className="p0-unavailable-pill"><AlertCircle size={13} />待登录</span>
}

function AttendanceScreen({ mode, setMode, today, selectedDate, onSelectDate, visibleMonth, onMonthChange, onRequest, onLogin }: {
  mode: ViewMode
  setMode: (value: ViewMode) => void
  today: string
  selectedDate: string
  onSelectDate: (value: string) => void
  visibleMonth: Date
  onMonthChange: (value: Date) => void
  onRequest: () => void
  onLogin: () => void
}) {
  const weekDates = getWeekDates(selectedDate)
  const monthDates = getMonthGrid(visibleMonth)
  const monthDays = Array.from({ length: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate() }, (_, index) => localISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)))
  const monthLabel = formatMonth(visibleMonth)
  const moveDate = (amount: number) => onSelectDate(shiftDate(selectedDate, amount))
  const showToday = () => onSelectDate(today)
  const showMonth = (amount: number) => onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1))
  const selectCalendarDate = (value: string) => onSelectDate(value)

  return <section className="page-content subpage p0-attendance-page">
    <p className="eyebrow">MY ATTENDANCE</p>
    <div className="p0-attendance-title"><h1>考勤统计</h1><button className="p0-rule-link" onClick={onRequest}>申请补卡 <ChevronRight size={15} /></button></div>
    <div className="p0-view-tabs" role="tablist" aria-label="考勤统计周期">{(["日", "周", "月"] as const).map((value) => <button role="tab" aria-selected={mode === value} className={mode === value ? "is-selected" : ""} key={value} onClick={() => setMode(value)}>{value}统计</button>)}</div>

    {mode === "日" && <>
      <PeriodNavigator label={dateLabel(selectedDate)} onPrevious={() => moveDate(-1)} onNext={() => moveDate(1)} onToday={showToday} />
      <SummaryGrid items={[{ label: "应打卡", value: "--", unit: "次" }, { label: "已打卡", value: "--", unit: "次" }, { label: "考勤结果", value: "--", unit: "" }]} />
      <EmptyAttendance title="暂无考勤明细" detail={`${selectedDate} 的班次与打卡记录将在身份认证后加载。`} onLogin={onLogin} />
    </>}

    {mode === "周" && <>
      <PeriodNavigator label={`${dateLabel(weekDates[0], { month: "numeric", day: "numeric" })} – ${dateLabel(weekDates[6], { month: "numeric", day: "numeric" })}`} onPrevious={() => moveDate(-7)} onNext={() => moveDate(7)} onToday={showToday} />
      <SummaryGrid items={[{ label: "应出勤", value: "--", unit: "天" }, { label: "实际出勤", value: "--", unit: "天" }, { label: "迟到 / 早退", value: "--", unit: "次" }, { label: "缺卡", value: "--", unit: "次" }]} />
      <section className="p0-card p0-period-card"><div className="p0-period-head"><div><p className="eyebrow">WEEKLY DETAIL</p><h2>每日考勤</h2></div><span>登录后显示本人记录</span></div><div className="p0-week-list">{weekDates.map((date) => <button className="p0-week-day p0-week-day-empty" key={date} onClick={() => { onSelectDate(date); setMode("日") }}><span className="p0-week-date"><b>{dateLabel(date, { weekday: "short" })}</b><small>{dateLabel(date, { month: "numeric", day: "numeric" })}</small></span><span className="p0-week-times"><b>--:--</b><i>—</i><b>--:--</b></span><span className="p0-unavailable-pill">暂无数据</span><ChevronRight size={15} /></button>)}</div></section>
    </>}

    {mode === "月" && <>
      <PeriodNavigator label={monthLabel} onPrevious={() => showMonth(-1)} onNext={() => showMonth(1)} onToday={() => { const date = parseISODate(today); onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1)); onSelectDate(today) }} />
      <SummaryGrid items={[{ label: "应出勤", value: "--", unit: "天" }, { label: "实际出勤", value: "--", unit: "天" }, { label: "迟到 / 早退", value: "--", unit: "次" }, { label: "缺卡", value: "--", unit: "次" }]} />
      <section className="p0-card p0-calendar-card"><div className="p0-period-head"><div><p className="eyebrow">MONTHLY OVERVIEW</p><h2>月历</h2></div><span>登录后加载考勤状态</span></div><div className="p0-calendar-grid p0-calendar-weekdays" aria-hidden="true">{"一二三四五六日".split("").map((day) => <span key={day}>{day}</span>)}</div><div className="p0-calendar-grid" role="group" aria-label={`${monthLabel}日期`}>{monthDates.map((date) => { const inMonth = parseISODate(date).getMonth() === visibleMonth.getMonth(); return <button type="button" key={date} aria-label={date} aria-pressed={selectedDate === date} className={`${inMonth ? "" : "is-outside"} ${selectedDate === date ? "is-selected" : ""} ${date === today ? "is-today" : ""}`} onClick={() => selectCalendarDate(date)}><span>{parseISODate(date).getDate()}</span></button> })}</div><div className="p0-calendar-key"><span className="p0-calendar-key-dot" />登录后显示出勤、异常与休息日标记</div></section>
      <EmptyAttendance title="暂无月度明细" detail={`${monthLabel} 的统计与逐日记录将在身份认证后加载。`} onLogin={onLogin} />
      <span className="sr-only">{monthDays.length} 天</span>
    </>}
  </section>
}

function PeriodNavigator({ label, onPrevious, onNext, onToday }: { label: string; onPrevious: () => void; onNext: () => void; onToday: () => void }) {
  return <div className="p0-period-nav"><button aria-label="上一周期" onClick={onPrevious}><ChevronLeft size={18} /></button><strong>{label}</strong><button aria-label="下一周期" onClick={onNext}><ChevronRight size={18} /></button><button className="p0-today-button" onClick={onToday}>今天</button></div>
}

function SummaryGrid({ items }: { items: { label: string; value: string; unit: string }[] }) {
  return <div className={`p0-summary-grid ${items.length === 3 ? "three-items" : ""}`}>{items.map((item) => <article className="p0-summary-stat" key={item.label}><span>{item.label}</span><strong>{item.value}<small>{item.unit}</small></strong></article>)}</div>
}

function EmptyAttendance({ title, detail, onLogin }: { title: string; detail: string; onLogin: () => void }) {
  return <div className="p0-card p0-empty p0-empty-attendance"><CalendarDays size={24} /><strong>{title}</strong><span>{detail}</span><button className="p0-secondary" onClick={onLogin}>登录后查看 <ChevronRight size={15} /></button></div>
}

function ApplicationsScreen({ filter, setFilter, onRequest, onLogin }: { filter: string; setFilter: (value: string) => void; onRequest: (kind: ApplicationKind) => void; onLogin: () => void }) {
  return <section className="page-content subpage"><p className="eyebrow">MY REQUESTS</p><h1>申请与审批</h1>
    <div className="p0-filter-row" role="group" aria-label="按审批状态筛选">{["全部", "审批中", "已通过", "已拒绝"].map((value) => <button key={value} aria-pressed={filter === value} className={filter === value ? "is-selected" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div>
    <div className="p0-card p0-empty p0-empty-attendance"><FileText size={24} /><strong>暂无申请记录</strong><span>登录后查看本人补卡、请假、出差、外出和加班申请及审批进度。</span><button className="p0-secondary" onClick={onLogin}>登录查看申请 <ChevronRight size={15} /></button></div>
    <div className="p0-request-shortcuts">{requestItems.map(({ kind, icon: Icon }) => <button key={kind} onClick={() => onRequest(kind)}><Icon size={16} /><span>{kind}</span><ChevronRight size={14} /></button>)}</div>
  </section>
}

function ProfileScreen({ onLogin, onRules }: { onLogin: () => void; onRules: () => void }) {
  return <section className="page-content subpage"><p className="eyebrow">MY PROFILE</p><h1>个人中心</h1>
    <section className="p0-profile-card"><div className="avatar"><UserRound size={20} /></div><div><strong>未登录</strong><span>登录后加载员工与组织信息</span></div><button className="p0-login-cta" onClick={onLogin}>登录 <ChevronRight size={15} /></button></section>
    <div className="p0-profile-list"><div><span>所属企业</span><strong>登录后显示</strong></div><div><span>员工状态</span><strong>登录后显示</strong></div><button onClick={onRules}>查看打卡规则<ChevronRight size={17} /></button><button onClick={onLogin}>账号与安全<ChevronRight size={17} /></button></div>
    <div className="p0-card p0-privacy-card"><ShieldCheck size={18} /><div><strong>位置权限说明</strong><span>身份认证完成后，仅在发起打卡时请求设备定位。</span></div></div>
  </section>
}

function LoginSheet({ requestKind, onClose }: { requestKind: ApplicationKind | null; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-login-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-login-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><ShieldCheck size={22} /></div><p className="eyebrow">EMPLOYEE ACCOUNT</p><h2 id="p0-login-title">登录企业考勤</h2>
    {requestKind && <p className="p0-request-context">继续前往：{requestKind}</p>}
    <div className="p0-setup-state"><CircleAlert size={18} /><div><strong>身份认证尚未配置</strong><span>接入企业身份认证后，员工可安全登录并查看本人考勤信息。</span></div></div>
    <button className="p0-primary p0-submit-punch" disabled>登录服务待配置</button>
    <p className="p0-disclaimer">账号凭据不会在未接入认证服务时被收集或提交。</p>
  </section></div>
}

function RulesSheet({ onClose }: { onClose: () => void }) {
  const rules = [
    "本人排班与班次日历",
    "上班 / 下班可打卡时间",
    "考勤地点与定位围栏",
    "迟到、早退、缺卡判定",
    "补卡资格、期限与材料",
    "请假、出差、外出及加班流程",
  ]
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-rules-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-rules-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><ShieldCheck size={22} /></div><p className="eyebrow">ATTENDANCE POLICY</p><h2 id="p0-rules-title">打卡规则</h2><p className="p0-sheet-description">以下内容需由企业考勤系统按当前员工、排班和组织策略返回。</p><div className="p0-rule-list">{rules.map((rule) => <div className="p0-rule-row" key={rule}><Clock3 size={15} /><div><strong>{rule}</strong><span>尚未配置</span></div><span className="p0-unavailable-pill">未接入</span></div>)}</div><div className="p0-rule-warning"><CircleAlert size={15} />未读取到有效规则前，不展示固定时间、距离或申请条件。</div><button className="p0-primary p0-submit-punch" onClick={onClose}>关闭</button></section></div>
}

function ProductNote() {
  return <aside className="desktop-note"><div className="note-logo"><Fingerprint size={24} /></div><span>EMPLOYEE ATTENDANCE</span><h2>每日考勤服务</h2><p>从登录到打卡，再到日 / 周 / 月考勤追踪。</p><div className="note-list"><span><i />身份认证后读取本人排班</span><span><i />定位围栏通过后开放打卡</span><span><i />缺卡后进入补卡与审批流程</span><span><i />按日、周、月追踪考勤</span></div><small>考勤数据与规则由企业系统提供</small></aside>
}
