"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  FileSpreadsheet,
  Fingerprint,
  MapPin,
  Plane,
  RefreshCw,
  ShieldCheck,
  Table2,
  UserRound,
  Wifi,
  X,
} from "lucide-react"

type Tab = "打卡" | "日历" | "功能清单" | "WPS表格" | "申请" | "我的"
type ViewMode = "日" | "周" | "月"
type ApplicationKind = "补卡申请" | "请假申请" | "出差申请" | "外出申请" | "加班申请"
type ApplicationStatus = "审批中" | "已通过" | "已拒绝"
type AttendanceStatus = "正常" | "迟到" | "早退" | "缺卡" | "待下班打卡" | "休息日" | "未开始"

type ApplicationRecord = {
  id: string
  kind: ApplicationKind
  date: string
  detail: string
  reason: string
  status: ApplicationStatus
  comment?: string
}

type AttendanceRecord = {
  date: string
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  status: AttendanceStatus
}

const employee = {
  name: "林晓雨",
  employeeId: "CH-1048",
  company: "澄海科技有限公司",
  department: "产品设计部",
  role: "产品设计师",
  project: "高新科技园",
  site: "集团总部大厦（A座）",
  address: "深圳市南山区科技中一路18号",
}

const schedule = {
  name: "标准工作日",
  start: "09:00",
  end: "18:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  startWindow: "08:30–09:30",
  endWindow: "17:30–19:30",
  flexibleMinutes: 30,
}

const locationFixture = { distance: 38, accuracy: 12, radius: 100 }

const attendanceSites = [
  { name: "高新科技园·集团总部大厦（A座）", project: "高新科技园", site: "集团总部大厦（A座）", address: "深圳市南山区科技中一路18号", distance: 38 },
  { name: "高新科技园·创新中心（B座）", project: "高新科技园", site: "创新中心（B座）", address: "深圳市南山区科技中一路22号", distance: 64 },
  { name: "科技园·研发中心（C座）", project: "科技园", site: "研发中心（C座）", address: "深圳市南山区科苑南路66号", distance: 128 },
]

 type PunchRecord = { id: string; kind: "上班打卡" | "下班打卡"; time: string; status: "正常" | "早退" | "迟到" }

const initialPunchRecords: PunchRecord[] = [
  { id: "punch-115120", kind: "下班打卡", time: "11:51:20", status: "早退" },
  { id: "punch-115116", kind: "下班打卡", time: "11:51:16", status: "早退" },
  { id: "punch-085214", kind: "上班打卡", time: "08:52:14", status: "正常" },
]

const navItems: { label: Exclude<Tab, "我的">; icon: typeof Clock3 }[] = [
  { label: "打卡", icon: Clock3 },
  { label: "日历", icon: CalendarDays },
  { label: "功能清单", icon: ClipboardList },
  { label: "WPS表格", icon: Table2 },
  { label: "申请", icon: UserRound },
]

const requestItems: { kind: ApplicationKind; icon: typeof Clock3; hint: string }[] = [
  { kind: "补卡申请", icon: Clock3, hint: "补充遗漏的打卡记录" },
  { kind: "请假申请", icon: CalendarDays, hint: "提交假期审批申请" },
  { kind: "出差申请", icon: Plane, hint: "登记出差安排" },
  { kind: "外出申请", icon: MapPin, hint: "提交工作外出申请" },
  { kind: "加班申请", icon: BriefcaseBusiness, hint: "提交加班审批申请" },
]

const localISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const todayISO = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return `${value("year")}-${value("month")}-${value("day")}`
}
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
const formatMonth = (month: Date) => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(month)

function getWeekDates(selected: string) {
  const start = parseISODate(selected)
  const dayOfWeek = start.getDay() || 7
  start.setDate(start.getDate() - dayOfWeek + 1)
  return Array.from({ length: 7 }, (_, index) => localISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)))
}

function getMonthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_, index) => localISO(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)))
}

function createAttendanceRecord(date: string, today: string, punchedOut: boolean): AttendanceRecord {
  const parsed = parseISODate(date)
  const weekday = parsed.getDay()
  if (weekday === 0 || weekday === 6) return { date, isWorkingDay: false, startTime: null, endTime: null, status: "休息日" }
  if (date > today) return { date, isWorkingDay: true, startTime: null, endTime: null, status: "未开始" }
  if (date === today) return { date, isWorkingDay: true, startTime: "08:56", endTime: punchedOut ? "17:42" : null, status: punchedOut ? "正常" : "待下班打卡" }

  const day = parsed.getDate()
  if (day % 11 === 0) return { date, isWorkingDay: true, startTime: null, endTime: "18:04", status: "缺卡" }
  if (day % 7 === 0) return { date, isWorkingDay: true, startTime: "09:07", endTime: "18:02", status: "迟到" }
  if (day % 5 === 0) return { date, isWorkingDay: true, startTime: "08:54", endTime: "17:43", status: "早退" }
  return { date, isWorkingDay: true, startTime: "08:56", endTime: "18:04", status: "正常" }
}

