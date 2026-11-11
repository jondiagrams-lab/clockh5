"use client"

import { useState } from "react"
import { Bell, CalendarDays, ChevronRight, Clock3, FileText, Fingerprint, Home, MapPin, MoreHorizontal, Navigation, Plus, ShieldCheck, UserRound, Wifi, X } from "lucide-react"

type Tab = "首页" | "考勤" | "申请" | "我的"

const navItems: { label: Tab; icon: typeof Home }[] = [
  { label: "首页", icon: Home },
  { label: "考勤", icon: CalendarDays },
  { label: "申请", icon: FileText },
  { label: "我的", icon: UserRound },
]

export function AttendanceH5() {
  const [activeTab, setActiveTab] = useState<Tab>("首页")
  const [checkedIn, setCheckedIn] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [formOpen, setFormOpen] = useState<"补卡申请" | "请假申请" | null>(null)

  const toast = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2600)
  }

  const submitPunch = () => {
    setCheckedIn(true)
    setLocationOpen(false)
    toast("上班打卡成功，记录已提交")
  }

  return (
    <main className="h5-shell">
      <div className="phone-frame">
        <div className="status-bar"><span>9:41</span><div className="status-icons"><span>5G</span><Wifi size={15} /><span className="battery"><i /></span></div></div>
        <header className="topbar">
          <div className="brand-mark"><Fingerprint size={20} strokeWidth={2.2} /></div>
          <div className="brand-copy"><strong>考勤助手</strong><span>WORK · EASY</span></div>
          <button className="icon-button notification" aria-label="消息通知" onClick={() => toast("暂无新消息") }><Bell size={19} /><i /></button>
        </header>

        {activeTab === "首页" && <section className="page-content">
          <div className="welcome-row"><div><p className="eyebrow">星期三 · 2025年 6月 18日</p><h1>早上好，林晓雨 <span>☀</span></h1><p className="subtle">新的一天，愿你工作顺利</p></div><div className="avatar">林</div></div>
          <section className="identity-card">
            <div className="identity-top"><div className="company-symbol">澄</div><div className="identity-text"><strong>林晓雨 <span className="active-pill">在职</span></strong><span>产品设计部 · 产品设计师</span></div><MoreHorizontal size={20} className="more" /></div>
            <div className="identity-divider" />
            <div className="project-line"><MapPin size={15} /><span>当前项目</span><strong>滨江智慧园一期</strong><ChevronRight size={15} /></div>
            <div className="location-line"><span className="location-dot" />固定驻地 · 滨江项目部</div>
          </section>

          <div className="section-heading"><div><h2>今日考勤</h2><span>标准班次 · 09:00 — 18:00</span></div><button className="text-link" onClick={() => setActiveTab("考勤")}>考勤明细 <ChevronRight size={14} /></button></div>
          <section className="attendance-card">
            <div className="time-track">
              <div className="time-point done"><span className="point-icon"><Clock3 size={16} /></span><div><span>上班打卡</span><strong>{checkedIn ? "09:02" : "待打卡"}</strong><small>{checkedIn ? "已记录 · 正常" : "应打卡 09:00"}</small></div></div>
              <div className="track-line"><i /></div>
              <div className="time-point"><span className="point-icon"><Clock3 size={16} /></span><div><span>下班打卡</span><strong>18:00</strong><small>应打卡时间</small></div></div>
            </div>
            <div className="punch-divider" />
            <div className="punch-location"><span className="location-check"><MapPin size={15} /></span><div><strong>考勤范围内</strong><span>滨江项目部 · 定位正常</span></div><span className="range-tag">距考勤点 32m</span></div>
            <button className={`punch-button ${checkedIn ? "punched" : ""}`} onClick={() => checkedIn ? toast("上班打卡已完成") : setLocationOpen(true)}>
              <span className="punch-button-icon"><Fingerprint size={24} /></span><span>{checkedIn ? "上班已打卡" : "上班打卡"}<small>{checkedIn ? "打卡时间 09:02" : "定位成功后即可打卡"}</small></span><ChevronRight size={19} />
            </button>
            <div className="secure-note"><ShieldCheck size={13} />考勤时间以服务器记录为准</div>
          </section>

          <div className="section-heading tools-heading"><div><h2>常用服务</h2><span>个人考勤一站办理</span></div><span className="count-label">2 项待处理</span></div>
          <div className="service-grid">
            <button className="service-item" onClick={() => setActiveTab("考勤")}><span className="service-icon mint"><CalendarDays size={20} /></span><span><strong>考勤记录</strong><small>查看每日打卡明细</small></span><ChevronRight size={16} /></button>
            <button className="service-item" onClick={() => setFormOpen("补卡申请")}><span className="service-icon peach"><Clock3 size={20} /></span><span><strong>补卡申请</strong><small>补充遗漏的打卡记录</small></span><ChevronRight size={16} /></button>
            <button className="service-item" onClick={() => setFormOpen("请假申请")}><span className="service-icon lavender"><FileText size={20} /></span><span><strong>请假申请</strong><small>提交假期审批申请</small></span><ChevronRight size={16} /></button>
            <button className="service-item" onClick={() => setActiveTab("申请")}><span className="service-icon blue"><Bell size={20} /></span><span><strong>我的申请</strong><small>跟进审批进度</small></span><span className="service-badge">2</span><ChevronRight size={16} /></button>
          </div>
          <section className="pending-card"><div className="pending-icon"><FileText size={17} /></div><div className="pending-copy"><strong>有 2 条申请正在审批</strong><span>补卡申请 · 6月16日　　请假申请 · 6月20日</span></div><button aria-label="查看申请" onClick={() => setActiveTab("申请")}><ChevronRight size={17} /></button></section>
          <p className="footer-note">让每一次努力，都有迹可循</p>
        </section>}

        {activeTab === "考勤" && <section className="page-content subpage"><p className="eyebrow">PERSONAL ATTENDANCE</p><h1>考勤记录</h1><div className="month-switch"><button onClick={() => toast("已是演示月份")}>‹</button><strong>2025年 6月</strong><button onClick={() => toast("暂无更多月份")}>›</button></div><div className="calendar-card"><div className="weekdays">{["一","二","三","四","五","六","日"].map(x => <span key={x}>{x}</span>)}</div><div className="days-grid">{Array.from({length:35},(_,i)=>{const day=i-6;return <button key={i} className={`${day===18?"today":""} ${[2,3,4,5,6,9,10,11,12,13,16,17].includes(day)?"has-record":""} ${day<1||day>30?"outside":""}`} onClick={()=>day>0&&day<=30&&toast(`${day}日 · ${day===18?(checkedIn?"上班已打卡，下班待打卡":"上班待打卡，下班待打卡"):"考勤正常"}`)}>{day<1?31+day:day>30?day-30:day}<i /></button>})}</div><div className="calendar-legend"><span><i className="legend-green"/>正常</span><span><i className="legend-orange"/>异常</span><span><i className="legend-gray"/>休息</span></div></div><div className="section-heading"><div><h2>6月18日 · 星期三</h2><span>滨江智慧园一期 · 标准班次</span></div></div><div className="record-card"><div className="record-row"><span className="record-mark green-mark"><Clock3 size={15}/></span><div><strong>上班打卡</strong><span>{checkedIn?"滨江项目部 · 定位正常":"待打卡 · 应打卡 09:00"}</span></div><b>{checkedIn?"09:02":"--:--"}</b></div><div className="record-row"><span className="record-mark gray-mark"><Clock3 size={15}/></span><div><strong>下班打卡</strong><span>应打卡时间 18:00</span></div><b>--:--</b></div><div className="record-total"><span>今日考勤结果</span><strong>{checkedIn?"正常打卡":"进行中"}</strong></div></div><button className="outline-action" onClick={()=>setFormOpen("补卡申请")}><Plus size={17}/>申请补卡</button></section>}

        {activeTab === "申请" && <section className="page-content subpage"><p className="eyebrow">APPLICATION CENTER</p><h1>我的申请</h1><div className="filter-pills"><button className="selected">全部 <span>2</span></button><button onClick={()=>toast("当前没有待处理申请")}>审批中</button><button onClick={()=>toast("当前没有已完成申请")}>已完成</button></div><div className="application-card"><div className="application-head"><span className="application-type peach">补</span><div><strong>补卡申请</strong><span>申请时间 06月16日 10:26</span></div><em className="status-pending">审批中</em></div><div className="application-detail"><p>补卡日期 <b>2025年06月15日 · 下班卡</b></p><p>申请原因 <b>项目现场网络异常，未能及时打卡</b></p></div><div className="approval-line"><span className="avatar-mini">陈</span><span>直属主管 陈经理审批中</span><ChevronRight size={16}/></div></div><div className="application-card"><div className="application-head"><span className="application-type lavender"><FileText size={17}/></span><div><strong>请假申请</strong><span>申请时间 06月15日 16:42</span></div><em className="status-approved">已通过</em></div><div className="application-detail"><p>请假类型 <b>年假 · 1天</b></p><p>请假时间 <b>06月20日 09:00 — 18:00</b></p></div><div className="approval-line"><span className="approval-check">✓</span><span>审批流程已完成</span><ChevronRight size={16}/></div></div><button className="primary-wide" onClick={()=>setFormOpen("请假申请")}><Plus size={17}/>新建请假申请</button><button className="outline-action" onClick={()=>setFormOpen("补卡申请")}><Plus size={17}/>新建补卡申请</button></section>}

        {activeTab === "我的" && <section className="page-content subpage"><p className="eyebrow">MY PROFILE</p><h1>个人中心</h1><section className="profile-card"><div className="profile-avatar">林</div><div><h2>林晓雨</h2><p>产品设计部 · 产品设计师</p></div><span className="active-pill">在职</span></section><div className="profile-company"><span>所属企业</span><strong>澄海科技有限公司</strong></div><div className="profile-menu"><button onClick={()=>toast("个人信息来自现有人力系统")}><UserRound size={18}/>个人信息<ChevronRight size={17}/></button><button onClick={()=>setActiveTab("考勤")}><CalendarDays size={18}/>我的考勤<ChevronRight size={17}/></button><button onClick={()=>setActiveTab("申请")}><FileText size={18}/>我的申请<ChevronRight size={17}/></button><button onClick={()=>toast("当前账号已安全登录")}><ShieldCheck size={18}/>账号与安全<ChevronRight size={17}/></button></div><div className="profile-foot">身份与组织信息由企业人力系统统一管理<br/>考勤助手 · 版本 1.0.0</div></section>}

        <nav className="bottom-nav" aria-label="主导航">{navItems.map(({label,icon:Icon})=><button key={label} className={activeTab===label?"nav-active":""} onClick={()=>setActiveTab(label)}><Icon size={20} strokeWidth={activeTab===label?2.3:1.8}/><span>{label}</span>{label==="申请"&&<i className="nav-dot"/>}</button>)}</nav>

        {locationOpen && <div className="modal-backdrop" role="presentation" onClick={()=>setLocationOpen(false)}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="punch-title" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="sheet-close" onClick={()=>setLocationOpen(false)} aria-label="关闭"><X size={20}/></button><div className="sheet-icon"><Navigation size={22}/></div><p className="eyebrow">LOCATION CHECK</p><h2 id="punch-title">确认打卡位置</h2><p className="sheet-desc">请确认当前定位与考勤地点一致，打卡时间将以服务器记录为准。</p><div className="location-confirm"><MapPin size={18}/><div><strong>滨江项目部</strong><span>杭州市滨江区江南大道 588 号</span></div><span className="in-range">范围内</span></div><div className="gps-row"><span className="gps-pulse"/>定位成功 · 精度 12 米 <span>距考勤点 32m</span></div><button className="sheet-submit" onClick={submitPunch}>确认上班打卡</button><p className="sheet-footnote">提交后将生成不可重复的考勤记录</p></section></div>}

        {formOpen && <div className="modal-backdrop" role="presentation" onClick={()=>setFormOpen(null)}><section className="bottom-sheet form-sheet" role="dialog" aria-modal="true" aria-labelledby="form-title" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="sheet-close" onClick={()=>setFormOpen(null)} aria-label="关闭"><X size={20}/></button><p className="eyebrow">PERSONAL APPLICATION</p><h2 id="form-title">{formOpen}</h2>{formOpen==="补卡申请"?<><label>补卡日期<input type="date" defaultValue="2025-06-15"/></label><label>补卡时段<select defaultValue="下班卡"><option>上班卡</option><option>下班卡</option></select></label><label>申请原因<textarea defaultValue="项目现场网络异常，未能及时打卡"/></label></>:<><label>假期类型<select defaultValue="年假"><option>年假</option><option>事假</option><option>病假</option></select></label><label>开始时间<input type="datetime-local" defaultValue="2025-06-20T09:00"/></label><label>结束时间<input type="datetime-local" defaultValue="2025-06-20T18:00"/></label><label>请假事由<textarea placeholder="请填写申请原因"/></label><div className="form-hint">请假规则、余额与审批流程以人力系统配置为准</div></>}<button className="sheet-submit" onClick={()=>{setFormOpen(null);setActiveTab("申请");toast("申请已提交，审批状态可在我的申请查看")}}>提交申请</button></section></div>}
        {notice&&<div className="toast-message" role="status"><span>✓</span>{notice}</div>}
      </div>
      <aside className="desktop-note"><div className="note-logo"><Fingerprint size={22}/></div><span>STAFF H5 · P0 PROTOTYPE</span><h2>考勤助手</h2><p>把日常考勤，变得简单一点。</p><div className="note-list"><span><i/>今日打卡与定位校验</span><span><i/>个人考勤明细</span><span><i/>补卡 / 请假申请</span><span><i/>审批进度跟踪</span></div><small>基于功能清单 P0 需求 · UI 演示稿</small></aside>
    </main>
  )
}
