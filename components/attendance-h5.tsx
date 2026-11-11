"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Check,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Fingerprint,
  MapPin,
  Plane,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Wifi,
  X,
} from "lucide-react"
import { DatePickerField, OptionPickerField, TimePickerField } from "@/components/request-picker-fields"

type Tab = "打卡" | "日历" | "申请" | "我的"
type ViewMode = "日" | "周" | "月"
type ApplicationKind = "补卡申请" | "请假申请" | "出差申请" | "外出申请" | "加班申请"
type ApplicationStatus = "审批中" | "已通过" | "已拒绝"
type AttendanceStatus = "正常" | "迟到" | "早退" | "缺卡" | "待下班打卡" | "休息日" | "未开始"
type LocationPermissionStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "unsupported"
type LocationAction = "punch" | "refresh" | null
type Coordinates = { latitude: number; longitude: number }

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
  project: "中核2026年人力外包项目",
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

const locationFixture = { accuracy: 12, radius: 100 }
const demoFieldAddress = "深圳市南山区科技中一路18号"

const attendanceSites = [
  { name: "高新科技园·集团总部大厦（A座）", project: "中核2026年人力外包项目", site: "集团总部大厦（A座）", address: "深圳市南山区科技中一路18号", latitude: 22.5341, longitude: 113.93231 },
  { name: "高新科技园·创新中心（B座）", project: "高新科技园", site: "创新中心（B座）", address: "深圳市南山区科技中一路22号", latitude: 22.53448, longitude: 113.93271 },
  { name: "科技园·研发中心（C座）", project: "科技园", site: "研发中心（C座）", address: "深圳市南山区科苑南路66号", latitude: 22.5322, longitude: 113.9351 },
]

function calculateDistanceMeters(from: Coordinates, to: Coordinates) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDelta = toRadians(to.latitude - from.latitude)
  const longitudeDelta = toRadians(to.longitude - from.longitude)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)))
}

function findNearestAttendanceSite(coordinates: Coordinates) {
  return attendanceSites.map((site) => ({
    site,
    distance: calculateDistanceMeters(coordinates, site),
  })).sort((first, second) => first.distance - second.distance)[0] ?? null
}

 type PunchRecord = { id: string; kind: "上班打卡" | "下班打卡" | "外勤打卡"; time: string; status: "正常" | "早退" | "迟到"; note?: string; photoName?: string; location?: string }

const initialPunchRecords: PunchRecord[] = [
  { id: "punch-115120", kind: "下班打卡", time: "11:51:20", status: "早退" },
  { id: "punch-115116", kind: "下班打卡", time: "11:51:16", status: "早退" },
  { id: "punch-085214", kind: "上班打卡", time: "08:52:14", status: "正常" },
]

const navItems: { label: Tab; icon: typeof Clock3 }[] = [
  { label: "打卡", icon: Clock3 },
  { label: "日历", icon: CalendarDays },
  { label: "申请", icon: ClipboardList },
  { label: "我的", icon: UserRound },
]