function createApplicationRecords(today: string): ApplicationRecord[] {
  return [
    { id: "REQ-10481", kind: "补卡申请", date: shiftDate(today, -2), detail: "上班卡 · 09:00", reason: "早间园区网络异常，已在考勤地点到岗。", status: "审批中" },
    { id: "REQ-10475", kind: "请假申请", date: shiftDate(today, 2), detail: "年假 · 1 天", reason: "个人事务安排。", status: "已通过", comment: "审批通过，请按流程完成交接。" },
    { id: "REQ-10462", kind: "出差申请", date: `${shiftDate(today, -4)} – ${shiftDate(today, -3)}`, detail: "客户现场 · 2 天", reason: "参加客户方案沟通会议。", status: "已拒绝", comment: "请补充出差计划后重新提交。" },
  ]
}

function summarize(records: AttendanceRecord[]) {
  const workdays = records.filter((record) => record.isWorkingDay && record.status !== "未开始")
  const punched = workdays.reduce((total, record) => total + Number(Boolean(record.startTime)) + Number(Boolean(record.endTime)), 0)
  return {
    expectedDays: workdays.length,
    attendedDays: workdays.filter((record) => record.startTime && record.endTime).length,
    lateEarly: workdays.filter((record) => record.status === "迟到" || record.status === "早退").length,
    missed: workdays.reduce((total, record) => total + 2 - Number(Boolean(record.startTime)) - Number(Boolean(record.endTime)), 0),
    punched,
  }
}

export function AttendanceH5() {
  const today = todayISO()
  const [activeTab, setActiveTab] = useState<Tab>("打卡")
  const [loginOpen, setLoginOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [siteOpen, setSiteOpen] = useState(false)
  const [formOpen, setFormOpen] = useState<ApplicationKind | null>(null)
  const [notice, setNotice] = useState("")
  const [punchedOut, setPunchedOut] = useState(true)
  const [punchRecords, setPunchRecords] = useState(initialPunchRecords)
  const [currentTime, setCurrentTime] = useState("14:22:08")
  const [selectedSite, setSelectedSite] = useState(attendanceSites[0])
  const [attendanceMode, setAttendanceMode] = useState<ViewMode>("日")
  const [selectedDate, setSelectedDate] = useState(today)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseISODate(today)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [applicationFilter, setApplicationFilter] = useState("全部")
  const [applications, setApplications] = useState(() => createApplicationRecords(today))
  const [distance, setDistance] = useState(locationFixture.distance)

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()))
    updateTime()
    const interval = window.setInterval(updateTime, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2600)
  }

  const openRequest = (kind: ApplicationKind) => setFormOpen(kind)
  const openDate = (date: string) => {
    setSelectedDate(date)
    const parsed = parseISODate(date)
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }
  const visibleApplications = useMemo(() => applications.filter((item) => applicationFilter === "全部" || item.status === applicationFilter), [applications, applicationFilter])

  const submitPunch = () => {
    if (distance > locationFixture.radius) {
      showNotice("当前位置超出考勤范围，请重新定位")
      return
    }
    const time = currentTime
    setPunchRecords((current) => [{ id: `punch-${Date.now()}`, kind: "下班打卡", time, status: time < schedule.end ? "早退" : "正常" }, ...current])
    setPunchedOut(true)
    setLocationOpen(false)
    showNotice(`下班卡已更新 · ${time}`)
  }

  const submitApplication = (kind: ApplicationKind, date: string, detail: string, reason: string) => {
    setApplications((current) => [{ id: `REQ-${Date.now()}`, kind, date, detail, reason, status: "审批中" }, ...current])
    setFormOpen(null)
    setApplicationFilter("全部")
    setActiveTab("申请")
    showNotice("申请已提交，当前状态：审批中")
  }

  return <main className="h5-shell">
    <div className="phone-frame">
      <StatusBar time={currentTime} />
      {activeTab !== "打卡" && <header className="topbar">
        <Brand />
        <button className="p0-user-entry" onClick={() => setActiveTab("我的")}><UserRound size={15} /><span>{employee.name}</span><ChevronRight size={14} /></button>
      </header>}

      {activeTab === "打卡" && <HomeScreen
        today={today}
        currentTime={currentTime}
        punchRecords={punchRecords}
        distance={distance}
        selectedSite={selectedSite}
        punchedOut={punchedOut}
        onPunch={() => setLocationOpen(true)}
        onRefreshLocation={() => setDistance((current) => current <= locationFixture.radius ? 128 : selectedSite.distance)}
        onFieldPunch={() => openRequest("外出申请")}
        onSwitchSite={() => setSiteOpen(true)}
        onTab={setActiveTab}
      />}
      {activeTab === "日历" && <AttendanceScreen
        mode={attendanceMode}
        setMode={setAttendanceMode}
        today={today}
        selectedDate={selectedDate}
        punchedOut={punchedOut}
        onSelectDate={openDate}
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        onRequest={() => openRequest("补卡申请")}
      />}
      {activeTab === "功能清单" && <FeaturesScreen onTab={setActiveTab} onRequest={openRequest} onRules={() => setRulesOpen(true)} />}
      {activeTab === "WPS表格" && <WpsTableScreen today={today} records={punchRecords} />}
      {activeTab === "申请" && <ApplicationsScreen items={visibleApplications} filter={applicationFilter} setFilter={setApplicationFilter} onRequest={openRequest} />}
      {activeTab === "我的" && <ProfileScreen onRules={() => setRulesOpen(true)} onLogin={() => setLoginOpen(true)} />}

      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={activeTab === label ? "nav-active" : ""} aria-current={activeTab === label ? "page" : undefined} onClick={() => setActiveTab(label)}>
          <Icon size={20} /><span>{label}</span>{label === "申请" && applications.some((item) => item.status === "审批中") && <i className="nav-dot" />}
        </button>)}
      </nav>

      {loginOpen && <LoginSheet onClose={() => setLoginOpen(false)} />}
      {rulesOpen && <RulesSheet onClose={() => setRulesOpen(false)} />}
      {locationOpen && <LocationSheet site={selectedSite} distance={distance} onRefresh={() => setDistance((current) => current <= locationFixture.radius ? 128 : selectedSite.distance)} onClose={() => setLocationOpen(false)} onSubmit={submitPunch} />}
      {siteOpen && <SiteSheet selectedSite={selectedSite.name} onClose={() => setSiteOpen(false)} onSelect={(site) => { setSelectedSite(site); setDistance(site.distance); setSiteOpen(false); showNotice(`已切换至${site.site}`) }} />}
      {formOpen && <ApplicationSheet kind={formOpen} today={today} onClose={() => setFormOpen(null)} onSubmit={submitApplication} />}
      {notice && <div className="p0-toast" role="status">{notice}</div>}
    </div>
    <ProductNote />
  </main>
}

