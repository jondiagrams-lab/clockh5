"use client"

import { useMemo, useState } from "react"
import {
  Bell, CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, Clock3,
  FileText, Fingerprint, Home, LocateFixed, MapPin, ShieldCheck, UserRound,
  Wifi, X,
} from "lucide-react"

type Tab = "首页" | "考勤" | "申请" | "我的"
type ApplicationKind = "补卡申请" | "请假申请"
type PunchState = "待打卡" | "已打卡" | "缺卡" | "休息日"
type LocationState = "未定位" | "已定位" | "定位失败"

type Application = {
  id: number
  kind: ApplicationKind
  date: string
  detail: string
  reason: string
  attachment?: string
  status: "审批中" | "已通过" | "已拒绝"
  comment?: string
}

const navItems: { label: Tab; icon: typeof Home }[] = [
  { label: "首页", icon: Home },
  { label: "考勤", icon: CalendarDays },
  { label: "申请", icon: FileText },
  { label: "我的", icon: UserRound },
]

const today = () => new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
const dateInputValue = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function AttendanceH5() {
  const [signedIn, setSignedIn] = useState(false)
  const [loginMode, setLoginMode] = useState<"微信快捷登录" | "人力系统账号登录">("微信快捷登录")
  const [activeTab, setActiveTab] = useState<Tab>("首页")
  const [workPunched, setWorkPunched] = useState(false)
  const [offPunched, setOffPunched] = useState(false)
  const [workPunchTime, setWorkPunchTime] = useState("")
  const [offPunchTime, setOffPunchTime] = useState("")
  const nextPunch = !workPunched ? "上班打卡" : !offPunched ? "下班打卡" : null
  const punchState: PunchState = nextPunch ? "待打卡" : "已打卡"
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationState, setLocationState] = useState<LocationState>("未定位")
  const [locationCoordinates, setLocationCoordinates] = useState<string | null>(null)
  const [demoRange, setDemoRange] = useState<"待校验" | "范围内" | "范围外">("待校验")
  const [formOpen, setFormOpen] = useState<ApplicationKind | null>(null)
  const [notice, setNotice] = useState("")
  const [filter, setFilter] = useState("全部")
  const [applications, setApplications] = useState<Application[]>([])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 3200)
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("定位失败")
      showNotice("当前浏览器不支持定位，请检查微信或浏览器权限")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoordinates(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`)
        setLocationState("已定位")
        setDemoRange("待校验")
      },
      (error) => {
        setLocationState("定位失败")
        const message = error.code === error.PERMISSION_DENIED
          ? "未获得定位权限。请在微信或浏览器设置中允许位置访问后重试。"
          : error.code === error.TIMEOUT
            ? "定位超时，请检查定位服务后重试。"
            : "无法获取当前位置，请确认定位服务已开启。"
        showNotice(message)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  const submitDemoPunch = () => {
    if (locationState !== "已定位" || demoRange !== "范围内" || !nextPunch) return
    if (nextPunch === "上班打卡") {
      setWorkPunched(true)
      setWorkPunchTime(stampTime)
    } else {
      setOffPunched(true)
      setOffPunchTime(stampTime)
    }
    setLocationOpen(false)
    showNotice(`演示${nextPunch}已记录。正式结果必须由服务端确认。`)
  }

  const saveApplication = (kind: ApplicationKind, date: string, detail: string, reason: string, attachment?: string) => {
    if (!reason.trim()) {
      showNotice("请填写申请原因")
      return false
    }
    setApplications((previous) => [
      { id: Date.now(), kind, date, detail, reason: reason.trim(), attachment, status: "审批中" },
      ...previous,
    ])
    setFormOpen(null)
    setActiveTab("申请")
    showNotice("演示申请已创建。正式审批状态需由人力系统返回。")
    return true
  }

  const visibleApplications = useMemo(() => applications.filter((item) => filter === "全部" || item.status === filter), [applications, filter])
  const stampTime = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })

  if (!signedIn) {
    return <main className="h5-shell"><div className="phone-frame">
      <StatusBar />
      <header className="topbar"><Brand /><span className="p0-version">员工端</span></header>
      <LoginScreen mode={loginMode} setMode={setLoginMode} onDemoLogin={() => { setSignedIn(true); showNotice("当前为演示会话；正式登录需接入人力系统") }} />
      <div className="p0-demo-note"><CircleAlert size={14} />原型演示：认证、员工状态与访问权限尚未接入人力系统</div>
      {notice && <Toast text={notice} />}
    </div><DesktopNote /></main>
  }

  return <main className="h5-shell"><div className="phone-frame">
    <StatusBar />
    <header className="topbar"><Brand /><button className="icon-button notification" aria-label="消息通知" onClick={() => showNotice("通知能力待接入现有人力系统")}><Bell size={19} /></button></header>
    {activeTab === "首页" && <HomeScreen punchState={punchState} punchAction={nextPunch} workPunched={workPunched} offPunched={offPunched} workPunchTime={workPunchTime} offPunchTime={offPunchTime} onPunch={() => { setLocationOpen(true); setLocationState("未定位"); setLocationCoordinates(null); setDemoRange("待校验") }} onTab={setActiveTab} onApply={setFormOpen} />}
    {activeTab === "考勤" && <AttendanceScreen punchState={punchState} workPunched={workPunched} offPunched={offPunched} workPunchTime={workPunchTime} offPunchTime={offPunchTime} onApply={() => setFormOpen("补卡申请")} />}
    {activeTab === "申请" && <ApplicationsScreen items={visibleApplications} filter={filter} setFilter={setFilter} onApply={setFormOpen} />}
    {activeTab === "我的" && <ProfileScreen onSignOut={() => { setSignedIn(false); setActiveTab("首页") }} onNotice={showNotice} />}
    <nav className="bottom-nav" aria-label="主导航">{navItems.map(({ label, icon: Icon }) => <button key={label} className={activeTab === label ? "nav-active" : ""} onClick={() => setActiveTab(label)}><Icon size={20} /><span>{label}</span>{label === "申请" && applications.some((item) => item.status === "审批中") && <i className="nav-dot" />}</button>)}</nav>
    {locationOpen && <LocationSheet action={nextPunch ?? "打卡"} state={locationState} coordinates={locationCoordinates} range={demoRange} setRange={setDemoRange} onLocate={requestLocation} onClose={() => setLocationOpen(false)} onSubmit={submitDemoPunch} />}
    {formOpen && <ApplicationSheet kind={formOpen} onClose={() => setFormOpen(null)} onSubmit={saveApplication} />}
    {notice && <Toast text={notice} />}
  </div><DesktopNote /></main>
}

function StatusBar() {
  return <div className="status-bar"><span>9:41</span><div className="status-icons"><span>5G</span><Wifi size={15} /><span className="battery"><i /></span></div></div>
}

function Brand() {
  return <><div className="brand-mark"><Fingerprint size={20} /></div><div className="brand-copy"><strong>考勤助手</strong><span>员工移动端</span></div></>
}

function LoginScreen({ mode, setMode, onDemoLogin }: { mode: "微信快捷登录" | "人力系统账号登录"; setMode: (mode: "微信快捷登录" | "人力系统账号登录") => void; onDemoLogin: () => void }) {
  return <section className="page-content p0-login">
    <div className="p0-login-mark"><Fingerprint size={30} /></div>
    <p className="eyebrow">EMPLOYEE ATTENDANCE</p>
    <h1>你好，欢迎使用考勤助手</h1>
    <p className="p0-login-sub">使用企业员工身份登录，查看本人考勤与申请</p>
    <div className="p0-login-switch" role="tablist" aria-label="登录方式">
      {(["微信快捷登录", "人力系统账号登录"] as const).map((item) => <button key={item} role="tab" aria-selected={mode === item} className={mode === item ? "is-selected" : ""} onClick={() => setMode(item)}>{item}</button>)}
    </div>
    {mode === "微信快捷登录" ? <div className="p0-login-panel"><div className="p0-wechat-mark">微</div><strong>微信已绑定账号快捷进入</strong><span>仅识别已绑定的员工身份，未绑定请使用人力系统账号登录</span><button className="p0-primary" onClick={onDemoLogin}>进入演示会话 <ChevronRight size={17} /></button></div> : <div className="p0-login-panel p0-login-form"><label>员工账号<input autoComplete="username" placeholder="请输入人力系统员工账号" /></label><label>登录凭据<input type="password" autoComplete="current-password" placeholder="按企业现有认证方式填写" /></label><button className="p0-primary" onClick={onDemoLogin}>演示登录 <ChevronRight size={17} /></button><small>未绑定微信也可直接认证；正式认证方式以企业人力系统为准。</small></div>}
    <div className="p0-login-help"><ShieldCheck size={15} />员工状态、企业状态和 H5 访问权限均需由服务端校验</div>
  </section>
}

function HomeScreen({ punchState, punchAction, workPunched, offPunched, workPunchTime, offPunchTime, onPunch, onTab, onApply }: { punchState: PunchState; punchAction: string | null; workPunched: boolean; offPunched: boolean; workPunchTime: string; offPunchTime: string; onPunch: () => void; onTab: (tab: Tab) => void; onApply: (kind: ApplicationKind) => void }) {
  const date = today()
  const canPunch = punchAction !== null
  return <section className="page-content">
    <div className="p0-demo-banner"><CircleAlert size={15} /><span>演示数据 · 规则、班次与状态待人力系统提供</span></div>
    <div className="welcome-row"><div><p className="eyebrow">{date}</p><h1>今日考勤</h1><p className="subtle">仅展示当前员工本人信息</p></div><div className="avatar">林</div></div>
    <section className="p0-identity"><div className="avatar">林</div><div><strong>林晓雨 <span className="active-pill">演示身份</span></strong><span>产品设计部 · 澄海科技有限公司</span><span>员工项目与组织关系需由人力系统维护</span></div><ChevronRight size={17} /></section>
    <section className="p0-card p0-shift"><div className="p0-card-head"><div><p className="eyebrow">TODAY'S SHIFT</p><h2>本人班次与打卡状态</h2></div><span className="p0-status">演示班次</span></div>      <div className="p0-shift-times"><div><span>上班应打</span><strong>09:00</strong><small>{workPunched ? `已打卡 · ${workPunchTime}` : "待打卡 · 演示时段"}</small></div><i /><div><span>下班应打</span><strong>18:00</strong><small>{offPunched ? `已打卡 · ${offPunchTime}` : "尚未打卡 · 演示时段"}</small></div></div><div className="p0-rule-note"><CircleAlert size={15} />实际班次、打卡窗口和异常判定由服务端规则决定</div></section>
    <section className="p0-card p0-site-card"><div className="p0-site-icon"><MapPin size={18} /></div><div><span>本次打卡项目 / 固定驻地</span><strong>演示项目 · 演示驻地</strong><small>正式项目关系、地点坐标及有效期尚未接入</small></div><span className="p0-location-state">待校验</span></section>
    <button className="p0-punch" disabled={!canPunch} onClick={onPunch}><Fingerprint size={22} /><span>{punchAction ?? "今日打卡已完成"}<small>{canPunch ? "下一步：请求定位并校验考勤范围" : "打卡阶段由服务端返回，不能重复提交"}</small></span><ChevronRight size={19} /></button>
    <div className="p0-actions-title"><h2>个人考勤</h2><span>仅限本人</span></div>
    <div className="p0-service-grid"><button onClick={() => onTab("考勤")}><CalendarDays size={19} /><strong>考勤明细</strong><small>按日期查看应打与实打</small></button><button onClick={() => onApply("补卡申请")}><Clock3 size={19} /><strong>补卡申请</strong><small>先校验缺卡资格</small></button><button onClick={() => onApply("请假申请")}><FileText size={19} /><strong>请假申请</strong><small>动态规则待系统接入</small></button><button onClick={() => onTab("申请")}><ShieldCheck size={19} /><strong>申请进度</strong><small>查看本人审批轨迹</small></button></div>
  </section>
}

function AttendanceScreen({ punchState, workPunched, offPunched, workPunchTime, offPunchTime, onApply }: { punchState: PunchState; workPunched: boolean; offPunched: boolean; workPunchTime: string; offPunchTime: string; onApply: () => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1) })
  const [selected, setSelected] = useState(dateInputValue())
  const [detail, setDetail] = useState(false)
  const nowISO = dateInputValue()
  const calendarDays = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      return { iso, day: date.getDate(), inMonth: date.getMonth() === visibleMonth.getMonth() }
    })
  }, [visibleMonth])
  const monthLabel = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(visibleMonth)
  const shiftMonth = (delta: number) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  const isToday = selected === nowISO
  return <section className="page-content subpage">
    <p className="eyebrow">PERSONAL ATTENDANCE · DEMO</p><h1>考勤明细</h1>
    <div className="p0-demo-banner"><CircleAlert size={15} /><span>演示月历；日期、班次、应打次数、原始记录和结果须由服务端查询</span></div>
    <section className="p0-card p0-calendar-card" aria-label="按月份和日期筛选考勤">
      <div className="p0-month-nav"><button type="button" aria-label="上个月" onClick={() => shiftMonth(-1)}><ChevronLeft size={18} /></button><strong>{monthLabel}</strong><button type="button" aria-label="下个月" onClick={() => shiftMonth(1)}><ChevronRight size={18} /></button></div>
      <div className="p0-calendar-grid p0-calendar-weekdays" aria-hidden="true">{"日一二三四五六".split("").map((day) => <span key={day}>{day}</span>)}</div>
      <div className="p0-calendar-grid" role="group" aria-label={`${monthLabel}日期`}>
        {calendarDays.map((day) => <button type="button" key={day.iso} aria-label={`${day.iso}${day.iso === nowISO ? "，今天" : ""}`} aria-pressed={selected === day.iso} className={`${day.inMonth ? "" : "is-outside"} ${selected === day.iso ? "is-selected" : ""} ${day.iso === nowISO ? "is-today" : ""}`} onClick={() => { setSelected(day.iso); setDetail(false) }}><span>{day.day}</span>{day.iso === nowISO && <i aria-hidden="true" />}</button>)}
      </div>
      <p className="p0-calendar-key"><i />今天 <span>日历状态标记待考勤接口返回</span></p>
    </section>
    <section className="p0-card p0-detail-card"><div className="p0-card-head"><div><p className="eyebrow">{selected} · 本人考勤</p><h2>应打卡与实际记录</h2></div><span className="p0-status">{isToday ? "当日" : "历史日期"}</span></div>
      <div className="p0-record-row"><span className="p0-record-icon"><Clock3 size={16} /></span><div><strong>上班打卡</strong><small>应打时段及规则由服务端返回</small></div><b>{isToday && workPunched ? workPunchTime : "--:--"}</b></div>
      <div className="p0-record-row"><span className="p0-record-icon p0-record-muted"><Clock3 size={16} /></span><div><strong>下班打卡</strong><small>异常与缺卡状态由服务端判定</small></div><b>{isToday && offPunched ? offPunchTime : "--:--"}</b></div>
      <div className="p0-result-row"><span>服务端考勤结果</span><strong>{isToday && punchState === "已打卡" ? "演示打卡" : "待服务端判定"}</strong></div>
      {detail && <div className="p0-inline-note"><CircleAlert size={15} />本页暂未连接真实数据：正式明细需要展示原始打卡、应打班次、异常原因、规则快照及关联申请。</div>}
      <button className="p0-inline-link" onClick={() => setDetail((value) => !value)}>{detail ? "收起记录说明" : "查看规则与记录说明"}<ChevronRight size={16} /></button>
    </section>
    <section className="p0-card p0-help-card"><strong>需要补卡？</strong><span>可申请日期、缺卡时段、补卡期限与次数应先由服务端校验。</span><button className="p0-secondary" onClick={onApply}>查看补卡资格 <ChevronRight size={16} /></button></section>
  </section>
}

function ApplicationsScreen({ items, filter, setFilter, onApply }: { items: Application[]; filter: string; setFilter: (value: string) => void; onApply: (kind: ApplicationKind) => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  return <section className="page-content subpage"><p className="eyebrow">PERSONAL REQUESTS · DEMO</p><h1>我的申请</h1>
    <div className="p0-demo-banner"><CircleAlert size={15} /><span>仅为演示申请；流程类型与状态需接入现有人力审批</span></div>
    <div className="p0-filter-row" role="group" aria-label="按审批状态筛选">{["全部", "审批中", "已通过", "已拒绝"].map((value) => <button key={value} className={filter === value ? "is-selected" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div>
    {items.length ? <div className="p0-application-list">{items.map((item) => <article className="p0-card p0-application-card" key={item.id}>
      <div className="p0-application-head"><span className="p0-application-icon">{item.kind === "补卡申请" ? <Clock3 size={18} /> : <FileText size={18} />}</span><div><strong>{item.kind}</strong><small>{item.date} · {item.detail}</small></div><span className={`p0-status ${item.status === "已通过" ? "p0-status-success" : item.status === "已拒绝" ? "p0-status-error" : ""}`}>{item.status}</span></div>
      <div className="p0-application-body"><p><span>申请原因</span><strong>{item.reason}</strong></p>{item.comment && <p><span>处理意见</span><strong>{item.comment}</strong></p>}<p><span>演示进度</span><strong>{item.status === "审批中" ? "待审批 · 真实进度由服务端返回" : item.status}</strong></p></div>
      {item.attachment && <div className="p0-application-body"><p><span>演示附件</span><strong>{item.attachment}</strong></p></div>}
      <button type="button" className="p0-approval-track" aria-expanded={expandedId === item.id} onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}><span className="p0-track-dot" /><span>{expandedId === item.id ? "收起申请详情" : "查看申请详情与审批轨迹"}</span><ChevronRight size={15} /></button>
      {expandedId === item.id && <section className="p0-application-detail"><strong>审批轨迹</strong><p>当前：{item.status}（演示状态）</p><p>审批人、节点、处理意见和更新时间由现有人力审批流程返回。</p>{item.comment && <p>处理意见：{item.comment}</p>}</section>}
    </article>)}</div> : <div className="p0-empty"><FileText size={24} /><strong>暂无此状态的申请</strong><span>申请状态以审批服务返回为准</span></div>}
    <div className="p0-application-actions"><button className="p0-primary" onClick={() => onApply("补卡申请")}>补卡申请</button><button className="p0-secondary" onClick={() => onApply("请假申请")}>请假申请</button></div>
  </section>
}

function ProfileScreen({ onSignOut, onNotice }: { onSignOut: () => void; onNotice: (text: string) => void }) {
  return <section className="page-content subpage"><p className="eyebrow">MY PROFILE · DEMO</p><h1>个人中心</h1><div className="p0-demo-banner"><CircleAlert size={15} /><span>以下个人与组织信息仅为演示数据</span></div>
    <section className="p0-profile-card"><div className="avatar">林</div><div><strong>林晓雨</strong><span>产品设计部 · 产品设计师</span></div><span className="active-pill">演示身份</span></section>
    <div className="p0-profile-list"><div><span>所属企业</span><strong>澄海科技有限公司</strong></div><div><span>员工状态</span><strong>须由人力系统校验</strong></div><div><span>H5访问权限</span><strong>须由服务端校验</strong></div><button onClick={() => onNotice("个人资料与组织信息由人力系统维护")}>个人与组织信息<ChevronRight size={17} /></button><button onClick={() => onNotice("账号安全及会话有效性需接入现有人力认证")}>账号与安全<ChevronRight size={17} /></button></div>
    <button className="p0-signout" onClick={onSignOut}>退出演示会话</button>
  </section>
}

function LocationSheet({ action, state, coordinates, range, setRange, onLocate, onClose, onSubmit }: { action: string; state: LocationState; coordinates: string | null; range: "待校验" | "范围内" | "范围外"; setRange: (value: "待校验" | "范围内" | "范围外") => void; onLocate: () => void; onClose: () => void; onSubmit: () => void }) {
  const [demoOutcome, setDemoOutcome] = useState<"正常" | "超范围">("正常")
  const rangeReady = state === "已定位" && range === "范围内"
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-location-title" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button>
    <div className="sheet-icon"><LocateFixed size={22} /></div><p className="eyebrow">LOCATION & PUNCH CHECK</p><h2 id="p0-location-title">定位并校验考勤范围</h2>
    <p className="p0-sheet-description">先获取当前位置，再由服务端根据当前有效驻地和打卡规则判定。未定位、超范围或规则缺失时不能提交。</p>
    <div className="p0-location-status"><MapPin size={18} /><div><strong>{state === "已定位" ? "设备定位已返回" : state === "定位失败" ? "定位未成功" : "尚未获取当前位置"}</strong><span>{coordinates ? `设备坐标 ${coordinates} · 考勤点范围待后端校验` : "设备坐标未获取 · 考勤点坐标及范围待配置"}</span></div><b>{range === "范围内" ? "演示范围内" : range === "范围外" ? "演示范围外" : "待校验"}</b></div>
    <button className="p0-secondary p0-locate-button" onClick={onLocate}>{state === "定位失败" ? "重新请求定位" : "请求设备定位"}<LocateFixed size={16} /></button>
    {state === "已定位" && <div className="p0-demo-range"><span>界面演示：模拟服务端校验结果</span><div><button className={demoOutcome === "正常" ? "is-selected" : ""} onClick={() => setDemoOutcome("正常")}>范围内</button><button className={demoOutcome === "超范围" ? "is-selected" : ""} onClick={() => setDemoOutcome("超范围")}>范围外</button></div><button className="p0-text-action" onClick={() => setRange(demoOutcome === "正常" ? "范围内" : "范围外")}>模拟校验结果 <ChevronRight size={15} /></button></div>}
    {state === "定位失败" && <div className="p0-error-note"><CircleAlert size={15} />请检查定位服务与微信 / 浏览器的位置授权，然后重新请求。</div>}
    <button className="p0-primary p0-submit-punch" disabled={!rangeReady} onClick={onSubmit}>确认{action} <ChevronRight size={17} /></button>
    <p className="p0-disclaimer">演示流程不会写入正式考勤。正式打卡须由服务端校验会话、班次、窗口、坐标范围和幂等键。</p>
  </section></div>
}

function ApplicationSheet({ kind, onClose, onSubmit }: { kind: ApplicationKind; onClose: () => void; onSubmit: (kind: ApplicationKind, date: string, detail: string, reason: string, attachment?: string) => boolean }) {
  const [date, setDate] = useState(dateInputValue())
  const [endDate, setEndDate] = useState(dateInputValue())
  const [slot, setSlot] = useState("下班卡")
  const [leaveType, setLeaveType] = useState("年假")
  const [reason, setReason] = useState("")
  const [attachment, setAttachment] = useState("")
  const [error, setError] = useState("")
  const [reviewing, setReviewing] = useState(false)
  const isMakeup = kind === "补卡申请"
  const submit = () => {
    if (!reason.trim()) { setError("请填写申请原因"); return }
    if (!isMakeup && endDate < date) { setError("结束日期不能早于开始日期"); return }
    if (!reviewing) { setReviewing(true); return }
    const detail = isMakeup ? `${slot} · 资格待校验` : `${leaveType} · ${date} 至 ${endDate} · 时长及余额待系统计算`
    onSubmit(kind, date, detail, reason, attachment || undefined)
  }
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="bottom-sheet p0-sheet p0-form-sheet" role="dialog" aria-modal="true" aria-labelledby="p0-form-title" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button><p className="eyebrow">APPLICATION · DEMO</p><h2 id="p0-form-title">{kind}</h2>
    <div className="p0-demo-banner"><CircleAlert size={15} /><span>{isMakeup ? "可补日期、缺卡时段、期限、次数和材料要求须由服务端返回" : "假期类型、动态表单、余额、时长及审批流须复用现有人力系统"}</span></div>
    <label className="p0-field">{isMakeup ? "申请日期" : "开始日期"}<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setEndDate((current) => current < event.target.value ? event.target.value : current); setReviewing(false) }} /></label>
    {isMakeup ? <label className="p0-field">缺卡时段<select value={slot} onChange={(event) => setSlot(event.target.value)}><option>上班卡</option><option>下班卡</option></select></label> : <><label className="p0-field">假期类型<select value={leaveType} onChange={(event) => setLeaveType(event.target.value)}><option value="年假">年假 · 演示选项</option><option value="事假">事假 · 演示选项</option><option value="病假">病假 · 演示选项</option></select></label><label className="p0-field">结束日期<input type="date" value={endDate} min={date} onChange={(event) => setEndDate(event.target.value)} /></label><div className="p0-inline-note"><CircleAlert size={15} />余额、时长、必填字段与冲突规则由现有人力系统动态返回并校验。</div></>}
    <label className="p0-field">申请原因<textarea value={reason} onChange={(event) => { setReason(event.target.value); setError("") }} placeholder="请说明申请原因" /></label>
    {isMakeup && <div className="p0-upload"><label htmlFor="p0-attachment">补充材料 <span>按后台规则决定是否必填</span><input id="p0-attachment" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setAttachment(event.currentTarget.files?.[0]?.name ?? "")} /></label>{attachment && <div className="p0-file-chip"><FileText size={14} /><span>{attachment}</span><button type="button" aria-label="移除附件" onClick={() => setAttachment("")}><X size={14} /></button></div>}<small>文件暂留在本地演示界面；正式上传与权限由企业文件服务接入。</small></div>}
    {error && <p className="p0-field-error" role="alert">{error}</p>}
    <div className="p0-review-note"><ShieldCheck size={15} />提交前确认摘要；正式资格、余额、冲突及流程由服务端校验，失败须保留填写内容。</div>
    {reviewing && <section className="p0-summary" aria-label="申请摘要"><strong>请核对申请信息</strong><p><span>类型与日期</span><b>{kind} · {isMakeup ? date : `${date} 至 ${endDate}`}</b></p><p><span>申请详情</span><b>{isMakeup ? slot : `${leaveType} · 规则待系统计算`}</b></p><p><span>申请原因</span><b>{reason}</b></p>{attachment && <p><span>附件</span><b>{attachment}</b></p>}<small>当前只创建演示记录，不会提交到正式审批。</small><button type="button" className="p0-text-action" onClick={() => setReviewing(false)}>返回修改</button></section>}
    <button className="p0-primary p0-submit-punch" onClick={submit}>{reviewing ? "确认演示提交" : "预览申请摘要"} <ChevronRight size={17} /></button>
  </section></div>
}

function Toast({ text }: { text: string }) {
  return <div className="toast-message" role="status"><Check size={15} />{text}</div>
}

function DesktopNote() {
  return <aside className="desktop-note"><div className="note-logo"><Fingerprint size={22} /></div><span>EMPLOYEE H5 · P0</span><h2>员工考勤</h2><p>按功能清单展示个人考勤闭环。</p><div className="note-list"><span><i />微信快捷 / 人力系统登录</span><span><i />班次、项目与定位打卡</span><span><i />个人明细、补卡与请假</span><span><i />申请状态与审批轨迹</span></div><small>演示界面，真实认证与考勤数据需接入人力系统</small></aside>
}