const requestItems: { kind: ApplicationKind; icon: typeof Clock3; hint: string }[] = [
  { kind: "请假申请", icon: CalendarDays, hint: "提交假期审批申请" },
  { kind: "出差申请", icon: Plane, hint: "登记出差安排" },
  { kind: "外出申请", icon: MapPin, hint: "提交工作外出申请" },
  { kind: "补卡申请", icon: Clock3, hint: "补充遗漏的打卡记录" },
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
  const [fieldPunchOpen, setFieldPunchOpen] = useState(false)
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState<ApplicationKind | null>(null)
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>()
  const [exceptionRecord, setExceptionRecord] = useState<AttendanceRecord | null>(null)
  const [notice, setNotice] = useState("")
  const [punchedOut, setPunchedOut] = useState(true)
  const [punchRecords, setPunchRecords] = useState(initialPunchRecords)
  const [currentTime, setCurrentTime] = useState("14:22:08")
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null)

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Shanghai" }).format(new Date()))
    updateCurrentTime()
    const interval = window.setInterval(updateCurrentTime, 1000)
    return () => window.clearInterval(interval)
  }, [])
  const [attendanceMode, setAttendanceMode] = useState<ViewMode>("日")
  const [selectedDate, setSelectedDate] = useState(today)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseISODate(today)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [applicationFilter, setApplicationFilter] = useState("全部")
  const [applications, setApplications] = useState(() => createApplicationRecords(today))
  const [locationPermission, setLocationPermission] = useState<LocationPermissionStatus>("idle")
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [locationPermissionOpen, setLocationPermissionOpen] = useState(false)
  const [pendingLocationAction, setPendingLocationAction] = useState<LocationAction>(null)

  useEffect(() => {
    if (!navigator.permissions?.query) return
    let active = true
    navigator.permissions.query({ name: "geolocation" }).then(({ state }) => {
      if (!active) return
      if (state === "granted" && navigator.geolocation) {
        setLocationPermission("granted")
        setLocationPermissionOpen(false)
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          if (!active) return
          setCurrentCoordinates({ latitude: coords.latitude, longitude: coords.longitude })
          setLocationAccuracy(Math.round(coords.accuracy))
        }, () => {
          if (active) setLocationPermission("unavailable")
        }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 })
      } else if (state === "denied") {
        setLocationPermission("denied")
      }
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2600)
  }

  const requestLocationPermission = (action: LocationAction = pendingLocationAction) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationPermission("unsupported")
      setPendingLocationAction(action)
      setLocationPermissionOpen(true)
      return
    }
    setLocationPermission("requesting")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentCoordinates({ latitude: coords.latitude, longitude: coords.longitude })
        setLocationAccuracy(Math.round(coords.accuracy))
        setLocationPermission("granted")
        setLocationPermissionOpen(false)
        setPendingLocationAction(null)
        if (action === "punch") setLocationOpen(true)
        showNotice("已获取定位权限")
      },
      (error) => {
        setLocationPermission(error.code === 1 ? "denied" : "unavailable")
        setPendingLocationAction(action)
        setLocationPermissionOpen(true)
        setLocationOpen(false)
        setFieldPunchOpen(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  const openAttendancePunch = () => {
    if (locationPermission === "granted") requestLocationPermission("punch")
    else {
      setPendingLocationAction("punch")
      setLocationPermissionOpen(true)
    }
  }

  const openFieldPunch = () => {
    setPendingLocationAction(null)
    setFieldPunchOpen(true)
  }

  const refreshHomeLocation = () => {
    if (locationPermission === "granted") requestLocationPermission("refresh")
    else {
      setPendingLocationAction("refresh")
      setLocationPermissionOpen(true)
    }
  }

  const openRequest = (kind: ApplicationKind, initialDate?: string) => {
    setFormInitialDate(initialDate)
    setFormOpen(kind)
  }
  const openExceptionRequest = (kind: ApplicationKind) => {
    if (!exceptionRecord) return
    const requestDate = exceptionRecord.date
    setExceptionRecord(null)
    openRequest(kind, requestDate)
  }
  const openDate = (date: string) => {
    setSelectedDate(date)
    const parsed = parseISODate(date)
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }
  const nearestSiteMatch = useMemo(() => currentCoordinates ? findNearestAttendanceSite(currentCoordinates) : null, [currentCoordinates])
  const selectedSite = nearestSiteMatch?.site ?? attendanceSites[0]
  const distance = nearestSiteMatch?.distance ?? null
  const isWithinRange = distance !== null && distance <= locationFixture.radius
  const canPunch = locationPermission === "granted" && isWithinRange
  const visibleApplications = useMemo(() => applications.filter((item) => applicationFilter === "全部" || item.status === applicationFilter), [applications, applicationFilter])

  const submitFieldPunch = ({ remark, photoName, address }: { remark: string; photoName: string; address: string }) => {
    setPunchRecords((current) => [{ id: `field-${Date.now()}`, kind: "外勤打卡", time: currentTime, status: "正常", note: remark, photoName, location: address }, ...current])
    setFieldPunchOpen(false)
    showNotice("外勤打卡已提交")
  }

  const submitPunch = () => {
    if (locationPermission !== "granted" || distance === null) {
      setPendingLocationAction("punch")
      setLocationOpen(false)
      setLocationPermissionOpen(true)
      return
    }
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
    setFormInitialDate(undefined)
    setApplicationFilter("全部")
    setActiveTab("申请")
    showNotice("申请已提交，当前状态：审批中")
  }

  return <main className="h5-shell">
    <div className="phone-frame">
      <StatusBar time={currentTime} />
      <header className="p0-app-header">
        <span className="p0-app-back" aria-hidden="true"><ChevronLeft size={20} strokeWidth={1.8} /></span>
        <h1>考勤打卡（天宇正清）</h1>
        <span aria-hidden="true" />
      </header>
      {activeTab === "打卡" && <HomeScreen
        today={today}
        currentTime={currentTime}
        punchRecords={punchRecords}
        currentCoordinates={currentCoordinates}
        distance={distance}
        locationAccuracy={locationAccuracy}
        selectedSite={selectedSite}
        locationPermission={locationPermission}
        canPunch={canPunch}
        punchedOut={punchedOut}
        onPunch={openAttendancePunch}
        onRefreshLocation={refreshHomeLocation}
        onFieldPunch={openFieldPunch}
        onProjectDetails={() => setProjectDetailsOpen(true)}
        onRequestRepair={() => openRequest("补卡申请")}
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
        onException={setExceptionRecord}
      />}
      {activeTab === "申请" && <ApplicationsScreen items={visibleApplications} filter={applicationFilter} setFilter={setApplicationFilter} onRequest={openRequest} />}
      {activeTab === "我的" && <ProfileScreen onRules={() => setRulesOpen(true)} onLogin={() => setLoginOpen(true)} onApplications={() => setActiveTab("申请")} />}

      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={activeTab === label ? "nav-active" : ""} aria-current={activeTab === label ? "page" : undefined} onClick={() => setActiveTab(label)}>
          <Icon size={20} /><span>{label}</span>{label === "我的" && applications.some((item) => item.status === "审批中") && <i className="nav-dot" />}
        </button>)}
      </nav>

      {loginOpen && <LoginSheet onClose={() => setLoginOpen(false)} />}
      {rulesOpen && <RulesSheet onClose={() => setRulesOpen(false)} />}
      {locationOpen && distance !== null && <LocationSheet site={selectedSite} distance={distance} accuracy={locationAccuracy} onRefresh={() => requestLocationPermission("punch")} onClose={() => setLocationOpen(false)} onSubmit={submitPunch} />}
      {fieldPunchOpen && <OutdoorPunchSheet address={demoFieldAddress} onClose={() => setFieldPunchOpen(false)} onSubmit={submitFieldPunch} />}
      {locationPermissionOpen && <LocationPermissionDialog permissionStatus={locationPermission} onRequestPermission={() => requestLocationPermission(pendingLocationAction)} onClose={() => { setLocationPermissionOpen(false); setPendingLocationAction(null) }} />}
      {projectDetailsOpen && <ProjectDetailsSheet site={selectedSite} onClose={() => setProjectDetailsOpen(false)} />}
      {exceptionRecord && <ExceptionSheet record={exceptionRecord} onClose={() => setExceptionRecord(null)} onRequest={openExceptionRequest} />}
      {formOpen && <ApplicationSheet kind={formOpen} today={today} initialDate={formInitialDate} onClose={() => { setFormOpen(null); setFormInitialDate(undefined) }} onSubmit={submitApplication} />}
      {notice && <div className="p0-toast" role="status">{notice}</div>}
    </div>
    <ProductNote />
  </main>
}