function StatusBar({ time }: { time: string }) {
  return <div className="status-bar"><span>{time.slice(0, 5)}</span><div className="status-icons"><span>5G</span><Wifi size={15} /><span className="battery"><i /></span></div></div>
}

function Brand() {
  return <><div className="brand-mark"><Fingerprint size={20} /></div><div className="brand-copy"><strong>考勤助手</strong><span>员工服务</span></div></>
}

function HomeScreen({ today, currentTime, punchRecords, distance, selectedSite, punchedOut, onPunch, onRefreshLocation, onFieldPunch, onSwitchSite, onTab }: {
  today: string
  currentTime: string
  punchRecords: PunchRecord[]
  distance: number
  selectedSite: (typeof attendanceSites)[number]
  punchedOut: boolean
  onPunch: () => void
  onRefreshLocation: () => void
  onFieldPunch: () => void
  onSwitchSite: () => void
  onTab: (tab: Tab) => void
}) {
  const record = createAttendanceRecord(today, today, punchedOut)
  return <section className="page-content p0-checkin-home">
    <section className="p0-card p0-clock-card">
      <div className="p0-home-sync"><span><i />北京时间 · 实时更新</span><time dateTime={today}>{dateLabel(today, { year: "numeric", month: "long", day: "numeric" })} {dateLabel(today, { weekday: "short" })}</time></div>
      <time className="p0-live-time">{currentTime}</time>
      <p className="p0-work-meta">班次时间：{schedule.start}–{schedule.end}<i />标准工时 {schedule.start}–{schedule.end}（弹性{schedule.flexibleMinutes}分钟）</p>
      <div className="p0-home-site">
        <span className="p0-site-icon"><MapPin size={17} /></span>
        <div><strong>{selectedSite.name}</strong><span>{selectedSite.address}</span></div>
        <span className={`p0-location-state ${distance > locationFixture.radius ? "is-outside" : ""}`}>{distance <= locationFixture.radius ? `范围内 ${distance}m` : `超出 ${distance}m`}</span>
        <button type="button" aria-label="刷新定位" title="刷新定位" onClick={onRefreshLocation}><RefreshCw size={15} /></button>
      </div>
    </section>

    <section className="p0-card p0-main-punch-card">
      <div className="p0-punch-status"><i />今日打卡已完成 · 可更新下班卡</div>
      <button className="p0-punch-orb" disabled={!record.isWorkingDay} aria-label="更新下班卡" onClick={onPunch}>
        <ShieldCheck size={24} strokeWidth={1.8} /><strong>更新下班卡</strong><span>{currentTime}</span>
      </button>
      <p className="p0-punch-hint">可随时更新最终下班时间</p>
      <div className="p0-home-actions">
        <button type="button" onClick={onFieldPunch}><MapPin size={14} />外勤打卡</button>
        <button type="button" onClick={onSwitchSite}><MapPin size={14} />切换考勤点</button>
      </div>
    </section>

    <section className="p0-card p0-home-records">
      <div className="p0-records-heading"><h2>今日打卡记录</h2><span>共 {punchRecords.length} 条记录</span></div>
      <div className="p0-home-record-list">{punchRecords.slice(0, 4).map((item) => <article className="p0-home-record" key={item.id}>
        <span className={`p0-record-badge ${item.kind === "上班打卡" ? "is-start" : ""}`}>{item.kind === "上班打卡" ? "上" : "下"}</span>
        <div className="p0-home-record-copy"><strong>{item.kind}<time>{item.time}</time></strong><span><MapPin size={11} />{selectedSite.name}</span></div>
        <span className={`p0-home-record-status ${item.status === "正常" ? "is-normal" : "is-exception"}`}>{item.status}</span>
      </article>)}</div>
    </section>
  </section>
}

function AttendanceScreen({ mode, setMode, today, selectedDate, punchedOut, onSelectDate, visibleMonth, onMonthChange, onRequest }: {
  mode: ViewMode
  setMode: (value: ViewMode) => void
  today: string
  selectedDate: string
  punchedOut: boolean
  onSelectDate: (value: string) => void
  visibleMonth: Date
  onMonthChange: (value: Date) => void
  onRequest: () => void
}) {
  const weekDates = getWeekDates(selectedDate)
  const monthDates = getMonthGrid(visibleMonth)
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
  const monthLabel = formatMonth(visibleMonth)
  const selectedRecord = createAttendanceRecord(selectedDate, today, punchedOut)
  const selectMonth = (amount: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1)
    const selectedDay = parseISODate(selectedDate).getDate()
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    onSelectDate(localISO(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(selectedDay, lastDay))))
    onMonthChange(nextMonth)
  }
  const monthRecords = Array.from({ length: daysInMonth }, (_, index) => localISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)))
    .map((date) => createAttendanceRecord(date, today, punchedOut))
  const monthSummary = summarize(monthRecords)
  const weekSummary = summarize(weekDates.map((date) => createAttendanceRecord(date, today, punchedOut)))
  const punchCount = Number(Boolean(selectedRecord.startTime)) + Number(Boolean(selectedRecord.endTime))

  return <section className="page-content subpage p0-attendance-page">
    <p className="eyebrow">MY ATTENDANCE</p>
    <div className="p0-attendance-title"><h1>考勤明细</h1><button className="p0-rule-link" onClick={onRequest}>补卡申请 <ChevronRight size={15} /></button></div>
    <div className="p0-view-tabs" role="tablist" aria-label="考勤统计周期">{(["日", "周", "月"] as const).map((value) => <button role="tab" aria-selected={mode === value} className={mode === value ? "is-selected" : ""} key={value} onClick={() => setMode(value)}>{value}统计</button>)}</div>

    {mode === "日" && <>
      <PeriodNavigator label={dateLabel(selectedDate)} onPrevious={() => onSelectDate(shiftDate(selectedDate, -1))} onNext={() => onSelectDate(shiftDate(selectedDate, 1))} onToday={() => onSelectDate(today)} />
      <SummaryGrid items={[{ label: "应打卡", value: selectedRecord.isWorkingDay ? "2" : "0", unit: "次" }, { label: "已打卡", value: String(punchCount), unit: "次" }, { label: "考勤结果", value: selectedRecord.status, unit: "" }]} />
      <DailyAttendanceCard record={selectedRecord} onRequest={onRequest} />
    </>}

    {mode === "周" && <>
      <PeriodNavigator label={`${dateLabel(weekDates[0], { month: "numeric", day: "numeric" })} – ${dateLabel(weekDates[6], { month: "numeric", day: "numeric" })}`} onPrevious={() => onSelectDate(shiftDate(selectedDate, -7))} onNext={() => onSelectDate(shiftDate(selectedDate, 7))} onToday={() => onSelectDate(today)} />
      <SummaryGrid items={[{ label: "应出勤", value: String(weekSummary.expectedDays), unit: "天" }, { label: "实际出勤", value: String(weekSummary.attendedDays), unit: "天" }, { label: "迟到 / 早退", value: String(weekSummary.lateEarly), unit: "次" }, { label: "缺卡", value: String(weekSummary.missed), unit: "次" }]} />
      <section className="p0-card p0-period-card"><div className="p0-period-head"><div><p className="eyebrow">WEEKLY DETAIL</p><h2>每日考勤</h2></div><span>{weekSummary.expectedDays} 个工作日</span></div><div className="p0-week-list">{weekDates.map((date) => { const record = createAttendanceRecord(date, today, punchedOut); return <button className="p0-week-day" key={date} onClick={() => { onSelectDate(date); setMode("日") }}><span className="p0-week-date"><b>{dateLabel(date, { weekday: "short" })}</b><small>{dateLabel(date, { month: "numeric", day: "numeric" })}</small></span><span className="p0-week-times">{record.status === "休息日" || record.status === "未开始" ? <b>{record.status}</b> : <><b>{record.startTime ?? "缺卡"}</b><i>—</i><b>{record.endTime ?? "待打卡"}</b></>}</span><StatusPill status={record.status} /><ChevronRight size={15} /></button> })}</div></section>
    </>}

    {mode === "月" && <>
      <PeriodNavigator label={monthLabel} onPrevious={() => selectMonth(-1)} onNext={() => selectMonth(1)} onToday={() => { const date = parseISODate(today); onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1)); onSelectDate(today) }} />
      <SummaryGrid items={[{ label: "应出勤", value: String(monthSummary.expectedDays), unit: "天" }, { label: "实际出勤", value: String(monthSummary.attendedDays), unit: "天" }, { label: "迟到 / 早退", value: String(monthSummary.lateEarly), unit: "次" }, { label: "缺卡", value: String(monthSummary.missed), unit: "次" }]} />
      <section className="p0-card p0-calendar-card"><div className="p0-period-head"><div><p className="eyebrow">MONTHLY OVERVIEW</p><h2>月度考勤</h2></div><span>{monthSummary.punched} 次打卡</span></div><div className="p0-calendar-grid p0-calendar-weekdays" aria-hidden="true">{"一二三四五六日".split("").map((day) => <span key={day}>{day}</span>)}</div><div className="p0-calendar-grid" role="group" aria-label={`${monthLabel}日期`}>{monthDates.map((date) => { const record = createAttendanceRecord(date, today, punchedOut); const inMonth = parseISODate(date).getMonth() === visibleMonth.getMonth(); return <button type="button" key={date} aria-label={`${date}，${record.status}`} aria-pressed={selectedDate === date} className={`${inMonth ? "" : "is-outside"} ${selectedDate === date ? "is-selected" : ""} ${date === today ? "is-today" : ""} ${statusClass(record.status)}`} onClick={() => onSelectDate(date)}><span>{parseISODate(date).getDate()}</span><i aria-hidden="true" /></button> })}</div><div className="p0-calendar-key"><span className="p0-calendar-key-dot status-normal" />正常 <span className="p0-calendar-key-dot status-exception" />异常 <span className="p0-calendar-key-dot status-rest" />休息日</div></section>
      <DailyAttendanceCard record={selectedRecord} onRequest={onRequest} />
    </>}
  </section>
}