function StatusBar({ time }: { time: string }) {
  return <div className="status-bar"><span>{time.slice(0, 5)}</span><div className="status-icons"><span>5G</span><Wifi size={15} /><span className="battery"><i /></span></div></div>
}

function HomeScreen({ today, currentTime, punchRecords, currentCoordinates, distance, locationAccuracy, locationPermission, selectedSite, canPunch, punchedOut, onPunch, onRefreshLocation, onFieldPunch, onProjectDetails, onRequestRepair }: {
  today: string
  currentTime: string
  punchRecords: PunchRecord[]
  currentCoordinates: Coordinates | null
  distance: number | null
  locationAccuracy: number | null
  locationPermission: LocationPermissionStatus
  selectedSite: (typeof attendanceSites)[number]
  canPunch: boolean
  punchedOut: boolean
  onPunch: () => void
  onRefreshLocation: () => void
  onFieldPunch: () => void
  onProjectDetails: () => void
  onRequestRepair: () => void
}) {
  const [showOtherSites, setShowOtherSites] = useState(false)
  const record = createAttendanceRecord(today, today, punchedOut)
  const rangeLabel = distance === null ? "待定位" : distance <= locationFixture.radius ? `范围内 ${distance}m` : `范围外 ${distance}m`
  const otherSites = attendanceSites
    .filter((site) => site.name !== selectedSite.name)
    .map((site) => ({ ...site, distance: currentCoordinates ? calculateDistanceMeters(currentCoordinates, site) : null }))
    .sort((first, second) => (first.distance ?? Number.POSITIVE_INFINITY) - (second.distance ?? Number.POSITIVE_INFINITY))
  const punchHint = !record.isWorkingDay
    ? "今日为休息日，无需打卡"
    : distance === null
      ? "获取当前位置后自动匹配考勤点"
      : distance > locationFixture.radius
        ? `距离最近考勤点 ${distance}m，超出 ${locationFixture.radius}m，无法打卡`
        : `已匹配 ${selectedSite.site} · 距离 ${distance}m`

  return <section className="page-content p0-checkin-home">
    <section className="p0-card p0-clock-card p0-rule-card" aria-labelledby="p0-rule-title">
      <div className="p0-home-sync"><span><i />考勤规则</span><span className="p0-demo-tag">示例规则</span></div>
      <div className="p0-home-site">
        <span className="p0-site-icon"><MapPin size={17} /></span>
        <div><strong id="p0-rule-title">{selectedSite.site}</strong><span>{selectedSite.address}</span></div>
        <span className={`p0-location-state ${distance === null ? "is-neutral" : distance > locationFixture.radius ? "is-outside" : ""}`}>{rangeLabel}</span>
        <button type="button" aria-label={showOtherSites ? "收起其他考勤地址" : "查看更多考勤地址"} aria-expanded={showOtherSites} aria-controls="p0-other-site-list" title="查看更多考勤地址" onClick={() => setShowOtherSites((current) => !current)}><ChevronDown size={15} /></button>
      </div>
      {showOtherSites && <div className="p0-other-addresses" id="p0-other-site-list">
        <strong>其他考勤地址</strong>
        {otherSites.map((site) => <div className="p0-other-address" key={site.name}>
          <span><b>{site.site}</b><small>{site.address}</small></span>
          <em>{site.distance === null ? "待定位" : `${site.distance}m`}</em>
        </div>)}
      </div>}
      <p className="p0-work-meta p0-rule-time">上班 {schedule.startWindow} · 下班 {schedule.endWindow}</p>
      <div className="p0-project-info"><BriefcaseBusiness size={15} /><span>项目名称</span><button type="button" className="p0-project-name-button" title={selectedSite.project} aria-label={`查看项目详情：${selectedSite.project}`} onClick={onProjectDetails}>{selectedSite.project}</button></div>
    </section>

    <section className="p0-card p0-clock-card p0-current-clock-card" aria-labelledby="p0-current-time-title">
      <div className="p0-home-time-row"><span id="p0-current-time-title">当前时间</span><time className="p0-live-time">{currentTime}</time><span className="p0-home-time-zone">{dateLabel(today, { month: "numeric", day: "numeric" })} · 北京时间</span></div>
      <div className="p0-home-site p0-current-site">
        <span className="p0-site-icon"><MapPin size={17} /></span>
        <div><strong>{currentCoordinates ? `最近考勤点：${selectedSite.site}` : locationPermission === "requesting" ? "正在获取定位…" : "尚未获取当前位置"}</strong><span>{currentCoordinates ? `${currentCoordinates.latitude.toFixed(5)}, ${currentCoordinates.longitude.toFixed(5)} · ${selectedSite.address}` : "定位后自动匹配最近考勤点"}</span></div>
        <span className={`p0-location-state ${distance === null ? "is-neutral" : distance > locationFixture.radius ? "is-outside" : ""}`}>{rangeLabel}</span>
        <button type="button" disabled={locationPermission === "requesting"} aria-label={currentCoordinates ? "刷新当前位置" : "获取当前位置"} title={currentCoordinates ? "刷新定位" : "获取定位"} onClick={onRefreshLocation}><RefreshCw size={15} /></button>
      </div>
      {currentCoordinates && <p className="p0-location-accuracy">定位精度 ±{locationAccuracy ?? "—"}m · 考勤点坐标为演示数据</p>}
    </section>

    <section className="p0-card p0-main-punch-card" aria-label="打卡操作">
      <div className="p0-punch-status"><i className={canPunch ? "is-ready" : "is-blocked"} />{canPunch ? `已匹配 ${selectedSite.site} · 可打卡` : distance !== null && distance > locationFixture.radius ? "不在考勤范围内 · 打卡已禁用" : "等待定位匹配考勤点"}</div>
      <button className="p0-punch-orb" disabled={!canPunch || !record.isWorkingDay} aria-label={punchedOut ? "更新下班卡" : "上班打卡"} onClick={onPunch}>
        <ShieldCheck size={24} strokeWidth={1.8} /><strong>{punchedOut ? "更新下班卡" : "上班打卡"}</strong><span>{currentTime}</span>
      </button>
      <p className="p0-punch-hint">{punchHint}</p>
      <div className="p0-home-actions"><button type="button" onClick={onFieldPunch}><MapPin size={14} />外勤打卡</button></div>
    </section>

    <section className="p0-card p0-home-records">
      <div className="p0-records-heading"><h2>今日打卡记录</h2><span>共 {punchRecords.length} 条记录</span></div>
      <div className="p0-home-record-list">{punchRecords.slice(0, 4).map((item) => <article className="p0-home-record" key={item.id}>
        <span className={`p0-record-badge ${item.kind === "上班打卡" ? "is-start" : item.kind === "外勤打卡" ? "is-field" : ""}`}>{item.kind === "上班打卡" ? "上" : item.kind === "外勤打卡" ? "外" : "下"}</span>
        <div className="p0-home-record-copy"><strong>{item.kind}<time>{item.time}</time></strong><span><MapPin size={11} />{item.location ?? selectedSite.site}</span></div>
        <span className={`p0-home-record-status ${item.status === "正常" ? "is-normal" : "is-exception"}`}>{item.status}</span>
      </article>)}</div>
      <div className="p0-missed-punch-link"><span>忘记打卡？</span><button type="button" onClick={onRequestRepair}>申请补卡 <ChevronRight size={14} /></button></div>
    </section>
  </section>
}