function DailyAttendanceCard({ record, onRequest }: { record: AttendanceRecord; onRequest: () => void }) {
  return <section className="p0-card p0-detail-card"><div className="p0-card-head"><div><p className="eyebrow">{record.date} · 本人考勤</p><h2>{record.isWorkingDay ? schedule.name : record.status}</h2></div><StatusPill status={record.status} /></div>
    {record.isWorkingDay && <>
      <div className="p0-record-row"><span className="p0-record-icon"><Clock3 size={16} /></span><div><strong>上班打卡</strong><small>应打卡 {schedule.start} · 时段 {schedule.startWindow}</small></div><b>{record.startTime ?? (record.status === "未开始" ? "--:--" : "缺卡")}</b></div>
      <div className="p0-record-row"><span className="p0-record-icon p0-record-muted"><Clock3 size={16} /></span><div><strong>下班打卡</strong><small>应打卡 {schedule.end} · 时段 {schedule.endWindow}</small></div><b>{record.endTime ?? (record.status === "未开始" ? "--:--" : "待打卡")}</b></div>
      <div className="p0-result-row"><span>考勤结果</span><strong>{record.status}</strong></div>
      <button className="p0-secondary p0-full-button" onClick={onRequest}>申请补卡 <ChevronRight size={15} /></button>
    </>}
    {!record.isWorkingDay && <div className="p0-empty p0-rest-day"><CalendarDays size={20} /><strong>{record.status === "休息日" ? "今日休息" : "班次尚未开始"}</strong><span>{record.status === "休息日" ? "无需打卡" : "该日期暂无排班"}</span></div>}
  </section>
}

function PeriodNavigator({ label, onPrevious, onNext, onToday }: { label: string; onPrevious: () => void; onNext: () => void; onToday: () => void }) {
  return <div className="p0-period-nav"><button aria-label="上一周期" onClick={onPrevious}><ChevronLeft size={18} /></button><strong>{label}</strong><button aria-label="下一周期" onClick={onNext}><ChevronRight size={18} /></button><button className="p0-today-button" onClick={onToday}>今天</button></div>
}

function SummaryGrid({ items }: { items: { label: string; value: string; unit: string }[] }) {
  return <div className={`p0-summary-grid ${items.length === 3 ? "three-items" : ""}`}>{items.map((item) => <article className="p0-summary-stat" key={item.label}><span>{item.label}</span><strong>{item.value}<small>{item.unit}</small></strong></article>)}</div>
}

function StatusPill({ status }: { status: AttendanceStatus }) {
  const tone = status === "正常" || status === "待下班打卡" ? "p0-status-success" : status === "迟到" || status === "早退" || status === "缺卡" ? "p0-status-error" : ""
  return <span className={`p0-status ${tone}`}>{status}</span>
}

function statusClass(status: AttendanceStatus) {
  if (status === "正常" || status === "待下班打卡") return "has-normal"
  if (status === "迟到" || status === "早退" || status === "缺卡") return "has-exception"
  if (status === "休息日") return "has-rest"
  return ""
}

function FeaturesScreen({ onTab, onRequest, onRules }: { onTab: (tab: Tab) => void; onRequest: (kind: ApplicationKind) => void; onRules: () => void }) {
  return <section className="page-content subpage p0-features-page"><p className="eyebrow">WORKSPACE</p><h1>功能清单</h1><p className="p0-page-description">常用考勤服务与工作工具</p>
    <div className="p0-feature-grid">
      <button className="p0-feature-card" onClick={() => onTab("日历")}><span><CalendarDays size={19} /></span><strong>考勤日历</strong><small>查看日、周、月出勤统计</small><ChevronRight size={15} /></button>
      <button className="p0-feature-card" onClick={() => onTab("WPS表格")}><span><Table2 size={19} /></span><strong>考勤表格</strong><small>预览并导出 WPS 兼容表格</small><ChevronRight size={15} /></button>
      {requestItems.map(({ kind, icon: Icon, hint }) => <button className="p0-feature-card" key={kind} onClick={() => onRequest(kind)}><span><Icon size={19} /></span><strong>{kind}</strong><small>{hint}</small><ChevronRight size={15} /></button>)}
      <button className="p0-feature-card" onClick={onRules}><span><ShieldCheck size={19} /></span><strong>打卡规则</strong><small>查看班次、时间窗和围栏范围</small><ChevronRight size={15} /></button>
    </div>
  </section>
}