function AttendanceScreen({ mode, setMode, today, selectedDate, punchedOut, onSelectDate, visibleMonth, onMonthChange, onException }: {
  mode: ViewMode
  setMode: (value: ViewMode) => void
  today: string
  selectedDate: string
  punchedOut: boolean
  onSelectDate: (value: string) => void
  visibleMonth: Date
  onMonthChange: (value: Date) => void
  onException: (record: AttendanceRecord) => void
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
    <div className="p0-attendance-title"><h1>考勤明细</h1></div>
    <div className="p0-view-tabs" role="tablist" aria-label="考勤统计周期">{(["日", "周", "月"] as const).map((value) => <button role="tab" aria-selected={mode === value} className={mode === value ? "is-selected" : ""} key={value} onClick={() => setMode(value)}>{value}统计</button>)}</div>

    {mode === "日" && <>
      <PeriodNavigator label={dateLabel(selectedDate)} onPrevious={() => onSelectDate(shiftDate(selectedDate, -1))} onNext={() => onSelectDate(shiftDate(selectedDate, 1))} onToday={() => onSelectDate(today)} />
      <SummaryGrid items={[{ label: "应打卡", value: selectedRecord.isWorkingDay ? "2" : "0", unit: "次" }, { label: "已打卡", value: String(punchCount), unit: "次" }, { label: "考勤结果", value: selectedRecord.status, unit: "" }]} />
      <DailyAttendanceCard record={selectedRecord} onException={() => onException(selectedRecord)} />
    </>}

    {mode === "周" && <>
      <PeriodNavigator label={`${dateLabel(weekDates[0], { month: "numeric", day: "numeric" })} – ${dateLabel(weekDates[6], { month: "numeric", day: "numeric" })}`} onPrevious={() => onSelectDate(shiftDate(selectedDate, -7))} onNext={() => onSelectDate(shiftDate(selectedDate, 7))} onToday={() => onSelectDate(today)} />
      <SummaryGrid items={[{ label: "应出勤", value: String(weekSummary.expectedDays), unit: "天" }, { label: "实际出勤", value: String(weekSummary.attendedDays), unit: "天" }, { label: "迟到 / 早退", value: String(weekSummary.lateEarly), unit: "次" }, { label: "缺卡", value: String(weekSummary.missed), unit: "次" }]} />
      <section className="p0-card p0-period-card"><div className="p0-period-head"><div><p className="eyebrow">WEEKLY DETAIL</p><h2>每日考勤</h2></div><span>{weekSummary.expectedDays} 个工作日</span></div><div className="p0-week-list">{weekDates.map((date) => { const record = createAttendanceRecord(date, today, punchedOut); return <button className="p0-week-day" key={date} onClick={() => { onSelectDate(date); setMode("日") }}><span className="p0-week-date"><b>{dateLabel(date, { weekday: "short" })}</b><small>{dateLabel(date, { month: "numeric", day: "numeric" })}</small></span><span className="p0-week-times">{record.status === "休息日" || record.status === "未开始" ? <b>{record.status}</b> : <><b>{record.startTime ?? "缺卡"}</b><i>—</i><b>{record.endTime ?? "待打卡"}</b></>}</span><StatusPill status={record.status} /><ChevronRight size={15} /></button> })}</div></section>
    </>}

    {mode === "月" && <>
      <PeriodNavigator label={monthLabel} onPrevious={() => selectMonth(-1)} onNext={() => selectMonth(1)} onToday={() => { const date = parseISODate(today); onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1)); onSelectDate(today) }} />
      <SummaryGrid items={[{ label: "应出勤", value: String(monthSummary.expectedDays), unit: "天" }, { label: "实际出勤", value: String(monthSummary.attendedDays), unit: "天" }, { label: "迟到 / 早退", value: String(monthSummary.lateEarly), unit: "次" }, { label: "缺卡", value: String(monthSummary.missed), unit: "次" }]} />
      <section className="p0-card p0-calendar-card"><div className="p0-period-head"><div><p className="eyebrow">MONTHLY OVERVIEW</p><h2>月度考勤</h2></div><span>{monthSummary.punched} 次打卡</span></div><div className="p0-calendar-grid p0-calendar-weekdays" aria-hidden="true">{"一二三四五六日".split("").map((day) => <span key={day}>{day}</span>)}</div><div className="p0-calendar-grid" role="group" aria-label={`${monthLabel}日期`}>{monthDates.map((date) => { const record = createAttendanceRecord(date, today, punchedOut); const inMonth = parseISODate(date).getMonth() === visibleMonth.getMonth(); return <button type="button" key={date} aria-label={`${date}，${record.status}`} aria-pressed={selectedDate === date} className={`${inMonth ? "" : "is-outside"} ${selectedDate === date ? "is-selected" : ""} ${date === today ? "is-today" : ""} ${statusClass(record.status)}`} onClick={() => onSelectDate(date)}><span>{parseISODate(date).getDate()}</span>{record.status === "缺卡" ? <em className="p0-calendar-missed-label" aria-hidden="true">缺卡</em> : <i aria-hidden="true" />}</button> })}</div><div className="p0-calendar-key"><span className="p0-calendar-key-dot status-normal" />正常 <span className="p0-calendar-key-dot status-exception" />异常 <span className="p0-calendar-key-dot status-rest" />休息日</div></section>
      <DailyAttendanceCard record={selectedRecord} onException={() => onException(selectedRecord)} />
    </>}
  </section>
}