function WpsTableScreen({ today, records }: { today: string; records: PunchRecord[] }) {
  const [exported, setExported] = useState(false)
  const exportCsv = () => {
    const rows = [["日期", "打卡类型", "打卡时间", "考勤结果"], ...records.map((record) => [today, record.kind, record.time, record.status])]
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `考勤记录_${today}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setExported(true)
  }
  return <section className="page-content subpage p0-wps-page"><p className="eyebrow">ATTENDANCE SHEET</p><h1>WPS表格</h1>
    <section className="p0-card p0-wps-summary"><span><FileSpreadsheet size={20} /></span><div><strong>{formatMonth(parseISODate(today))}考勤记录</strong><small>{records.length} 条打卡记录 · WPS 兼容 CSV</small></div><span className="p0-sheet-ready">可导出</span></section>
    <section className="p0-card p0-wps-table-card"><div className="p0-period-head"><div><p className="eyebrow">TODAY&apos;S RECORDS</p><h2>{dateLabel(today, { month: "long", day: "numeric" })}</h2></div><span>{records.length} 条记录</span></div>
      <div className="p0-table-wrap"><table><caption className="sr-only">今日考勤记录表</caption><thead><tr><th scope="col">打卡类型</th><th scope="col">时间</th><th scope="col">结果</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.kind}</td><td>{record.time}</td><td><span className={`p0-home-record-status ${record.status === "正常" ? "is-normal" : "is-exception"}`}>{record.status}</span></td></tr>)}</tbody></table></div>
    </section>
    <button className="p0-primary p0-export-button" onClick={exportCsv}><FileSpreadsheet size={17} />导出表格（CSV）<ArrowRight size={15} /></button>
    {exported && <p className="p0-export-note" role="status"><Check size={14} />已生成可用 WPS 打开的 CSV 文件</p>}
  </section>
}

function SiteSheet({ selectedSite, onClose, onSelect }: { selectedSite: string; onClose: () => void; onSelect: (site: (typeof attendanceSites)[number]) => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-site-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-site-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><MapPin size={22} /></div><p className="eyebrow">ATTENDANCE SITE</p><h2 id="p0-site-title">切换考勤点</h2><p className="p0-sheet-description">选择本次打卡使用的考勤地点。</p>
    <div className="p0-site-options">{attendanceSites.map((site) => <button key={site.name} aria-pressed={selectedSite === site.name} className={selectedSite === site.name ? "is-selected" : ""} onClick={() => onSelect(site)}><MapPin size={16} /><span><strong>{site.name}</strong><small>{site.address} · {site.distance}m</small></span>{selectedSite === site.name && <Check size={17} />}</button>)}</div>
  </section></div>
}

function ApplicationsScreen({ items, filter, setFilter, onRequest }: { items: ApplicationRecord[]; filter: string; setFilter: (value: string) => void; onRequest: (kind: ApplicationKind) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  return <section className="page-content subpage"><p className="eyebrow">MY REQUESTS</p><h1>我的申请</h1>
    <div className="p0-filter-row" role="group" aria-label="按审批状态筛选">{["全部", "审批中", "已通过", "已拒绝"].map((value) => <button key={value} aria-pressed={filter === value} className={filter === value ? "is-selected" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div>
    {items.length > 0 ? <div className="p0-application-list">{items.map((item) => <article className="p0-card p0-application-card" key={item.id}>
      <div className="p0-application-head"><span className="p0-application-icon">{item.kind === "补卡申请" ? <Clock3 size={18} /> : <FileText size={18} />}</span><div><strong>{item.kind}</strong><small>{item.date} · {item.detail}</small></div><span className={`p0-status ${item.status === "已通过" ? "p0-status-success" : item.status === "已拒绝" ? "p0-status-error" : ""}`}>{item.status}</span></div>
      <div className="p0-application-body"><p><span>申请原因</span><strong>{item.reason}</strong></p>{item.comment && <p><span>处理意见</span><strong>{item.comment}</strong></p>}</div>
      <button type="button" className="p0-approval-track" aria-expanded={expandedId === item.id} onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}><span className="p0-track-dot" /><span>{expandedId === item.id ? "收起申请详情" : "查看申请详情与审批轨迹"}</span><ChevronRight size={15} /></button>
      {expandedId === item.id && <section className="p0-application-detail"><strong>审批轨迹</strong><p>提交申请 · {item.date}</p><p>当前状态：{item.status}</p>{item.comment && <p>处理意见：{item.comment}</p>}</section>}
    </article>)}</div> : <div className="p0-empty"><FileText size={24} /><strong>暂无此状态的申请</strong><span>切换筛选条件查看其他申请记录</span></div>}
    <div className="p0-application-actions"><button className="p0-primary" onClick={() => onRequest("补卡申请")}>补卡申请</button><button className="p0-secondary" onClick={() => onRequest("请假申请")}>请假申请</button></div>
  </section>
}

function ProfileScreen({ onRules, onLogin }: { onRules: () => void; onLogin: () => void }) {
  return <section className="page-content subpage"><p className="eyebrow">MY PROFILE</p><h1>个人中心</h1>
    <section className="p0-profile-card"><div className="avatar">林</div><div><strong>{employee.name}</strong><span>{employee.department} · {employee.role}</span></div><span className="active-pill">在职</span></section>
    <div className="p0-profile-list"><div><span>员工编号</span><strong>{employee.employeeId}</strong></div><div><span>所属企业</span><strong>{employee.company}</strong></div><div><span>所在项目</span><strong>{employee.project}</strong></div><button onClick={onRules}>查看打卡规则<ChevronRight size={17} /></button><button onClick={onRules}>考勤地点与权限<ChevronRight size={17} /></button><button onClick={onLogin}>切换账号<ChevronRight size={17} /></button></div>
    <div className="p0-card p0-privacy-card"><ShieldCheck size={18} /><div><strong>位置权限说明</strong><span>仅在发起打卡时获取当前定位，并用于校验有效考勤范围。</span></div></div>
  </section>
}

function LoginSheet({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"企业微信快捷登录" | "人力系统账号登录">("企业微信快捷登录")
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-login-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-login-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><ShieldCheck size={22} /></div><p className="eyebrow">EMPLOYEE ACCOUNT</p><h2 id="p0-login-title">员工登录</h2>
    <div className="p0-login-switch" role="tablist" aria-label="登录方式">{(["企业微信快捷登录", "人力系统账号登录"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} className={mode === item ? "is-selected" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
    {mode === "企业微信快捷登录" ? <div className="p0-login-panel"><div className="p0-wechat-mark">微</div><strong>企业微信身份认证</strong><span>校验员工身份、组织关系与访问权限</span><button className="p0-primary" disabled>微信授权待接入 <ChevronRight size={16} /></button></div> : <div className="p0-login-panel p0-login-form"><label>员工账号<input autoComplete="username" readOnly placeholder="认证接入后填写" /></label><label>登录凭据<input type="password" autoComplete="current-password" readOnly placeholder="由企业认证服务验证" /></label><button className="p0-primary" disabled>认证服务待接入 <ChevronRight size={16} /></button></div>}
    <p className="p0-disclaimer">身份认证接入后，员工信息与可访问的考勤数据由企业账号确定。</p>
  </section></div>
}

function LocationSheet({ site, distance, onRefresh, onClose, onSubmit }: { site: (typeof attendanceSites)[number]; distance: number; onRefresh: () => void; onClose: () => void; onSubmit: () => void }) {
  const isWithinRange = distance <= locationFixture.radius
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-location-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><MapPin size={22} /></div><p className="eyebrow">LOCATION CHECK</p><h2 id="p0-location-title">确认打卡位置</h2><p className="p0-sheet-description">请确认当前定位与考勤地点一致，打卡时间将以服务器记录为准。</p>
    <div className="p0-location-status"><MapPin size={18} /><div><strong>{site.site}</strong><span>{site.address}</span></div><span className={`p0-location-state ${isWithinRange ? "" : "is-outside"}`}>{isWithinRange ? "范围内" : "超出范围"}</span></div>
    <div className="p0-location-metrics p0-sheet-metrics"><span>定位成功 · 精度 {locationFixture.accuracy} 米</span><strong>距考勤点 {distance}m</strong><span>考勤范围 {locationFixture.radius}m</span></div>
    <button className="p0-inline-link p0-refresh-location" onClick={onRefresh}>刷新定位 <ArrowRight size={15} /></button>
    {!isWithinRange && <div className="p0-rule-warning"><CircleAlert size={15} />当前位置距离考勤点 {distance}m，超出 {locationFixture.radius}m 有效范围。</div>}
    <button className="p0-primary p0-submit-punch" onClick={onSubmit} disabled={!isWithinRange}>{isWithinRange ? "确认更新下班卡" : "当前无法打卡"} <Check size={17} /></button><p className="p0-disclaimer">提交后更新当日下班考勤记录。</p>
  </section></div>
}

function ApplicationSheet({ kind, today, onClose, onSubmit }: { kind: ApplicationKind; today: string; onClose: () => void; onSubmit: (kind: ApplicationKind, date: string, detail: string, reason: string) => void }) {
  const [date, setDate] = useState(kind === "补卡申请" ? shiftDate(today, -1) : shiftDate(today, 1))
  const [detail, setDetail] = useState(kind === "补卡申请" ? "上班打卡 · 09:00" : kind === "请假申请" ? "年假 · 1 天" : "工作安排 · 1 天")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reason.trim()) {
      setError("请填写申请原因")
      return
    }
    onSubmit(kind, date, detail, reason.trim())
  }
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-form-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-application-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><FileText size={22} /></div><p className="eyebrow">EMPLOYEE REQUEST</p><h2 id="p0-application-title">{kind}</h2>
    <form className="p0-application-form" onSubmit={handleSubmit}><label className="p0-form-field">申请日期<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="p0-form-field">申请时段 / 类型<input value={detail} onChange={(event) => setDetail(event.target.value)} required /></label><label className="p0-form-field">申请原因<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="请填写申请原因" required /></label>{error && <span className="p0-form-error" role="alert">{error}</span>}<button className="p0-primary p0-submit-punch" type="submit">提交申请 <ArrowRight size={16} /></button></form>
  </section></div>
}

function RulesSheet({ onClose }: { onClose: () => void }) {
  const rules = [
    ["工作日班次", "09:00–18:00"],
    ["上班打卡时段", "08:30–09:30"],
    ["下班打卡时段", "17:30–19:30"],
    ["考勤地点", employee.site],
    ["有效定位范围", `${locationFixture.radius} 米`],
    ["补卡申请期限", "缺卡后 3 日内"],
  ]
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-rules-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-rules-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><ShieldCheck size={22} /></div><p className="eyebrow">ATTENDANCE POLICY</p><h2 id="p0-rules-title">打卡规则</h2><p className="p0-sheet-description">适用于当前员工及项目的考勤安排。</p><div className="p0-rule-list">{rules.map(([label, value]) => <div className="p0-rule-row" key={label}><Clock3 size={15} /><div><strong>{label}</strong><span>{value}</span></div><ChevronRight size={15} /></div>)}</div><button className="p0-primary p0-submit-punch" onClick={onClose}>关闭</button></section></div>
}

function ProductNote() {
  return <aside className="desktop-note"><div className="note-logo"><Fingerprint size={24} /></div><span>EMPLOYEE ATTENDANCE</span><h2>每日考勤服务</h2><p>从登录到打卡，再到日 / 周 / 月考勤追踪。</p><div className="note-list"><span><i />员工身份与组织信息</span><span><i />定位围栏与打卡时段校验</span><span><i />补卡、请假与审批进度</span><span><i />按日、周、月查看考勤</span></div><small>考勤规则以企业配置为准</small></aside>
}