function DailyAttendanceCard({ record, onException }: { record: AttendanceRecord; onException: () => void }) {
  const showStartException = record.status === "迟到" || (record.status === "缺卡" && !record.startTime)
  const showEndException = record.status === "早退" || (record.status === "缺卡" && Boolean(record.startTime) && !record.endTime)
  return <section className="p0-card p0-detail-card"><div className="p0-card-head"><div><p className="eyebrow">{record.date} · 本人考勤</p><h2>{record.isWorkingDay ? schedule.name : record.status}</h2></div><StatusPill status={record.status} /></div>
    {record.isWorkingDay && <>
      <div className="p0-record-row"><span className="p0-record-icon"><Clock3 size={16} /></span><div><strong>上班打卡</strong><small>应打卡 {schedule.start} · 时段 {schedule.startWindow}</small></div><b className={!record.startTime && record.status === "缺卡" ? "p0-missed-punch-value" : ""}>{record.startTime ?? (record.status === "未开始" ? "--:--" : "缺卡")}</b></div>
      {showStartException && <button type="button" className="p0-exception-trigger" onClick={onException}><CircleAlert size={15} />异常处理<ChevronRight size={15} /></button>}
      <div className="p0-record-row"><span className="p0-record-icon p0-record-muted"><Clock3 size={16} /></span><div><strong>下班打卡</strong><small>应打卡 {schedule.end} · 时段 {schedule.endWindow}</small></div><b className={!record.endTime && record.status === "缺卡" ? "p0-missed-punch-value" : ""}>{record.endTime ?? (record.status === "未开始" ? "--:--" : "待打卡")}</b></div>
      {showEndException && <button type="button" className="p0-exception-trigger" onClick={onException}><CircleAlert size={15} />异常处理<ChevronRight size={15} /></button>}
      <div className="p0-result-row"><span>考勤结果</span><strong>{record.status}</strong></div>
    </>}
    {!record.isWorkingDay && <div className="p0-empty p0-rest-day"><CalendarDays size={20} /><strong>{record.status === "休息日" ? "今日休息" : "班次尚未开始"}</strong><span>{record.status === "休息日" ? "无需打卡" : "该日期暂无排班"}</span></div>}
  </section>
}

function ExceptionSheet({ record, onClose, onRequest }: { record: AttendanceRecord; onClose: () => void; onRequest: (kind: ApplicationKind) => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-exception-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-exception-title" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><button className="sheet-close" type="button" onClick={onClose} aria-label="关闭"><X size={20} /></button>
    <div className="sheet-icon"><CircleAlert size={22} /></div><p className="eyebrow">ATTENDANCE EXCEPTION</p><h2 id="p0-exception-title">异常处理</h2>
    <p className="p0-sheet-description">{dateLabel(record.date)} · {record.status}，请选择处理方式。</p>
    <div className="p0-request-grid p0-exception-actions" role="group" aria-label="异常处理入口">{requestItems.map(({ kind, icon: Icon, hint }) => <button key={kind} type="button" onClick={() => onRequest(kind)}><span><Icon size={18} /></span><strong>{kind.replace("申请", "")}</strong><small>{hint}</small></button>)}</div>
  </section></div>
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



function ProjectDetailsSheet({ site, onClose }: { site: (typeof attendanceSites)[number]; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-project-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-project-detail-title" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><button type="button" className="sheet-close" onClick={onClose} aria-label="关闭项目详情"><X size={20} /></button>
    <div className="sheet-icon"><BriefcaseBusiness size={22} /></div><p className="eyebrow">PROJECT DETAILS</p><h2 id="p0-project-detail-title">驻场项目详情</h2>
    <div className="p0-project-detail-list"><div><span>项目名称</span><strong>{site.project}</strong></div><div><span>驻场地点</span><strong>{site.site}</strong></div><div><span>办公地址</span><strong>{site.address}</strong></div><div><span>考勤范围</span><strong>{locationFixture.radius} 米</strong></div></div>
    <button type="button" className="p0-primary p0-project-detail-confirm" onClick={onClose}>完成 <Check size={16} /></button>
  </section></div>
}

function ApplicationsScreen({ items, filter, setFilter, onRequest }: { items: ApplicationRecord[]; filter: string; setFilter: (value: string) => void; onRequest: (kind: ApplicationKind) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  return <section className="page-content subpage p0-applications-hub"><p className="eyebrow">员工申请</p><h1>申请</h1><p className="p0-page-description">发起请假等申请，并查看审批进度与记录</p>
    <section className="p0-request-block" aria-labelledby="p0-request-entry-title"><div className="p0-request-heading"><h2 id="p0-request-entry-title">申请入口</h2><span>选择类型开始填写</span></div><div className="p0-request-grid">{requestItems.map(({ kind, icon: Icon, hint }) => <button key={kind} type="button" onClick={() => onRequest(kind)}><span><Icon size={18} /></span><strong>{kind}</strong><small>{hint}</small></button>)}</div></section>
    <section className="p0-request-records" aria-labelledby="p0-request-records-title"><div className="p0-request-heading"><h2 id="p0-request-records-title">我的申请记录</h2><span>{items.length} 条</span></div>
      <div className="p0-filter-row" role="group" aria-label="按审批状态筛选">{["全部", "审批中", "已通过", "已拒绝"].map((value) => <button key={value} aria-pressed={filter === value} className={filter === value ? "is-selected" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div>
      {items.length > 0 ? <div className="p0-application-list">{items.map((item) => <article className="p0-card p0-application-card" key={item.id}>
        <div className="p0-application-head"><span className="p0-application-icon">{item.kind === "补卡申请" ? <Clock3 size={18} /> : <FileText size={18} />}</span><div><strong>{item.kind}</strong><small>{item.date} · {item.detail}</small></div><span className={`p0-status ${item.status === "已通过" ? "p0-status-success" : item.status === "已拒绝" ? "p0-status-error" : ""}`}>{item.status}</span></div>
        <div className="p0-application-body"><p><span>申请原因</span><strong>{item.reason}</strong></p>{item.comment && <p><span>处理意见</span><strong>{item.comment}</strong></p>}</div>
        <button type="button" className="p0-approval-track" aria-expanded={expandedId === item.id} onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}><span className="p0-track-dot" /><span>{expandedId === item.id ? "收起申请详情" : "查看申请详情与审批轨迹"}</span><ChevronRight size={15} /></button>
        {expandedId === item.id && <section className="p0-application-detail"><strong>审批轨迹</strong><p>提交申请 · {item.date}</p><p>当前审批人：项目主管（姓名待配置）</p><p>后续节点：部门主管（姓名待配置）</p><p>当前状态：{item.status}</p>{item.comment && <p>处理意见：{item.comment}</p>}</section>}
      </article>)}</div> : <div className="p0-empty"><FileText size={24} /><strong>暂无此状态的申请</strong><span>提交申请后，可在这里查看审批进度与处理记录</span></div>}
    </section>
  </section>
}

function ProfileScreen({ onRules, onLogin, onApplications }: { onRules: () => void; onLogin: () => void; onApplications: () => void }) {
  return <section className="page-content subpage"><p className="eyebrow">个人空间</p><h1>我的</h1>
    <section className="p0-profile-card"><div className="avatar">林</div><div><strong>示例员工</strong><span>{employee.department} · {employee.role}</span></div><span className="active-pill">原型数据</span></section>
    <div className="p0-profile-list"><div><span>员工编号</span><strong>{employee.employeeId}</strong></div><div><span>所属企业</span><strong>{employee.company}</strong></div><div><span>所在项目</span><strong>{employee.project}</strong></div><button onClick={onApplications}>我的申请<ChevronRight size={17} /></button><button onClick={onRules}>查看打卡规则<ChevronRight size={17} /></button><button onClick={onRules}>考勤地点与权限<ChevronRight size={17} /></button><button onClick={onLogin}>企业微信登录<ChevronRight size={17} /></button><button type="button" className="p0-disabled-action" disabled>退出登录（尚未登录）<ChevronRight size={17} /></button></div>
    <div className="p0-card p0-privacy-card"><ShieldCheck size={18} /><div><strong>原型预览</strong><span>员工资料为示例内容；企业微信认证与员工权限尚未接入。</span></div></div>
  </section>
}

function LoginSheet({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-login-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-login-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><ShieldCheck size={22} /></div><p className="eyebrow">员工账号</p><h2 id="p0-login-title">企业微信登录</h2>
    <div className="p0-login-panel"><div className="p0-wechat-mark">企</div><strong>企业微信身份认证</strong><span>登录后按企业成员身份校验访问权限</span><button className="p0-primary" disabled>企业微信授权暂未接入 <ChevronRight size={16} /></button></div>
    <p className="p0-disclaimer">当前为界面原型，不会创建登录会话或判定员工权限。</p>
  </section></div>
}

function OutdoorPunchSheet({ address, onClose, onSubmit }: { address: string; onClose: () => void; onSubmit: (details: { remark: string; photoName: string; address: string }) => void }) {
  const [remark, setRemark] = useState("")
  const [photoName, setPhotoName] = useState("")
  const [remarkError, setRemarkError] = useState("")
  const [photoError, setPhotoError] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextRemarkError = remark.trim() ? "" : "请填写打卡备注。"
    const nextPhotoError = photoName ? "" : "请拍摄或选择一张现场照片。"
    setRemarkError(nextRemarkError)
    setPhotoError(nextPhotoError)
    if (nextRemarkError || nextPhotoError) return
    onSubmit({ remark: remark.trim(), photoName, address })
  }

  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-outdoor-title" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><button type="button" className="sheet-close" onClick={onClose} aria-label="关闭外勤打卡"><X size={20} /></button><div className="sheet-icon"><MapPin size={22} /></div><p className="eyebrow">现场打卡</p><h2 id="p0-outdoor-title">外勤打卡</h2><p className="p0-sheet-description">确认当前位置，填写打卡备注并拍摄现场照片后提交。</p>
    <div className="p0-location-status"><MapPin size={18} /><div><strong>当前地址</strong><span>{address}</span></div><span className="p0-location-state">示例</span></div>
    <p className="p0-disclaimer">当前为演示地址；接入实际定位后可替换为真实地址。</p>
    <form noValidate onSubmit={handleSubmit}>
      <label className="p0-form-field"><span>打卡备注（必填）</span><textarea value={remark} onChange={(event) => { setRemark(event.target.value); if (event.target.value.trim()) setRemarkError("") }} placeholder="请输入本次外勤情况" maxLength={200} required aria-required="true" aria-invalid={Boolean(remarkError)} aria-describedby={remarkError ? "p0-outdoor-remark-error" : undefined} /></label>
      {remarkError && <span id="p0-outdoor-remark-error" className="p0-required-error" role="alert">{remarkError}</span>}
      <label className="p0-form-field"><span>拍照（必填）</span><span className="p0-file-picker"><span className="p0-file-picker-copy"><strong>{photoName || "拍摄或选择现场照片"}</strong><small>{photoName ? "已添加照片" : "将打开相机或相册"}</small></span><input type="file" accept="image/*" capture="environment" required aria-label="拍照（必填）" aria-required="true" aria-invalid={Boolean(photoError)} aria-describedby={photoError ? "p0-outdoor-photo-error" : undefined} onChange={(event) => { const file = event.target.files?.[0]; setPhotoName(file?.name ?? ""); if (file) setPhotoError("") }} /></span></label>
      {photoError && <span id="p0-outdoor-photo-error" className="p0-required-error" role="alert">{photoError}</span>}
      <button type="submit" className="p0-primary p0-submit-punch">确认外勤打卡 <Check size={17} /></button>
    </form>
  </section></div>
}

function LocationPermissionDialog({ permissionStatus, onRequestPermission, onClose }: { permissionStatus: LocationPermissionStatus; onRequestPermission: () => void; onClose: () => void }) {
  const permissionMessage = permissionStatus === "denied"
    ? "定位权限未开启，请在浏览器或微信的页面权限设置中允许定位后重试。"
    : permissionStatus === "unsupported"
      ? "当前环境不支持定位，请使用支持定位的浏览器打开。"
      : permissionStatus === "unavailable"
        ? "暂时无法获取当前位置，请检查设备定位服务后重试。"
        : ""

  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-permission-title" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><button type="button" className="sheet-close" onClick={onClose} aria-label="关闭定位提示"><X size={20} /></button><div className="sheet-icon"><MapPin size={22} /></div><p className="eyebrow">LOCATION PERMISSION</p><h2 id="p0-permission-title">获取定位权限</h2><p className="p0-sheet-description">定位用于核验打卡位置与考勤范围。只会在你获取或刷新定位时读取，不会在后台持续定位。</p>
    <div className="p0-demo-banner" role="status"><MapPin size={15} /><span><strong>请允许访问设备位置。</strong>浏览器会在你点击下方按钮后申请定位权限。</span></div>
    {permissionMessage && <div className="p0-rule-warning" role="alert"><CircleAlert size={15} /><span>{permissionMessage}</span></div>}
    <button type="button" className="p0-primary p0-submit-punch" onClick={onRequestPermission} disabled={permissionStatus === "requesting"}>{permissionStatus === "requesting" ? "正在获取定位" : permissionStatus === "denied" ? "重新获取定位权限" : "获取定位权限"} <ArrowRight size={17} /></button>
    <button type="button" className="p0-inline-link p0-refresh-location" onClick={onClose}>暂不，先进入打卡首页</button>
  </section></div>
}

function LocationSheet({ site, distance, accuracy, onRefresh, onClose, onSubmit }: { site: (typeof attendanceSites)[number]; distance: number; accuracy: number | null; onRefresh: () => void; onClose: () => void; onSubmit: () => void }) {
  const isWithinRange = distance <= locationFixture.radius
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-location-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button type="button" className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><MapPin size={22} /></div><p className="eyebrow">LOCATION CHECK</p><h2 id="p0-location-title">确认打卡位置</h2><p className="p0-sheet-description">请确认当前定位与考勤地点一致，打卡时间将以服务器记录为准。</p>
    <div className="p0-location-status"><MapPin size={18} /><div><strong>{site.site}</strong><span>{site.address}</span></div><span className={`p0-location-state ${isWithinRange ? "" : "is-outside"}`}>{isWithinRange ? "范围内" : "超出范围"}</span></div>
    <div className="p0-location-metrics p0-sheet-metrics"><span>定位精度 {accuracy ?? "—"} 米</span><strong>示例距离 {distance}m</strong><span>考勤范围 {locationFixture.radius}m（示例）</span></div>
    <button type="button" className="p0-inline-link p0-refresh-location" onClick={onRefresh}>重新定位 <ArrowRight size={15} /></button>
    {!isWithinRange && <div className="p0-rule-warning" role="status"><CircleAlert size={15} /><span>示例距离 {distance}m，超出示例考勤范围 {locationFixture.radius}m。</span></div>}
    <button type="button" className="p0-primary p0-submit-punch" onClick={onSubmit} disabled={!isWithinRange}>{isWithinRange ? "确认更新下班卡" : "当前无法打卡"} <Check size={17} /></button><p className="p0-disclaimer">距离为示例数据，需配置考勤点坐标。</p>
  </section></div>
}

function ApplicationSheet({ kind, today, initialDate, onClose, onSubmit }: { kind: ApplicationKind; today: string; initialDate?: string; onClose: () => void; onSubmit: (kind: ApplicationKind, date: string, detail: string, reason: string) => void }) {
  const defaultDate = initialDate ?? (kind === "补卡申请" ? shiftDate(today, -1) : shiftDate(today, 1))
  const [startDate, setStartDate] = useState(defaultDate)
  const [endDate, setEndDate] = useState(defaultDate)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("18:00")
  const [punchPeriod, setPunchPeriod] = useState("上班打卡")
  const [leaveType, setLeaveType] = useState("年假")
  const [leavePeriod, setLeavePeriod] = useState("全天")
  const [destination, setDestination] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const isBackfill = kind === "补卡申请"
  const isLeave = kind === "请假申请"
  const isTravel = kind === "出差申请"

  const updateStartDate = (value: string) => {
    setStartDate(value)
    if (endDate < value) setEndDate(value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reason.trim()) {
      setError("请填写申请原因")
      return
    }
    if (!isBackfill && endDate < startDate) {
      setError("结束日期不能早于开始日期")
      return
    }
    if (!isBackfill && !isLeave && endDate === startDate && endTime < startTime) {
      setError("结束时间不能早于开始时间")
      return
    }
    if (isTravel && !destination.trim()) {
      setError("请填写出差地点")
      return
    }

    const requestDate = isBackfill ? startDate : `${startDate} 至 ${endDate}`
    const detail = isBackfill
      ? `${punchPeriod} · ${startTime}`
      : isLeave
        ? `${leaveType} · ${leavePeriod}`
        : isTravel
          ? `${destination.trim()} · ${startTime}–${endTime}`
          : `${startTime}–${endTime}`
    onSubmit(kind, requestDate, detail, reason.trim())
  }

  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-form-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-application-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><div className="sheet-icon"><FileText size={22} /></div><p className="eyebrow">申请信息</p><h2 id="p0-application-title">{kind}</h2>
    <form className="p0-application-form" onSubmit={handleSubmit}>
      <div className="p0-form-fields">
        {isBackfill ? <>
          <DatePickerField label="补卡日期" value={startDate} onChange={setStartDate} />
          <div className="p0-form-row">
            <OptionPickerField label="补卡时段" value={punchPeriod} onChange={setPunchPeriod} options={["上班打卡", "下班打卡"]} />
            <TimePickerField label="补卡时间" value={startTime} onChange={setStartTime} />
          </div>
        </> : <>
          <div className="p0-form-row">
            <DatePickerField label={isTravel ? "出差开始日期" : isLeave ? "请假开始日期" : kind === "外出申请" ? "外出开始日期" : "加班开始日期"} value={startDate} onChange={updateStartDate} />
            <DatePickerField label={isTravel ? "出差结束日期" : isLeave ? "请假结束日期" : kind === "外出申请" ? "外出结束日期" : "加班结束日期"} value={endDate} onChange={setEndDate} minDate={startDate} />
          </div>
          {isLeave ? <div className="p0-form-row">
            <OptionPickerField label="假期类型" value={leaveType} onChange={setLeaveType} options={["年假", "调休", "病假", "事假"]} />
            <OptionPickerField label="请假时段" value={leavePeriod} onChange={setLeavePeriod} options={["全天", "上午", "下午"]} />
          </div> : <>
            <div className="p0-form-row">
              <TimePickerField label={isTravel ? "出发时间" : kind === "外出申请" ? "外出开始时间" : "加班开始时间"} value={startTime} onChange={setStartTime} />
              <TimePickerField label={isTravel ? "返程时间" : kind === "外出申请" ? "外出结束时间" : "加班结束时间"} value={endTime} onChange={setEndTime} />
            </div>
            {isTravel && <label className="p0-form-field"><span>出差地点</span><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="请输入客户或出差地点" required /></label>}
          </>}
        </>}
        <label className="p0-form-field"><span>申请原因</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="请填写申请原因" required /></label>
      </div>
      <div className="p0-approval-flow"><strong>审批流程</strong><ol>{["项目主管", "部门主管"].map((role, index) => <li className="p0-approval-step" key={role}><i>{index + 1}</i><span>{role}</span><small>审批人待配置</small></li>)}</ol><p className="p0-approval-note">按员工所属项目匹配项目主管，再由部门主管审批。</p></div>
      {error && <span className="p0-form-error" role="alert">{error}</span>}
      <button className="p0-primary p0-submit-punch" type="submit">提交申请 <ArrowRight size={16} /></button>
    </form>
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
