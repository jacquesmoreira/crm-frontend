import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { io as socketIO } from "socket.io-client";

const C = {
  green:"#00c896",greenBg:"#e6faf5",greenTx:"#007a5c",
  blue:"#3b82f6", blueBg:"#eff6ff", blueTx:"#1d4ed8",
  amber:"#f59e0b",amberBg:"#fffbeb",amberTx:"#b45309",
  red:"#ef4444",  redBg:"#fef2f2",  redTx:"#b91c1c",
  purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleTx:"#6d28d9",
  slate:"#64748b", light:"#f8fafc", border:"#e2e8f0",
  dark:"#0d1117",  text:"#1e293b",  muted:"#94a3b8",
};
const fmt  = n => "R$ "+n.toLocaleString("pt-BR");
const card = {background:"white",borderRadius:14,border:"1px solid #e8edf3",padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"};
const SC   = {
  "Novo Lead":   {c:C.purple,bg:C.purpleBg,tx:C.purpleTx},
  "Qualificado": {c:C.blue,  bg:C.blueBg,  tx:C.blueTx},
  "Proposta":    {c:C.amber, bg:C.amberBg, tx:C.amberTx},
  "Negociação":  {c:"#f97316",bg:"#fff7ed",tx:"#c2410c"},
  "Fechado":     {c:C.green, bg:C.greenBg, tx:C.greenTx},
};
const STAGES = Object.keys(SC);
const badge  = (label,color,bg,tx,small) => (
  <span style={{background:bg,color:tx,borderRadius:20,padding:small?"1px 7px":"3px 10px",
    fontSize:small?10:11,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>
);

const INIT_LEADS = [
  {id:1,name:"Fernanda Lima",   company:"Grupo Omega",    email:"flima@omega.com",   phone:"(11) 98765-4321",stage:"Negociação",value:28000,score:92,tags:["VIP"],     assignee:"Ana Silva",  source:"Meta Ads",  wa:"connected",notes:"Quer desconto de 15%. Decision maker confirmado."},
  {id:2,name:"Carlos Mendes",   company:"TechBR Soluções",email:"carlos@techbr.com", phone:"(47) 99123-4567",stage:"Proposta",   value:12500,score:85,tags:["Quente"], assignee:"Pedro Costa",source:"Meta Ads",  wa:"pending", notes:"Esperando aprovação do sócio. Último contato há 4 dias."},
  {id:3,name:"Amanda Vieira",   company:"Vieira & Filhos",email:"amanda@vf.com",      phone:"(51) 99876-1234",stage:"Negociação",value:19500,score:88,tags:["B2B"],     assignee:"Lara Mendes",source:"Indicação", wa:"connected",notes:"Quer módulo de relatórios avançados. Call quinta-feira."},
  {id:4,name:"Beatriz Gomes",   company:"BG Consultoria", email:"bea@bgconsult.com",  phone:"(19) 99234-5678",stage:"Proposta",   value:15000,score:78,tags:["Quente"], assignee:"Lara Mendes",source:"Google Ads",wa:"none",    notes:"Proposta enviada há 5 dias sem resposta."},
  {id:5,name:"Roberto Alves",   company:"Construtora SA", email:"roberto@const.com",  phone:"(48) 99456-7890",stage:"Qualificado",value:8500, score:67,tags:["B2B"],    assignee:"Ana Silva",  source:"Site",      wa:"pending", notes:"Pediu informações sobre integração com ERP Totvs."},
  {id:6,name:"João Paulo Silva",company:"JP Importações", email:"jp@jpimport.com",    phone:"(11) 94321-8765",stage:"Fechado",    value:45000,score:95,tags:["VIP"],     assignee:"Ana Silva",  source:"LinkedIn",  wa:"connected",notes:"Contrato assinado. Onboarding em andamento."},
  {id:7,name:"Lucas Ferreira",  company:"StartupX",       email:"lucas@startupx.io",  phone:"(21) 98123-9876",stage:"Novo Lead",  value:5500, score:55,tags:["Tech"],   assignee:"Pedro Costa",source:"Evento",    wa:"none",    notes:"Conhecido no evento de tecnologia de março."},
  {id:8,name:"Mariana Torres",  company:"Studio MT",      email:"mari@studimt.com",   phone:"(47) 97654-3210",stage:"Novo Lead",  value:3200, score:42,tags:["Frio"],   assignee:"Pedro Costa",source:"Meta Ads",  wa:"none",    notes:"Baixou e-book há 1 semana."},
  {id:9,name:"Diego Cavalcanti",company:"Cavalcanti & Cia",email:"diego@cav.com",     phone:"(81) 99345-6789",stage:"Qualificado",value:22000,score:74,tags:["Grande"], assignee:"Lara Mendes",source:"Indicação", wa:"connected",notes:"3 decisores envolvidos. Processo complexo."},
];

const ADS_CAMPAIGNS = [
  {id:1,name:"Volta às Aulas 2026 — Beway",status:"Ativo",  budget:310,spent:287,leads:18,cpl:15.9,roas:2.84,synced:16,conv:3},
  {id:2,name:"Partners B2B — VipVidros",   status:"Ativo",  budget:150,spent:98, leads:4, cpl:24.5,roas:0,   synced:4, conv:0},
  {id:3,name:"Imóveis Balneário Camboriú", status:"Ativo",  budget:400,spent:312,leads:9, cpl:34.7,roas:0,   synced:9, conv:1},
  {id:4,name:"Dr. Augusto — Joelho",       status:"Pausada",budget:100,spent:0,  leads:0, cpl:0,   roas:0,   synced:0, conv:0},
  {id:5,name:"Luana — Curso Bolo",         status:"Ativo",  budget:50, spent:43, leads:6, cpl:7.2, roas:0.9, synced:5, conv:0},
];
const ADS_DAILY = [
  {d:"11/03",leads:8,spend:142},{d:"12/03",leads:12,spend:198},{d:"13/03",leads:7,spend:160},
  {d:"14/03",leads:15,spend:220},{d:"15/03",leads:9,spend:175},{d:"16/03",leads:11,spend:195},
  {d:"17/03",leads:14,spend:210},
];
const INIT_AUTOS = [
  {id:1,name:"Follow-up automático — 3 dias sem resposta",active:true,trigger:{type:"sem_atividade",days:3,stage:"Proposta"},actions:[{type:"criar_tarefa",label:"Criar tarefa de follow-up urgente"},{type:"notificar",label:"Notificar responsável pelo Slack"}]},
  {id:2,name:"Boas-vindas WhatsApp — Novo Lead Meta Ads",active:true,trigger:{type:"novo_lead",source:"Meta Ads"},actions:[{type:"whatsapp",label:"Enviar mensagem de boas-vindas via WhatsApp"},{type:"score",label:"Aplicar score inicial: 50 pontos"}]},
  {id:3,name:"Alerta VIP — Lead score acima de 85",active:false,trigger:{type:"score_threshold",value:85},actions:[{type:"notificar",label:"Notificar gerente imediatamente"},{type:"tag",label:"Adicionar tag VIP"},{type:"assignee",label:"Reatribuir para vendedor sênior"}]},
  {id:4,name:"Reativação — 7 dias em Qualificado sem avançar",active:true,trigger:{type:"sem_avanco",days:7,stage:"Qualificado"},actions:[{type:"whatsapp",label:"Enviar mensagem de reativação personalizada"},{type:"criar_tarefa",label:"Criar tarefa: ligar para requalificar"}]},
];
const TRIGGER_LABELS={novo_lead:"Novo lead criado",sem_atividade:"Sem atividade por",score_threshold:"Score atingir",sem_avanco:"Sem avanço no funil por"};
const ACTION_COLORS={whatsapp:C.green,criar_tarefa:C.blue,notificar:C.amber,score:C.purple,tag:C.slate,assignee:"#f97316"};
const ACTION_ICONS={whatsapp:"💬",criar_tarefa:"✓",notificar:"🔔",score:"◉",tag:"🏷",assignee:"👤"};
const INIT_CONVOS = [];
const NAV=[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"pipeline",label:"Pipeline",icon:"⋮⋮"},{id:"leads",label:"Leads",icon:"◉"},{id:"tasks",label:"Tarefas",icon:"✓"},{id:"whatsapp",label:"WhatsApp",icon:"💬"},{id:"automations",label:"Automações",icon:"⚡"},{id:"metaads",label:"Meta Ads",icon:"↗"},{id:"reports",label:"Relatórios",icon:"📊"},{id:"settings",label:"Configurações",icon:"⚙"}];
const WS_COLORS=["#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#f97316"];
const DEFAULT_STAGES=["Novo Lead","Qualificado","Proposta","Negociação","Fechado"];
const API=import.meta.env.VITE_API_URL||"";

function AuthScreen({onLogin}) {
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({email:"",pass:"",name:"",company:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const up=k=>v=>setForm(p=>({...p,[k]:v}));
  const submit=async()=>{
    setLoading(true);setError("");
    try{
      const r=await fetch(API+(mode==="login"?"/api/auth/login":"/api/auth/register"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="login"?{email:form.email,password:form.pass}:{name:form.name,email:form.email,password:form.pass,company:form.company})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||"Erro ao autenticar");
      localStorage.setItem("crm_token",d.token);
      onLogin({name:d.user.name,email:d.user.email},d.workspaces||[],d.token);
    }catch(err){setError(err.message);}
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0d1117 0%,#0f1f2e 50%,#0d1a1a 100%)",display:"flex",overflow:"hidden"}}>
      {/* Left panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundImage:"radial-gradient(circle at 20% 50%, rgba(0,200,150,0.08) 0%, transparent 60%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:64}}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#00c896"/>
            <path d="M10 20C10 14.477 14.477 10 20 10C23.18 10 26.02 11.38 28 13.6L24.4 16.5C23.36 15.24 21.78 14.44 20 14.44C16.93 14.44 14.44 16.93 14.44 20C14.44 23.07 16.93 25.56 20 25.56C21.78 25.56 23.36 24.76 24.4 23.5L28 26.4C26.02 28.62 23.18 30 20 30C14.477 30 10 25.523 10 20Z" fill="#0d1117"/>
            <circle cx="28" cy="20" r="3" fill="#0d1117"/>
          </svg>
          <span style={{color:"white",fontWeight:800,fontSize:22,letterSpacing:"-0.5px"}}>Clien<span style={{color:"#00c896"}}>Data</span></span>
        </div>
        <div style={{maxWidth:480}}>
          <h1 style={{color:"white",fontSize:40,fontWeight:800,lineHeight:1.15,letterSpacing:"-1.5px",marginBottom:16}}>
            Suas vendas,<br/><span style={{color:"#00c896"}}>organizadas e inteligentes.</span>
          </h1>
          <p style={{color:"rgba(255,255,255,0.45)",fontSize:16,lineHeight:1.7,marginBottom:48,fontWeight:300}}>
            Gerencie leads, WhatsApp, e-mail e IA em uma plataforma feita para empresas brasileiras crescerem mais rápido.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {[{icon:"💬",text:"WhatsApp integrado — responda clientes sem sair do CRM"},{icon:"🤖",text:"IA que analisa leads e sugere a próxima ação"},{icon:"📊",text:"Funil visual para nunca perder uma oportunidade"}].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:40,height:40,borderRadius:10,background:"rgba(0,200,150,0.12)",border:"1px solid rgba(0,200,150,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{item.icon}</div>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:14,lineHeight:1.5}}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right panel */}
      <div style={{width:480,background:"white",display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 52px",boxShadow:"-20px 0 60px rgba(0,0,0,0.3)"}}>
        <div style={{marginBottom:32}}>
          <h2 style={{fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-0.5px",marginBottom:6}}>{mode==="login"?"Bem-vindo de volta!":"Criar sua conta grátis"}</h2>
          <p style={{fontSize:14,color:C.muted}}>{mode==="login"?"Entre na sua conta ClienData":"15 dias grátis, sem cartão de crédito"}</p>
        </div>
        <div style={{display:"flex",background:C.light,borderRadius:10,padding:4,marginBottom:28}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"9px",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:600,background:mode===m?"white":"transparent",color:mode===m?C.text:C.slate,boxShadow:mode===m?"0 2px 8px rgba(0,0,0,0.08)":"none",transition:"all 0.2s"}}>
              {m==="login"?"Entrar":"Criar conta"}
            </button>
          ))}
        </div>
        {mode==="register"&&<><Field label="Seu nome" value={form.name} onChange={up("name")} placeholder="João Silva"/><Field label="Empresa" value={form.company} onChange={up("company")} placeholder="Minha Empresa"/></>}
        <Field label="E-mail" value={form.email} onChange={up("email")} placeholder="joao@empresa.com"/>
        <Field label="Senha" value={form.pass} onChange={up("pass")} type="password" placeholder="••••••••"/>
        {mode==="login"&&<div style={{textAlign:"right",marginBottom:20,marginTop:-6}}><span style={{fontSize:13,color:C.blue,cursor:"pointer",fontWeight:500}}>Esqueci a senha</span></div>}
        {error&&<div style={{background:C.redBg,color:C.redTx,borderRadius:10,padding:"12px 14px",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>⚠ {error}</div>}
        <button onClick={submit} disabled={loading} style={{width:"100%",background:C.green,color:"white",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?0.7:1,boxShadow:"0 4px 20px rgba(0,200,150,0.3)",transition:"all 0.2s"}}>
          {loading?"Aguarde...":(mode==="login"?"Entrar na conta":"Criar conta grátis — é de graça")}
        </button>
        {mode==="register"&&<p style={{fontSize:12,color:C.muted,textAlign:"center",marginTop:16,lineHeight:1.6}}>Ao criar sua conta você concorda com os <span style={{color:C.blue,cursor:"pointer"}}>Termos de uso</span> e a <span style={{color:C.blue,cursor:"pointer"}}>Política de privacidade</span>.</p>}
        <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"center",gap:8,alignItems:"center"}}>
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#00c896"/><path d="M10 20C10 14.477 14.477 10 20 10C23.18 10 26.02 11.38 28 13.6L24.4 16.5C23.36 15.24 21.78 14.44 20 14.44C16.93 14.44 14.44 16.93 14.44 20C14.44 23.07 16.93 25.56 20 25.56C21.78 25.56 23.36 24.76 24.4 23.5L28 26.4C26.02 28.62 23.18 30 20 30C14.477 30 10 25.523 10 20Z" fill="#0d1117"/><circle cx="28" cy="20" r="3" fill="#0d1117"/></svg>
          <span style={{fontSize:13,color:C.muted}}>ClienData · CRM Inteligente Brasileiro</span>
        </div>
      </div>
    </div>
  );
}

function Field({label,value,onChange,type="text",placeholder}){
  const [show,setShow]=useState(false);
  const isPass=type==="password";
  return(
    <div style={{marginBottom:14}}>
      <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:5}}>{label}</label>
      <div style={{position:"relative"}}>
        <input type={isPass&&!show?"password":"text"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:isPass?"9px 38px 9px 12px":"9px 12px",fontSize:13,color:C.text,outline:"none",boxSizing:"border-box",background:"white"}}/>
        {isPass&&<button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:15,padding:2,lineHeight:1}}>{show?"🙈":"👁"}</button>}
      </div>
    </div>
  );
}

function WorkspaceSelector({user,workspaces,onSelect,token,API}){
  const [creating,setCreating]=useState(false);
  const [newName,setNewName]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const create=async()=>{
    if(!newName.trim())return;
    setLoading(true);setErr("");
    try{
      const r=await fetch(API+"/api/workspaces",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({name:newName})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||"Erro");
      onSelect({...d,role:"ADMIN"});
    }catch(e){setErr(e.message);}
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0d1117 0%,#0f1f2e 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:460}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#00c896"/>
              <path d="M10 20C10 14.477 14.477 10 20 10C23.18 10 26.02 11.38 28 13.6L24.4 16.5C23.36 15.24 21.78 14.44 20 14.44C16.93 14.44 14.44 16.93 14.44 20C14.44 23.07 16.93 25.56 20 25.56C21.78 25.56 23.36 24.76 24.4 23.5L28 26.4C26.02 28.62 23.18 30 20 30C14.477 30 10 25.523 10 20Z" fill="#0d1117"/>
              <circle cx="28" cy="20" r="3" fill="#0d1117"/>
            </svg>
            <span style={{color:"white",fontWeight:800,fontSize:22,letterSpacing:"-0.5px"}}>Clien<span style={{color:"#00c896"}}>Data</span></span>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:"white",letterSpacing:"-0.3px"}}>Olá, {user.name.split(" ")[0]}! 👋</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginTop:6}}>Selecione o workspace para acessar</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {workspaces.map((ws,i)=>(
            <div key={ws.id||i} onClick={()=>onSelect(ws)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:18,transition:"all 0.2s"}}
              onMouseOver={e=>{e.currentTarget.style.background="rgba(0,200,150,0.08)";e.currentTarget.style.borderColor="rgba(0,200,150,0.3)";}} onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
              <div style={{width:44,height:44,borderRadius:11,background:ws.color||WS_COLORS[i%WS_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"white",flexShrink:0}}>{ws.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:"white",fontSize:15}}>{ws.name}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>Plano {ws.plan||"Starter"} · {ws.role||"Admin"}</div>
              </div>
              <span style={{color:"rgba(255,255,255,0.3)",fontSize:18}}>›</span>
            </div>
          ))}
          {!creating?(
          <div onClick={()=>setCreating(true)} style={{background:"transparent",border:"1.5px dashed rgba(255,255,255,0.12)",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:18,transition:"all 0.2s"}}
            onMouseOver={e=>e.currentTarget.style.borderColor="rgba(0,200,150,0.4)"} onMouseOut={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}>
            <div style={{width:44,height:44,borderRadius:11,background:"rgba(255,255,255,0.04)",border:"1.5px dashed rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"rgba(255,255,255,0.25)"}}>+</div>
            <div style={{flex:1}}><div style={{fontWeight:600,color:"rgba(255,255,255,0.4)",fontSize:14}}>Criar novo workspace</div><div style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:2}}>Para uma nova empresa ou projeto</div></div>
          </div>):(
          <div style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(0,200,150,0.3)",borderRadius:14,padding:18}}>
            <div style={{fontSize:14,fontWeight:600,color:"white",marginBottom:12}}>Nome do novo workspace</div>
            <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&create()} placeholder="Ex: Clínica Dr. Augusto" style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"10px 14px",fontSize:14,color:"white",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            {err&&<div style={{color:"#f87171",fontSize:12,marginBottom:8}}>{err}</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={create} disabled={loading} style={{flex:1,background:"#00c896",color:"white",border:"none",borderRadius:8,padding:"10px",fontSize:14,fontWeight:700,cursor:"pointer"}}>{loading?"Criando...":"Criar workspace"}</button>
              <button onClick={()=>{setCreating(false);setNewName("");setErr("");}} style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",border:"none",borderRadius:8,padding:"10px 16px",fontSize:14,cursor:"pointer"}}>Cancelar</button>
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

export default function CRMPro(){
  // Página de sucesso após pagamento Stripe
  if(window.location.pathname==="/success"){
    const plan=new URLSearchParams(window.location.search).get("plan")||"";
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0d1117 0%,#0f1f2e 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{background:"white",borderRadius:20,padding:"48px 40px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
          <div style={{width:72,height:72,background:"#e6faf5",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:32}}>✅</div>
          <h1 style={{fontSize:26,fontWeight:800,color:"#1e293b",letterSpacing:"-0.5px",marginBottom:10}}>Assinatura confirmada!</h1>
          <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,marginBottom:32}}>Seu plano ClienData já está ativo. Você tem acesso completo a todas as funcionalidades.</p>
          <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 20px",marginBottom:28,display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
            <div style={{width:40,height:40,background:"#00c896",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none"><path d="M10 20C10 14.477 14.477 10 20 10C23.18 10 26.02 11.38 28 13.6L24.4 16.5C23.36 15.24 21.78 14.44 20 14.44C16.93 14.44 14.44 16.93 14.44 20C14.44 23.07 16.93 25.56 20 25.56C21.78 25.56 23.36 24.76 24.4 23.5L28 26.4C26.02 28.62 23.18 30 20 30C14.477 30 10 25.523 10 20Z" fill="white"/><circle cx="28" cy="20" r="3" fill="white"/></svg>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>Clien<span style={{color:"#00c896"}}>Data</span> {plan&&`— Plano ${plan}`}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Cobrança recorrente · Cancele quando quiser</div>
            </div>
          </div>
          <button onClick={()=>window.location.href="/"} style={{width:"100%",background:"#00c896",color:"white",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(0,200,150,0.3)"}}>
            Acessar o ClienData →
          </button>
          <p style={{fontSize:12,color:"#94a3b8",marginTop:16}}>Você receberá um e-mail de confirmação em breve.</p>
        </div>
      </div>
    );
  }
  const [authUser,setAuthUser]=useState(null);
  const [token,setToken]=useState(localStorage.getItem("crm_token")||"");
  const [wsList,setWsList]=useState([]);
  const [workspace,setWorkspace]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [leads,setLeads]=useState(INIT_LEADS);
  const [autos,setAutos]=useState(INIT_AUTOS);
  const [convos,setConvos]=useState(INIT_CONVOS);
  const [selLead,setSelLead]=useState(null);
  const [aiData,setAiData]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [newLeadModal,setNewLeadModal]=useState(false);
  const [limitModal,setLimitModal]=useState(false);
  const [selectedConvoId,setSelectedConvoId]=useState(null);
  const [newLeadForm,setNewLeadForm]=useState({name:"",company:"",email:"",phone:"",value:"",source:"Indicação",notes:""});
  const [savingLead,setSavingLead]=useState(false);
  const [customFields,setCustomFields]=useState([]);
  const [pipelines,setPipelines]=useState([]);
  const [activePipeline,setActivePipeline]=useState(null);
  const [emailModal,setEmailModal]=useState(null);
  const [billing,setBilling]=useState({plan:"free",status:"none"});
  const [editingLead,setEditingLead]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [savingEdit,setSavingEdit]=useState(false);
  const [proposalModal,setProposalModal]=useState(false);
  const [proposal,setProposal]=useState({title:"Proposta Comercial",validDays:30,paymentTerms:"",notes:"",companyName:"",companyEmail:"",companyPhone:"",items:[{description:"",qty:1,price:""}]});
  const [generatingPDF,setGeneratingPDF]=useState(false);
  const [tasks,setTasks]=useState([
    {id:1,title:"Ligar Fernanda Lima — contraproposta",lead:"Fernanda Lima",type:"Ligação",due:"Hoje",pri:"Alta",done:false},
    {id:2,title:"Enviar contrato Amanda Vieira",lead:"Amanda Vieira",type:"E-mail",due:"Hoje",pri:"Alta",done:false},
    {id:3,title:"Follow-up Carlos Mendes",lead:"Carlos Mendes",type:"Follow-up",due:"Hoje",pri:"Média",done:true},
    {id:4,title:"Agendar demo — Lucas Ferreira",lead:"Lucas Ferreira",type:"Reunião",due:"Amanhã",pri:"Média",done:false},
    {id:5,title:"Reativação urgente: Beatriz Gomes",lead:"Beatriz Gomes",type:"Follow-up",due:"Atrasado",pri:"Alta",done:false},
    {id:6,title:"Qualificação: Mariana Torres",lead:"Mariana Torres",type:"Ligação",due:"Atrasado",pri:"Alta",done:false},
  ]);

  const handleLogin=(user,workspaces,tk)=>{
    setAuthUser(user);
    if(tk)setToken(tk);
    if(workspaces&&workspaces.length>0){
      setWsList(workspaces.map((w,i)=>({id:w.workspace?.id||w.id,name:w.workspace?.name||w.name,plan:w.workspace?.plan||w.plan||"Starter",role:w.role||"Admin",color:WS_COLORS[i%WS_COLORS.length]})));
    }
  };

  useEffect(()=>{
    if(!workspace||!token)return;
    fetch(`${API}/api/workspaces/${workspace.id}/leads`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(data=>{if(Array.isArray(data)&&data.length>0)setLeads(data);}).catch(()=>{});
    fetch(`${API}/api/workspaces/${workspace.id}/custom-fields`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(data=>{if(Array.isArray(data))setCustomFields(data);}).catch(()=>{});
    fetch(`${API}/api/workspaces/${workspace.id}/pipelines`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(data=>{if(Array.isArray(data)&&data.length>0){setPipelines(data);setActivePipeline(data[0]);}}).catch(()=>{});
    fetch(`${API}/api/billing/subscription`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(data=>{if(data.plan)setBilling(data);}).catch(()=>{});
  },[workspace]);

  useEffect(()=>{
    if(!workspace)return;
    const socket=socketIO(API,{transports:["websocket"]});
    socket.emit("join",workspace.id);
    socket.on("wa_message",(msg)=>{
      const mp=msg.phone.replace(/\D/g,"");
      setConvos(prev=>{
        const exists=prev.find(c=>c.phone&&c.phone.replace(/\D/g,"").endsWith(mp.slice(-8)));
        if(exists){
          return prev.map(c=>{
            if(!c.phone||!c.phone.replace(/\D/g,"").endsWith(mp.slice(-8)))return c;
            return{...c,messages:[...c.messages,{from:msg.from,text:msg.text,time:new Date(msg.time).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}],last:msg.text,unread:msg.from==="lead"?c.unread+1:c.unread,time:new Date(msg.time).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})};
          });
        } else if(msg.from==="lead"){
          const newConvo={id:msg.convId||Date.now(),lead:msg.leadName||msg.phone,phone:msg.phone,avatar:(msg.leadName||msg.phone).slice(0,2).toUpperCase(),color:WS_COLORS[prev.length%WS_COLORS.length],unread:1,last:msg.text,time:new Date(msg.time).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),messages:[{from:msg.from,text:msg.text,time:new Date(msg.time).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]};
          return[newConvo,...prev];
        }
        return prev;
      });
    });
    // Carregar conversas do banco
    fetch(`${API}/api/workspaces/${workspace.id}/whatsapp/conversations`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(data=>{
        if(Array.isArray(data)){
          setConvos(data.map((c,i)=>({id:c.id,lead:c.lead?.name||c.phone,phone:c.phone,avatar:(c.lead?.name||c.phone).slice(0,2).toUpperCase(),color:WS_COLORS[i%WS_COLORS.length],unread:c.unread||0,last:c.lastMessage||"",time:c.updatedAt?new Date(c.updatedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"",messages:[]})));
        }
      }).catch(()=>{});
    return()=>socket.disconnect();
  },[workspace]);

  const saveLead=async()=>{
    setSavingLead(true);
    try{
      const r=await fetch(`${API}/api/workspaces/${workspace.id}/leads`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({...newLeadForm,value:Number(newLeadForm.value)||0})});
      const d=await r.json();
      if(r.ok){
        setLeads(p=>[d,...p]);setNewLeadModal(false);setNewLeadForm({name:"",company:"",email:"",phone:"",value:"",source:"Indicação",notes:""});
      } else if(r.status===403){
        setNewLeadModal(false);
        setLimitModal(true);
      }
    }catch{}
    setSavingLead(false);
  };

  const saveEdit=async()=>{
    setSavingEdit(true);
    try{
      const r=await fetch(`${API}/api/workspaces/${workspace.id}/leads/${editingLead.id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({...editForm,value:Number(editForm.value)||0})});
      const d=await r.json();
      if(r.ok){setLeads(p=>p.map(l=>l.id===d.id?d:l));setSelLead(d);setEditingLead(null);}
    }catch{}
    setSavingEdit(false);
  };

  const openCheckout=async(plan)=>{
    try{
      const r=await fetch(`${API}/api/billing/checkout`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({plan})});
      const d=await r.json();
      if(d.url)window.location.href=d.url;
    }catch{}
  };

  const openPortal=async()=>{
    try{
      const r=await fetch(`${API}/api/billing/portal`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
      const d=await r.json();
      if(d.url)window.location.href=d.url;
    }catch{}
  };

  const openLeadWhatsApp=(lead)=>{
    if(!lead.phone)return;
    const cp=lead.phone.replace(/\D/g,"");
    const exists=convos.find(c=>c.phone&&c.phone.replace(/\D/g,"").slice(-8)===cp.slice(-8));
    if(exists){setSelectedConvoId(exists.id);}
    else{
      const newConvo={id:Date.now(),lead:lead.name,phone:lead.phone,avatar:lead.name.split(" ").map(n=>n[0]).join("").slice(0,2),color:WS_COLORS[convos.length%WS_COLORS.length],unread:0,last:"",time:"",messages:[]};
      setConvos(prev=>[...prev,newConvo]);
      setSelectedConvoId(newConvo.id);
    }
    setTab("whatsapp");
  };

  const addItem=()=>setProposal(p=>({...p,items:[...p.items,{description:"",qty:1,price:""}]}));
  const removeItem=(i)=>setProposal(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));
  const updateItem=(i,k,v)=>setProposal(p=>({...p,items:p.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
  const generatePDF=async()=>{
    if(!selLead)return;
    setGeneratingPDF(true);
    try{
      const r=await fetch(`${API}/api/workspaces/${workspace.id}/leads/${selLead.id}/proposals`,{
        method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify(proposal)
      });
      if(r.ok){
        const blob=await r.blob();
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download=`proposta-${selLead.name.replace(/\s+/g,"-")}.pdf`;
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setProposalModal(false);
      }
    }catch(e){alert("Erro ao gerar proposta");}
    setGeneratingPDF(false);
  };
  const propTotal=proposal.items.reduce((a,it)=>a+(Number(it.qty)||1)*(Number(it.price)||0),0);

  if(!authUser)return <AuthScreen onLogin={handleLogin}/>;
  if(!workspace)return <WorkspaceSelector user={authUser} workspaces={wsList} onSelect={setWorkspace} token={token} API={API}/>;

  const overdue=tasks.filter(t=>t.due==="Atrasado"&&!t.done).length;
  const unreadWA=convos.reduce((a,c)=>a+c.unread,0);
  const pipeVal=leads.filter(l=>l.stage!=="Fechado").reduce((a,l)=>a+l.value,0);
  const activeStages=activePipeline?(activePipeline.stages||DEFAULT_STAGES):DEFAULT_STAGES;

  const analyzeAI=async lead=>{
    setAiData(null);setAiLoading(true);
    try{
      const r=await fetch(`${API}/api/ai/analyze`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:`Especialista em vendas B2B. Analise e retorne SOMENTE JSON válido.\nLead: ${lead.name} | ${lead.company} | Stage: ${lead.stage} | Valor: R$${lead.value.toLocaleString()} | Score: ${lead.score||50}\nFonte: ${lead.source} | Notas: ${lead.notes}\n{"score_analise":"1 frase","probabilidade":"XX%","acoes":[{"tipo":"Ligação|E-mail|WhatsApp|Reunião","acao":"ação específica","urgencia":"Alta|Média|Baixa","prazo":"quando"}],"risco":"risco ou null","whatsapp_msg":"mensagem pronta para enviar no WhatsApp (informal, até 100 palavras)"}`}]})});
      const d=await r.json();
      setAiData(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()));
    }catch{setAiData({error:true});}
    setAiLoading(false);
  };

  const Dashboard=()=>{
    const [kpis,setKpis]=useState(null);
    const [leadsByDay,setLeadsByDay]=useState([]);
    const [atRisk,setAtRisk]=useState([]);
    const [loading,setLoading]=useState(true);

    useEffect(()=>{
      const h={Authorization:`Bearer ${token}`};
      Promise.all([
        fetch(`${API}/api/workspaces/${workspace.id}/reports/kpis`,{headers:h}).then(r=>r.json()),
        fetch(`${API}/api/workspaces/${workspace.id}/reports/leads-by-day`,{headers:h}).then(r=>r.json()).catch(()=>[]),
        fetch(`${API}/api/workspaces/${workspace.id}/reports/at-risk`,{headers:h}).then(r=>r.json()).catch(()=>[]),
      ]).then(([k,d,r])=>{setKpis(k);setLeadsByDay(Array.isArray(d)?d:[]);setAtRisk(Array.isArray(r)?r:[]);setLoading(false);});
    },[]);

    const pipeVal=leads.filter(l=>l.stage!=="Fechado").reduce((a,l)=>a+l.value,0);
    const stageData=STAGES.map(s=>({name:s,value:leads.filter(l=>l.stage===s).length,val:leads.filter(l=>l.stage===s).reduce((a,l)=>a+l.value,0)}));
    const sourceData=Object.entries(leads.reduce((a,l)=>{const s=l.source||"Outros";a[s]=(a[s]||0)+1;return a;},{})).map(([n,v])=>({n,v})).sort((a,b)=>b.v-a.v);
    const srcColors=[C.blue,C.green,C.amber,C.purple,C.slate,C.red];
    const totalLeads=leads.length;
    const closedLeads=leads.filter(l=>l.stage==="Fechado").length;
    const convRate=totalLeads>0?((closedLeads/totalLeads)*100).toFixed(1):0;
    const avgScore=totalLeads>0?Math.round(leads.reduce((a,l)=>a+(l.score||50),0)/totalLeads):0;
    const pipeLeads=leads.filter(l=>l.stage!=="Fechado");
    const hotLeads=pipeLeads.filter(l=>(l.score||50)>=75);

    if(loading)return<Pg title="Dashboard" sub="Carregando dados..."><div style={{textAlign:"center",padding:60,color:C.muted}}>⟳ Carregando...</div></Pg>;

    return(
      <Pg title="Dashboard" sub={`Visão geral · ${new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}`} onNew={()=>setNewLeadModal(true)}>
        {/* KPIs principais */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            {l:"Pipeline ativo",v:`R$ ${(pipeVal/1000).toFixed(0)}K`,s:`${pipeLeads.length} deals em aberto`,c:C.purple,icon:"💼"},
            {l:"Leads quentes",v:hotLeads.length,s:`Score ≥ 75 · ${convRate}% conv.`,c:C.green,icon:"🔥"},
            {l:"Tarefas pendentes",v:tasks.filter(t=>!t.done).length,s:`${overdue} atrasadas`,c:overdue>0?C.red:C.amber,icon:"✓"},
            {l:"WhatsApp",v:unreadWA,s:"mensagens não lidas",c:unreadWA>0?C.blue:C.slate,icon:"💬"},
          ].map((k,i)=>(
            <div key={i} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{k.l}</div>
                <span style={{fontSize:20}}>{k.icon}</span>
              </div>
              <div style={{fontSize:28,fontWeight:800,color:k.c,letterSpacing:"-1px",margin:"4px 0"}}>{k.v}</div>
              <div style={{fontSize:12,color:C.slate}}>{k.s}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
          {/* Leads por dia */}
          <div style={card}>
            <STitle>Leads captados por dia (últimos 30 dias)</STitle>
            {leadsByDay.length>0?(
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={leadsByDay} barSize={10}>
                  <XAxis dataKey="day" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} interval={4}/>
                  <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}} formatter={v=>[v,"Leads"]}/>
                  <Bar dataKey="count" fill={C.green} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ):<div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>Nenhum dado no período</div>}
          </div>
          {/* Origem dos leads */}
          <div style={card}>
            <STitle>Origem dos leads</STitle>
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
              {sourceData.slice(0,6).map((s,i)=>(
                <div key={s.n} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:srcColors[i],flexShrink:0}}/>
                  <span style={{fontSize:12,color:C.slate,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.n}</span>
                  <div style={{flex:2,background:C.light,borderRadius:4,height:6,overflow:"hidden"}}>
                    <div style={{width:`${Math.round((s.v/totalLeads)*100)}%`,background:srcColors[i],height:"100%",borderRadius:4}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:C.text,width:28,textAlign:"right"}}>{s.v}</span>
                </div>
              ))}
              {sourceData.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>Nenhum lead ainda</div>}
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {/* Funil de conversão */}
          <div style={card}>
            <STitle>Funil de conversão</STitle>
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
              {stageData.map((s,i)=>{
                const prev=i>0?stageData[i-1].value:null;
                const pct=prev&&prev>0?Math.round((s.value/prev)*100):null;
                const stageColor=SC[s.name]?.c||C.slate;
                return(
                  <div key={s.name}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:12,color:C.slate,width:90,flexShrink:0}}>{s.name}</span>
                      <div style={{flex:1,background:C.light,borderRadius:4,height:20,overflow:"hidden"}}>
                        <div style={{width:`${totalLeads>0?Math.max((s.value/totalLeads)*100,s.value>0?8:0):0}%`,background:stageColor,height:"100%",borderRadius:4,display:"flex",alignItems:"center",paddingLeft:6,transition:"width 0.5s"}}>
                          {s.value>0&&<span style={{color:"white",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{s.value}</span>}
                        </div>
                      </div>
                      <div style={{width:70,textAlign:"right",flexShrink:0}}>
                        {pct!==null&&<span style={{fontSize:11,fontWeight:600,color:pct>=50?C.green:pct>=25?C.amber:C.red}}>{pct}% conv.</span>}
                      </div>
                    </div>
                    <div style={{fontSize:10,color:C.muted,paddingLeft:98,marginBottom:2}}>R$ {s.val.toLocaleString("pt-BR")}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leads em risco + KPIs */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={card}>
              <STitle>KPIs do negócio</STitle>
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:0}}>
                {[
                  {l:"Total de leads",v:totalLeads,c:C.text},
                  {l:"Taxa de conversão",v:`${convRate}%`,c:Number(convRate)>=20?C.green:C.amber},
                  {l:"Score médio",v:`${avgScore}/100`,c:avgScore>=70?C.green:avgScore>=50?C.amber:C.red},
                  {l:"Automações ativas",v:autos.filter(a=>a.active).length,c:C.purple},
                  {l:"Tarefas atrasadas",v:overdue,c:overdue===0?C.green:C.red},
                ].map((k,i,arr)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<arr.length-1?`1px solid ${C.light}`:"none"}}>
                    <span style={{fontSize:13,color:C.text}}>{k.l}</span>
                    <span style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leads em risco */}
        {atRisk.length>0&&(
          <div style={{...card,borderLeft:`3px solid ${C.amber}`}}>
            <STitle>⚠ Leads em risco — sem movimentação há mais de 5 dias</STitle>
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
              {atRisk.slice(0,5).map(l=>(
                <div key={l.id} onClick={()=>setSelLead(l)} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.light}`,cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.background=C.light} onMouseOut={e=>e.currentTarget.style.background="white"}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:C.amberBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.amberTx,flexShrink:0}}>{l.name?.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{l.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{l.stage} · {l.company||"Sem empresa"}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.amber}}>{l.daysSince}d parado</div>
                    <div style={{fontSize:11,color:C.muted}}>R$ {(l.value||0).toLocaleString("pt-BR")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Pg>
    );
  };

  const Pipeline=()=>{
    const [newPipeName,setNewPipeName]=useState("");
    const [savingPipe,setSavingPipe]=useState(false);
    const createPipeline=async()=>{
      if(!newPipeName.trim())return;
      setSavingPipe(true);
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/pipelines`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({name:newPipeName,stages:DEFAULT_STAGES})});
        const d=await r.json();
        if(r.ok){setPipelines(prev=>[...prev,d]);setActivePipeline(d);setNewPipeName("");}
      }catch{}
      setSavingPipe(false);
    };
    const delPipeline=async(id)=>{
      await fetch(`${API}/api/workspaces/${workspace.id}/pipelines/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
      const remaining=pipelines.filter(p=>p.id!==id);
      setPipelines(remaining);
      setActivePipeline(remaining[0]||null);
    };
    return(
      <Pg title="Pipeline" sub="Clique em um lead para análise com IA" onNew={()=>setNewLeadModal(true)}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {pipelines.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>setActivePipeline(p)} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${activePipeline?.id===p.id?C.green:C.border}`,background:activePipeline?.id===p.id?C.greenBg:"white",color:activePipeline?.id===p.id?C.greenTx:C.slate,cursor:"pointer",fontSize:12,fontWeight:600}}>{p.name}</button>
              {pipelines.length>1&&<button onClick={()=>delPipeline(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:11,padding:"0 2px"}}>✕</button>}
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
            <input value={newPipeName} onChange={e=>setNewPipeName(e.target.value)} placeholder="Novo funil..." style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:12,outline:"none",width:130}}/>
            <button onClick={createPipeline} disabled={savingPipe||!newPipeName.trim()} style={{background:C.green,color:"white",border:"none",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600,opacity:(savingPipe||!newPipeName.trim())?0.6:1}}>+ Funil</button>
          </div>
        </div>
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,alignItems:"flex-start"}}>
          {activeStages.map(stage=>{
            const stageColor=SC[stage]||{c:C.slate,bg:C.light,tx:C.slate};
            const {c,bg,tx}=stageColor;
            const sl=leads.filter(l=>l.stage===stage&&(!activePipeline||!l.pipelineId||l.pipelineId===activePipeline.id));
            return(
              <div key={stage} style={{minWidth:210,width:210,flexShrink:0}}>
                <Row mb={6}><div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/><span style={{fontSize:12,fontWeight:700,color:C.text}}>{stage}</span><span style={{background:bg,color:tx,borderRadius:20,padding:"0 7px",fontSize:10,fontWeight:700}}>{sl.length}</span></Row>
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>R$ {sl.reduce((a,l)=>a+l.value,0).toLocaleString("pt-BR")}</div>
                {sl.map(lead=>(
                  <div key={lead.id} onClick={()=>{setSelLead(lead);setAiData(null);}} style={{...card,padding:12,cursor:"pointer",marginBottom:8,transition:"transform 0.1s"}}
                    onMouseOver={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseOut={e=>e.currentTarget.style.transform="none"}>
                    <Row mb={4}><div style={{fontWeight:600,fontSize:12,color:C.text,flex:1,lineHeight:1.3}}>{lead.name}</div><ScoreBadge s={lead.score||50}/></Row>
                    <div style={{fontSize:11,color:C.slate,marginBottom:6}}>{lead.company}</div>
                    <Row><span style={{fontSize:11,fontWeight:600,color:C.green}}>{fmt(lead.value)}</span>{lead.assignee&&<Avatar name={lead.assignee} size={22}/>}</Row>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Pg>
    );
  };

  const LeadsTable=()=>{
    const [q,setQ]=useState("");const [sf,setSf]=useState("Todos");
    const filtered=leads.filter(l=>(!q||[l.name,l.company||""].some(x=>x.toLowerCase().includes(q.toLowerCase())))&&(sf==="Todos"||l.stage===sf));
    return(
      <Pg title="Leads" sub={`${leads.length} cadastrados · ${filtered.length} exibidos`} onNew={()=>setNewLeadModal(true)}>
        <div style={{...card,padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar nome ou empresa..." style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none"}}/>
            <select value={sf} onChange={e=>setSf(e.target.value)} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,color:C.slate,background:"white",cursor:"pointer"}}><option>Todos</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:C.light}}>{["Lead","Empresa","Estágio","Valor","Score","Fonte","IA"].map(h=><th key={h} style={{padding:"8px 14px",textAlign:"left",color:C.slate,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(lead=>{const cfg=SC[lead.stage]||{c:C.slate,bg:C.light,tx:C.slate};return(
                  <tr key={lead.id} style={{borderBottom:`1px solid ${C.light}`,cursor:"pointer"}} onClick={()=>{setSelLead(lead);setAiData(null);}} onMouseOver={e=>e.currentTarget.style.background=C.light} onMouseOut={e=>e.currentTarget.style.background="white"}>
                    <td style={{padding:"10px 14px"}}><div style={{fontWeight:600,color:C.text}}>{lead.name}</div><div style={{color:C.muted,fontSize:11}}>{lead.email}</div></td>
                    <td style={{padding:"10px 14px",color:C.slate}}>{lead.company}</td>
                    <td style={{padding:"10px 14px"}}>{badge(lead.stage,cfg.c,cfg.bg,cfg.tx,true)}</td>
                    <td style={{padding:"10px 14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>{fmt(lead.value)}</td>
                    <td style={{padding:"10px 14px"}}><ScoreBadge s={lead.score||50}/></td>
                    <td style={{padding:"10px 14px",color:C.slate,whiteSpace:"nowrap"}}>{lead.source}</td>
                    <td style={{padding:"10px 14px"}}><button onClick={e=>{e.stopPropagation();setSelLead(lead);analyzeAI(lead);}} style={{background:C.blueBg,color:C.blue,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>✦ IA</button></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      </Pg>
    );
  };

  const TasksPage=()=>{
    const DUE_ORDER=["Atrasado","Hoje","Amanhã","Esta semana"];
    const DC={"Hoje":{bg:"#f1f5f9",tx:C.text},"Amanhã":{bg:C.blueBg,tx:C.blueTx},"Esta semana":{bg:C.greenBg,tx:C.greenTx},"Atrasado":{bg:C.redBg,tx:C.redTx}};
    const TC={Ligação:C.blue,"E-mail":C.purple,Reunião:C.green,"Follow-up":C.amber,Tarefa:C.slate};
    return(
      <Pg title="Tarefas" sub={`${tasks.filter(t=>!t.done).length} pendentes · ${overdue} atrasadas`}>
        {DUE_ORDER.map(due=>{
          const g=tasks.filter(t=>t.due===due);if(!g.length)return null;const dc=DC[due];
          return(<div key={due} style={{...card,marginBottom:14}}>
            <Row mb={12}><span style={{background:dc.bg,color:dc.tx,borderRadius:6,padding:"3px 12px",fontSize:12,fontWeight:600}}>{due}</span><span style={{color:C.muted,fontSize:12}}>{g.filter(t=>!t.done).length} pendentes</span></Row>
            {g.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,background:t.done?C.light:"white",border:`1px solid ${C.light}`,opacity:t.done?0.5:1,marginBottom:5}}>
              <input type="checkbox" checked={t.done} onChange={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{width:15,height:15,cursor:"pointer",accentColor:C.green,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:13,color:C.text,fontWeight:500,textDecoration:t.done?"line-through":"none"}}>{t.title}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>{t.lead}</div></div>
              <span style={{background:(TC[t.type]||C.slate)+"20",color:TC[t.type]||C.slate,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,flexShrink:0}}>{t.type}</span>
              <span style={{fontSize:11,color:t.pri==="Alta"?C.red:t.pri==="Média"?C.amber:C.muted,fontWeight:600,flexShrink:0}}>● {t.pri}</span>
            </div>))}
          </div>);
        })}
      </Pg>
    );
  };

  const WhatsApp=()=>{
    const [sel,setSel]=useState(()=>convos.find(c=>c.id===selectedConvoId)||convos[0]||null);
    const [msg,setMsg]=useState("");const [aiSug,setAiSug]=useState(null);const [aiSugL,setAiSugL]=useState(false);const endRef=useRef(null);
    useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[sel?.messages]);
    useEffect(()=>{setSel(prev=>convos.find(c=>c.id===prev?.id)||convos[0]||null);},[convos]);
    useEffect(()=>{if(selectedConvoId){const c=convos.find(x=>x.id===selectedConvoId);if(c)loadAndSelect(c);}},[selectedConvoId]);
    const loadAndSelect=async(c)=>{
      if(!c)return;
      if(c.messages&&c.messages.length>0){setSel(c);return;}
      setSel(c);
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/whatsapp/conversations/${c.id}/messages`,{headers:{Authorization:`Bearer ${token}`}});
        const msgs=await r.json();
        const loaded={...c,messages:Array.isArray(msgs)?msgs.map(m=>({from:m.from,text:m.text,time:new Date(m.sentAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})})):[]};
        setSel(loaded);
      }catch{}
    };
    const send=async()=>{if(!msg.trim()||!sel)return;const text=msg;setMsg("");const nm={from:"me",text,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})};setConvos(prev=>prev.map(c=>c.id===sel.id?{...c,messages:[...c.messages,nm],last:text,unread:0}:c));setSel(prev=>({...prev,messages:[...prev.messages,nm]}));try{let ph=sel.phone.replace(/\D/g,"");if(!ph.startsWith("55"))ph="55"+ph;await fetch(`${API}/api/workspaces/${workspace.id}/whatsapp/send`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({phone:ph,message:text})});}catch(e){console.error("Erro WA:",e);}};
    const suggestReply=async()=>{setAiSugL(true);setAiSug(null);const last=sel.messages.filter(m=>m.from==="lead").slice(-1)[0];try{const r=await fetch(`${API}/api/ai/analyze`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Vendedor respondendo cliente no WhatsApp. Sugira 3 respostas curtas e eficazes para: "${last?.text||"primeiro contato"}". Retorne SOMENTE JSON: {"sugestoes":["resp1","resp2","resp3"]}`}]})});const d=await r.json();setAiSug(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()).sugestoes);}catch{setAiSug(["Oi! Obrigado pelo contato. Podemos falar agora?","Claro! Me conta mais sobre sua necessidade.","Perfeito! Vou te passar todos os detalhes."]);}setAiSugL(false);};
    return(
      <Pg title="WhatsApp" sub={`${unreadWA} mensagens não lidas · ${convos.length} conversas`}>
        <div style={{...card,padding:0,overflow:"hidden",display:"flex",height:"calc(100vh - 160px)"}}>
          <div style={{width:240,borderRight:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.text}}>Conversas</div>
            {convos.map(c=>(
              <div key={c.id} onClick={()=>{loadAndSelect(c);setConvos(prev=>prev.map(x=>x.id===c.id?{...x,unread:0}:x));setAiSug(null);}} style={{display:"flex",gap:10,padding:"11px 14px",cursor:"pointer",background:sel?.id===c.id?C.light:"white",borderBottom:`1px solid ${C.light}`,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",flexShrink:0}}>{c.avatar}</div>
                <div style={{flex:1,minWidth:0}}><Row mb={2}><span style={{fontSize:12,fontWeight:600,color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lead}</span><span style={{fontSize:10,color:C.muted,flexShrink:0}}>{c.time}</span></Row><div style={{fontSize:11,color:C.slate,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.last}</div></div>
                {c.unread>0&&<div style={{width:18,height:18,borderRadius:"50%",background:C.green,color:"white",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{c.unread}</div>}
              </div>
            ))}
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:sel?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white"}}>{sel?.avatar}</div>
              <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{sel?.lead}</div><div style={{fontSize:11,color:C.muted}}>{sel?.phone}</div></div>
              <div style={{marginLeft:"auto"}}><button onClick={suggestReply} disabled={aiSugL} style={{background:C.blueBg,color:C.blue,border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>{aiSugL?"...":"✦ Sugerir resposta"}</button></div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8,background:"#f0f0f0"}}>
              {sel?.messages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.from==="me"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"70%",background:m.from==="me"?"#dcf8c6":"white",borderRadius:m.from==="me"?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"8px 12px",boxShadow:"0 1px 2px rgba(0,0,0,0.08)"}}>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{m.text}</div>
                    <div style={{fontSize:10,color:C.muted,textAlign:"right",marginTop:3}}>{m.time}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef}/>
            </div>
            {aiSug&&(<div style={{padding:"10px 14px",background:C.blueBg,borderTop:`1px solid ${C.border}`}}><div style={{fontSize:11,fontWeight:600,color:C.blueTx,marginBottom:8}}>✦ Sugestões de resposta por IA:</div><div style={{display:"flex",flexDirection:"column",gap:6}}>{aiSug.map((s,i)=><div key={i} onClick={()=>setMsg(s)} style={{background:"white",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.text,cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.background=C.light} onMouseOut={e=>e.currentTarget.style.background="white"}>{s}</div>)}</div></div>)}
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,background:"white"}}>
              <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Digite uma mensagem..." onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,border:`1px solid ${C.border}`,borderRadius:22,padding:"9px 16px",fontSize:13,outline:"none"}}/>
              <button onClick={send} style={{background:C.green,color:"white",border:"none",borderRadius:22,padding:"9px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>Enviar</button>
            </div>
          </div>
        </div>
      </Pg>
    );
  };

  const Automations=()=>{
    const [sel,setSel]=useState(null);const [aiAuto,setAiAuto]=useState(null);const [aiL,setAiL]=useState(false);
    const genAuto=async()=>{setAiL(true);setAiAuto(null);try{const r=await fetch(`${API}/api/ai/analyze`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`Crie 1 nova automação inteligente para um CRM de vendas brasileiro. Retorne SOMENTE JSON: {"name":"nome da automação","trigger":{"tipo":"sem_atividade|novo_lead|score_threshold|sem_avanco","descricao":"descrição do gatilho"},"acoes":[{"tipo":"whatsapp|criar_tarefa|notificar|score|tag","label":"o que fazer"}],"justificativa":"por que essa automação gera resultado"}`}]})});const d=await r.json();setAiAuto(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()));}catch{setAiAuto({error:true});}setAiL(false);};
    return(
      <Pg title="Automações" sub={`${autos.filter(a=>a.active).length} ativas · ${autos.length} cadastradas`}>
        <Row mb={16}><button onClick={genAuto} disabled={aiL} style={{background:C.purple,color:"white",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600,marginLeft:"auto"}}>{aiL?"Gerando...":"✦ Gerar com IA"}</button></Row>
        {aiAuto&&!aiAuto.error&&(
          <div style={{...card,marginBottom:16,border:`1.5px solid ${C.purple}`,background:C.purpleBg}}>
            <Row mb={8}><span style={{fontSize:13,fontWeight:700,color:C.purpleTx}}>✦ Sugestão da IA</span>
            <button onClick={()=>{setAutos(p=>[{id:p.length+1,name:aiAuto.name,active:false,trigger:{type:aiAuto.trigger.tipo},actions:aiAuto.acoes},...p]);setAiAuto(null);}} style={{background:C.purple,color:"white",border:"none",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:600,marginLeft:"auto"}}>+ Adicionar</button>
            <button onClick={()=>setAiAuto(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16}}>✕</button></Row>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>{aiAuto.name}</div>
            <div style={{fontSize:12,color:C.slate,marginBottom:8}}>Gatilho: {aiAuto.trigger?.descricao}</div>
            {aiAuto.acoes?.map((a,i)=><div key={i} style={{fontSize:12,color:C.text,marginBottom:3}}>→ {a.label}</div>)}
            {aiAuto.justificativa&&<div style={{fontSize:12,color:C.purpleTx,marginTop:8,fontStyle:"italic"}}>{aiAuto.justificativa}</div>}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {autos.map(a=>(
            <div key={a.id} style={{...card,cursor:"pointer",opacity:a.active?1:0.65}} onClick={()=>setSel(sel?.id===a.id?null:a)}>
              <Row mb={8}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:2}}>{a.name}</div><div style={{fontSize:12,color:C.slate}}>{TRIGGER_LABELS[a.trigger.type]}{a.trigger.days?` ${a.trigger.days} dias`:""}{a.trigger.stage?` — ${a.trigger.stage}`:""}</div></div><Toggle active={a.active} onToggle={()=>setAutos(p=>p.map(x=>x.id===a.id?{...x,active:!x.active}:x))}/></Row>
              {sel?.id===a.id&&(<div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:12}}><div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:8,letterSpacing:"0.06em"}}>FLUXO DE AÇÕES</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{a.actions.map((act,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6}}>{i>0&&<div style={{width:20,height:1,background:C.border}}/>}<div style={{background:(ACTION_COLORS[act.type]||C.slate)+"18",border:`1px solid ${(ACTION_COLORS[act.type]||C.slate)}40`,borderRadius:8,padding:"7px 12px",fontSize:12,color:ACTION_COLORS[act.type]||C.slate,fontWeight:500}}>{ACTION_ICONS[act.type]} {act.label}</div></div>))}</div></div>)}
            </div>
          ))}
        </div>
      </Pg>
    );
  };

  const MetaAds=()=>{
    const [metaStatus,setMetaStatus]=useState({connected:false,adAccounts:[],connectedAt:null});
    const [campaigns,setCampaigns]=useState([]);
    const [loadingCamp,setLoadingCamp]=useState(false);
    const [selectedAccount,setSelectedAccount]=useState("");
    const [datePreset,setDatePreset]=useState("last_30d");
    const [dateStart,setDateStart]=useState("");
    const [dateEnd,setDateEnd]=useState("");
    const [useCustomDate,setUseCustomDate]=useState(false);
    const [error,setError]=useState("");
    const [sortBy,setSortBy]=useState("spend");
    const [showPaused,setShowPaused]=useState(true);
    const [objective,setObjective]=useState("all");
    // Drill-down
    const [expandedCamp,setExpandedCamp]=useState(null);
    const [adsets,setAdsets]=useState({});
    const [loadingAdsets,setLoadingAdsets]=useState({});
    const [expandedAdset,setExpandedAdset]=useState(null);
    const [ads,setAds]=useState({});
    const [loadingAds,setLoadingAds]=useState({});

    useEffect(()=>{
      fetch(`${API}/api/workspaces/${workspace.id}/meta/status`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{setMetaStatus(d);if(d.connected&&d.adAccounts?.length>0)setSelectedAccount(d.adAccounts[0].id);}).catch(()=>{});
      const params=new URLSearchParams(window.location.search);
      if(params.get("meta")==="connected") window.history.replaceState({},"",window.location.pathname);
    },[]);

    useEffect(()=>{if(metaStatus.connected&&selectedAccount)loadCampaigns();},[metaStatus.connected,selectedAccount,datePreset,useCustomDate]);

    const dateParams=()=>useCustomDate&&dateStart&&dateEnd?`&dateStart=${dateStart}&dateEnd=${dateEnd}`:`&datePreset=${datePreset}`;

    const loadCampaigns=()=>{
      setLoadingCamp(true);setError("");setExpandedCamp(null);setAdsets({});setAds({});
      fetch(`${API}/api/workspaces/${workspace.id}/meta/campaigns?accountId=${selectedAccount}${dateParams()}`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{if(d.error){setError(d.error);return;}setCampaigns(Array.isArray(d)?d:[]);})
        .catch(()=>setError("Erro ao carregar campanhas")).finally(()=>setLoadingCamp(false));
    };

    const toggleCampaign=async(c)=>{
      if(expandedCamp===c.id){setExpandedCamp(null);return;}
      setExpandedCamp(c.id);
      if(adsets[c.id])return;
      setLoadingAdsets(p=>({...p,[c.id]:true}));
      fetch(`${API}/api/workspaces/${workspace.id}/meta/adsets?campaignId=${c.id}${dateParams()}`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{setAdsets(p=>({...p,[c.id]:Array.isArray(d)?d:[]}));})
        .catch(()=>{}).finally(()=>setLoadingAdsets(p=>({...p,[c.id]:false})));
    };

    const toggleAdset=async(adsetId)=>{
      if(expandedAdset===adsetId){setExpandedAdset(null);return;}
      setExpandedAdset(adsetId);
      if(ads[adsetId])return;
      setLoadingAds(p=>({...p,[adsetId]:true}));
      fetch(`${API}/api/workspaces/${workspace.id}/meta/ads?adsetId=${adsetId}${dateParams()}`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{setAds(p=>({...p,[adsetId]:Array.isArray(d)?d:[]}));})
        .catch(()=>{}).finally(()=>setLoadingAds(p=>({...p,[adsetId]:false})));
    };

    const connectMeta=()=>{localStorage.setItem("crm_token",token);window.location.href=`${API}/api/meta/oauth/start?wsId=${workspace.id}&token=${token}`;};
    const disconnectMeta=async()=>{if(!confirm("Deseja desconectar o Meta Ads?"))return;await fetch(`${API}/api/workspaces/${workspace.id}/meta/disconnect`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});setMetaStatus({connected:false,adAccounts:[],connectedAt:null});setCampaigns([]);};

    const ins=(c,key)=>c.insights?.data?.[0]?.[key]||0;
    const getAction=(c,type)=>{const a=(c.insights?.data?.[0]?.actions||[]).find(x=>x.action_type===type);return a?Number(a.value):0;};
    const getROAS=(c)=>{const r=c.insights?.data?.[0]?.website_purchase_roas;return r&&r[0]?Number(r[0].value):0;};
    const getLeads=(c)=>getAction(c,"lead")||getAction(c,"offsite_conversion.fb_pixel_lead");
    const getPurchases=(c)=>getAction(c,"purchase")||getAction(c,"offsite_conversion.fb_pixel_purchase");
    const getConvValue=(c)=>{const v=c.insights?.data?.[0]?.action_values?.find(x=>x.action_type==="purchase");return v?Number(v.value):0;};
    const fmt2=(n)=>n.toLocaleString("pt-BR",{minimumFractionDigits:2});
    const OBJ_LABELS={OUTCOME_LEADS:"Leads",OUTCOME_SALES:"Vendas",OUTCOME_TRAFFIC:"Tráfego",OUTCOME_ENGAGEMENT:"Engajamento",OUTCOME_AWARENESS:"Alcance",OUTCOME_APP_PROMOTION:"App"};
    const DATE_OPTIONS=[{v:"today",l:"Hoje"},{v:"yesterday",l:"Ontem"},{v:"last_7d",l:"7 dias"},{v:"last_30d",l:"30 dias"},{v:"last_90d",l:"90 dias"},{v:"this_month",l:"Este mês"},{v:"last_month",l:"Mês passado"}];

    // Fix bug objetivo: filtra apenas quando selecionado e campaigns tem dados
    const objectives=[...new Set(campaigns.map(c=>c.objective).filter(Boolean))];
    const filtered=campaigns
      .filter(c=>showPaused||c.status==="ACTIVE")
      .filter(c=>objective==="all"||!c.objective||c.objective===objective)
      .sort((a,b)=>{
        if(sortBy==="spend")return Number(ins(b,"spend"))-Number(ins(a,"spend"));
        if(sortBy==="leads")return getLeads(b)-getLeads(a);
        if(sortBy==="purchases")return getPurchases(b)-getPurchases(a);
        if(sortBy==="clicks")return Number(ins(b,"clicks"))-Number(ins(a,"clicks"));
        if(sortBy==="roas")return getROAS(b)-getROAS(a);
        return 0;
      });

    const totSpend=filtered.reduce((a,c)=>a+Number(ins(c,"spend")||0),0);
    const totLeads=filtered.reduce((a,c)=>a+getLeads(c),0);
    const totPurchases=filtered.reduce((a,c)=>a+getPurchases(c),0);
    const totClicks=filtered.reduce((a,c)=>a+Number(ins(c,"clicks")||0),0);
    const totImpressions=filtered.reduce((a,c)=>a+Number(ins(c,"impressions")||0),0);
    const totReach=filtered.reduce((a,c)=>a+Number(ins(c,"reach")||0),0);
    const totConvValue=filtered.reduce((a,c)=>a+getConvValue(c),0);
    const avgCPL=totLeads>0?totSpend/totLeads:0;
    const avgCPA=totPurchases>0?totSpend/totPurchases:0;
    const avgROAS=totSpend>0?totConvValue/totSpend:0;
    const avgCPM=totImpressions>0?(totSpend/totImpressions)*1000:0;
    const avgCTR=totImpressions>0?(totClicks/totImpressions)*100:0;
    const avgCPC=totClicks>0?totSpend/totClicks:0;

    const MetricRow=({item,level=0})=>{
      const spend=Number(ins(item,"spend")||0);
      const leads=getLeads(item);
      const purchases=getPurchases(item);
      const clicks=Number(ins(item,"clicks")||0);
      const impressions=Number(ins(item,"impressions")||0);
      const reach=Number(ins(item,"reach")||0);
      const cpl=leads>0?spend/leads:0;
      const cpa=purchases>0?spend/purchases:0;
      const cpc=clicks>0?spend/clicks:0;
      const cpm=impressions>0?(spend/impressions)*1000:0;
      const ctr=impressions>0?(clicks/impressions)*100:0;
      const roas=getROAS(item);
      const active=item.status==="ACTIVE";
      const isExpC=level===0&&expandedCamp===item.id;
      const isExpA=level===1&&expandedAdset===item.id;
      const isExp=level===0?isExpC:level===1?isExpA:false;
      const toggle=level===0?()=>toggleCampaign(item):level===1?()=>toggleAdset(item.id):null;
      const bg=level===0?"white":level===1?"#f8faff":"#f0f4ff";
      const indent=level*20;
      return(
        <tr style={{borderBottom:`1px solid ${C.light}`,background:isExp?C.light:bg,opacity:active?1:0.65,cursor:toggle?"pointer":"default"}} onClick={toggle} onMouseOver={e=>e.currentTarget.style.background=C.light} onMouseOut={e=>e.currentTarget.style.background=isExp?C.light:bg}>
          <td style={{padding:"9px 12px",fontWeight:level===0?600:500,color:C.text,maxWidth:220}}>
            <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:indent}}>
              {toggle&&<span style={{fontSize:10,color:C.muted,flexShrink:0}}>{isExp?"▼":"▶"}</span>}
              {level===2&&item.creative?.thumbnail_url&&<img src={item.creative.thumbnail_url} style={{width:28,height:28,borderRadius:4,objectFit:"cover",flexShrink:0}}/>}
              <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={item.name}>{item.name}</div>
            </div>
          </td>
          {level===0&&<td style={{padding:"9px 12px"}}><span style={{background:C.purpleBg,color:C.purpleTx,borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:600}}>{OBJ_LABELS[item.objective]||item.objective||"—"}</span></td>}
          {level>0&&<td style={{padding:"9px 12px",fontSize:11,color:C.muted}}>{level===1?"Conjunto":"Anúncio"}</td>}
          <td style={{padding:"9px 12px"}}><span style={{background:active?C.greenBg:C.light,color:active?C.greenTx:C.slate,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>{active?"Ativa":"Pausada"}</span></td>
          <td style={{padding:"9px 12px",fontWeight:600,color:spend>0?C.amber:C.muted,whiteSpace:"nowrap"}}>{spend>0?`R$ ${fmt2(spend)}`:"—"}</td>
          <td style={{padding:"9px 12px",fontWeight:700,color:leads>0?C.blue:C.muted}}>{leads||"—"}</td>
          <td style={{padding:"9px 12px",fontWeight:700,color:purchases>0?C.green:C.muted}}>{purchases||"—"}</td>
          <td style={{padding:"9px 12px",color:roas>=2?C.green:roas>0?C.amber:C.muted,fontWeight:600}}>{roas>0?`${roas.toFixed(2)}×`:"—"}</td>
          <td style={{padding:"9px 12px",color:C.text}}>{clicks>0?clicks.toLocaleString("pt-BR"):"—"}</td>
          <td style={{padding:"9px 12px",color:ctr>=1?C.green:ctr>0?C.amber:C.muted}}>{ctr>0?`${ctr.toFixed(2)}%`:"—"}</td>
          <td style={{padding:"9px 12px",color:C.text}}>{cpc>0?`R$ ${cpc.toFixed(2)}`:"—"}</td>
          <td style={{padding:"9px 12px",color:C.text}}>{cpl>0?`R$ ${cpl.toFixed(2)}`:"—"}</td>
          <td style={{padding:"9px 12px",color:C.text}}>{cpa>0?`R$ ${cpa.toFixed(2)}`:"—"}</td>
          <td style={{padding:"9px 12px",color:C.muted}}>{cpm>0?`R$ ${cpm.toFixed(2)}`:"—"}</td>
          <td style={{padding:"9px 12px",color:C.muted}}>{reach>0?reach.toLocaleString("pt-BR"):"—"}</td>
        </tr>
      );
    };

    if(!metaStatus.connected){
      return(
        <Pg title="Meta Ads" sub="Conecte sua conta para ver campanhas em tempo real">
          <div style={{...card,textAlign:"center",padding:60,maxWidth:500,margin:"0 auto"}}>
            <div style={{fontSize:48,marginBottom:20}}>📢</div>
            <h3 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:12}}>Conecte sua conta Meta Ads</h3>
            <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:32}}>Visualize campanhas, conjuntos, anúncios e métricas em tempo real.</p>
            <button onClick={connectMeta} style={{background:"#1877f2",color:"white",border:"none",borderRadius:10,padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:10}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Conectar com Facebook
            </button>
          </div>
        </Pg>
      );
    }

    return(
      <Pg title="Meta Ads" sub="Dados em tempo real · Clique em uma campanha para ver conjuntos e anúncios">
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:C.greenBg,border:`1px solid ${C.green}`,borderRadius:8,padding:"6px 12px",flexShrink:0}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/><span style={{fontSize:12,color:C.greenTx,fontWeight:600}}>Conectado</span>
          </div>
          {metaStatus.adAccounts?.length>0&&(
            <select value={selectedAccount} onChange={e=>{setSelectedAccount(e.target.value);}} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,background:"white",outline:"none",color:C.text,minWidth:160}}>
              {metaStatus.adAccounts.map(a=><option key={a.id} value={a.id}>{a.name||a.id}</option>)}
            </select>
          )}
          {/* Período */}
          <select value={useCustomDate?"custom":datePreset} onChange={e=>{if(e.target.value==="custom"){setUseCustomDate(true);}else{setUseCustomDate(false);setDatePreset(e.target.value);}}} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,background:"white",outline:"none",color:C.text}}>
            {DATE_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            <option value="custom">Personalizado</option>
          </select>
          {useCustomDate&&<>
            <input type="date" value={dateStart} onChange={e=>setDateStart(e.target.value)} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none"}}/>
            <span style={{fontSize:13,color:C.muted}}>até</span>
            <input type="date" value={dateEnd} onChange={e=>setDateEnd(e.target.value)} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none"}}/>
            <button onClick={loadCampaigns} disabled={!dateStart||!dateEnd} style={{background:C.green,color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:13,cursor:"pointer",fontWeight:600,opacity:(!dateStart||!dateEnd)?0.5:1}}>Aplicar</button>
          </>}
          {/* Objetivo */}
          <select value={objective} onChange={e=>setObjective(e.target.value)} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,background:"white",outline:"none",color:C.text}}>
            <option value="all">Todos objetivos</option>
            {objectives.map(o=><option key={o} value={o}>{OBJ_LABELS[o]||o}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,background:"white",outline:"none",color:C.text}}>
            <option value="spend">↓ Investimento</option>
            <option value="leads">↓ Leads</option>
            <option value="purchases">↓ Compras</option>
            <option value="clicks">↓ Cliques</option>
            <option value="roas">↓ ROAS</option>
          </select>
          <label style={{display:"flex",alignItems:"center",gap:5,fontSize:13,color:C.slate,cursor:"pointer"}}>
            <input type="checkbox" checked={showPaused} onChange={e=>setShowPaused(e.target.checked)} style={{accentColor:C.green}}/> Pausadas
          </label>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <button onClick={loadCampaigns} style={{background:C.light,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:C.slate}}>↻</button>
            <button onClick={disconnectMeta} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,color:C.muted,cursor:"pointer"}}>Desconectar</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[
            {l:"Investimento",v:`R$ ${fmt2(totSpend)}`,c:C.amber,s:""},
            {l:"Leads",v:totLeads||"—",c:C.blue,s:avgCPL>0?`CPL R$ ${avgCPL.toFixed(2)}`:""},
            {l:"Compras",v:totPurchases||"—",c:C.green,s:avgCPA>0?`CPA R$ ${avgCPA.toFixed(2)}`:""},
            {l:"ROAS",v:avgROAS>0?`${avgROAS.toFixed(2)}×`:"—",c:avgROAS>=2?C.green:avgROAS>0?C.amber:C.muted,s:totConvValue>0?`R$ ${fmt2(totConvValue)}`:""},
            {l:"Cliques",v:totClicks.toLocaleString("pt-BR"),c:C.purple,s:avgCPC>0?`CPC R$ ${avgCPC.toFixed(2)}`:""},
            {l:"Impressões",v:totImpressions>0?totImpressions.toLocaleString("pt-BR"):"—",c:C.slate,s:avgCPM>0?`CPM R$ ${avgCPM.toFixed(2)}`:""},
            {l:"Alcance",v:totReach>0?totReach.toLocaleString("pt-BR"):"—",c:C.slate,s:""},
            {l:"CTR",v:avgCTR>0?`${avgCTR.toFixed(2)}%`:"—",c:avgCTR>=1?C.green:avgCTR>0?C.amber:C.muted,s:""},
          ].map((k,i)=>(
            <div key={i} style={card}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{k.l}</div>
              <div style={{fontSize:18,fontWeight:700,color:k.c,margin:"2px 0"}}>{k.v}</div>
              {k.s&&<div style={{fontSize:11,color:C.muted}}>{k.s}</div>}
            </div>
          ))}
        </div>

        {error&&<div style={{background:C.redBg,color:C.redTx,borderRadius:8,padding:"12px 16px",marginBottom:14,fontSize:13}}>⚠ {error}</div>}

        {/* Tabela com drill-down */}
        <div style={{...card,padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:600,color:C.text,fontSize:13}}>
              Campanhas <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({filtered.length})</span>
              <span style={{fontSize:11,color:C.muted,fontWeight:400,marginLeft:8}}>▶ Clique para ver conjuntos e anúncios</span>
            </div>
            {loadingCamp&&<span style={{fontSize:12,color:C.muted}}>⟳ Carregando...</span>}
          </div>
          {filtered.length===0&&!loadingCamp&&<div style={{padding:40,textAlign:"center",color:C.muted,fontSize:14}}>Nenhuma campanha encontrada.</div>}
          {filtered.length>0&&(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:C.light}}>
                    {["Campanha/Conjunto/Anúncio","Objetivo","Status","Investido","Leads","Compras","ROAS","Cliques","CTR","CPC","CPL","CPA","CPM","Alcance"].map(h=>(
                      <th key={h} style={{padding:"8px 12px",textAlign:"left",color:C.slate,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c=>(
                    <>
                      <MetricRow key={c.id} item={c} level={0}/>
                      {expandedCamp===c.id&&(
                        loadingAdsets[c.id]
                          ?<tr key={`load-${c.id}`}><td colSpan={14} style={{padding:"12px 32px",color:C.muted,fontSize:12}}>⟳ Carregando conjuntos...</td></tr>
                          :(adsets[c.id]||[]).map(as=>(
                            <>
                              <MetricRow key={as.id} item={as} level={1}/>
                              {expandedAdset===as.id&&(
                                loadingAds[as.id]
                                  ?<tr key={`load-ads-${as.id}`}><td colSpan={14} style={{padding:"12px 52px",color:C.muted,fontSize:12}}>⟳ Carregando anúncios...</td></tr>
                                  :(ads[as.id]||[]).map(ad=><MetricRow key={ad.id} item={ad} level={2}/>)
                              )}
                            </>
                          ))
                      )}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:"#f1f5f9",borderTop:`2px solid ${C.border}`,fontWeight:700,fontSize:12}}>
                    <td style={{padding:"9px 12px",color:C.text}}>TOTAL ({filtered.length})</td>
                    <td/><td/>
                    <td style={{padding:"9px 12px",color:C.amber,whiteSpace:"nowrap"}}>R$ {fmt2(totSpend)}</td>
                    <td style={{padding:"9px 12px",color:C.blue}}>{totLeads||"—"}</td>
                    <td style={{padding:"9px 12px",color:C.green}}>{totPurchases||"—"}</td>
                    <td style={{padding:"9px 12px",color:avgROAS>=2?C.green:C.amber}}>{avgROAS>0?`${avgROAS.toFixed(2)}×`:"—"}</td>
                    <td style={{padding:"9px 12px",color:C.text}}>{totClicks.toLocaleString("pt-BR")}</td>
                    <td style={{padding:"9px 12px",color:C.text}}>{avgCTR>0?`${avgCTR.toFixed(2)}%`:"—"}</td>
                    <td style={{padding:"9px 12px",color:C.text}}>{avgCPC>0?`R$ ${avgCPC.toFixed(2)}`:"—"}</td>
                    <td style={{padding:"9px 12px",color:C.text}}>{avgCPL>0?`R$ ${avgCPL.toFixed(2)}`:"—"}</td>
                    <td style={{padding:"9px 12px",color:C.text}}>{avgCPA>0?`R$ ${avgCPA.toFixed(2)}`:"—"}</td>
                    <td style={{padding:"9px 12px",color:C.text}}>{avgCPM>0?`R$ ${avgCPM.toFixed(2)}`:"—"}</td>
                    <td style={{padding:"9px 12px",color:C.muted}}>{totReach>0?totReach.toLocaleString("pt-BR"):"—"}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Pg>
    );
  };

  const Reports=()=>{
    const [repData,setRepData]=useState(null);
    const [forecast,setForecast]=useState(null);
    const [period,setPeriod]=useState("30");
    const [loading,setLoading]=useState(true);
    const [activeTab,setActiveTab]=useState("overview");

    useEffect(()=>{
      setLoading(true);
      const h={Authorization:`Bearer ${token}`};
      Promise.all([
        fetch(`${API}/api/workspaces/${workspace.id}/reports/kpis`,{headers:h}).then(r=>r.json()),
        fetch(`${API}/api/workspaces/${workspace.id}/reports/leads-by-day`,{headers:h}).then(r=>r.json()).catch(()=>[]),
        fetch(`${API}/api/workspaces/${workspace.id}/reports/forecast`,{headers:h}).then(r=>r.json()).catch(()=>null),
      ]).then(([kpis,byDay,fc])=>{setRepData({kpis,byDay:Array.isArray(byDay)?byDay:[]});setForecast(fc);setLoading(false);});
    },[period]);

    const stageData=STAGES.map(s=>({name:s,value:leads.filter(l=>l.stage===s).length,val:leads.filter(l=>l.stage===s).reduce((a,l)=>a+l.value,0)}));
    const sourceData=Object.entries(leads.reduce((a,l)=>{const s=l.source||"Outros";a[s]=(a[s]||0)+1;return a;},{})).map(([n,v])=>({n,v})).sort((a,b)=>b.v-a.v);
    const srcColors=[C.blue,C.green,C.amber,C.purple,C.slate,C.red];
    const totalLeads=leads.length;
    const closedLeads=leads.filter(l=>l.stage==="Fechado").length;
    const closedValue=leads.filter(l=>l.stage==="Fechado").reduce((a,l)=>a+l.value,0);
    const convRate=totalLeads>0?((closedLeads/totalLeads)*100).toFixed(1):0;
    const avgTicket=closedLeads>0?Math.round(closedValue/closedLeads):0;
    const avgScore=totalLeads>0?Math.round(leads.reduce((a,l)=>a+(l.score||50),0)/totalLeads):0;
    const pipeVal=leads.filter(l=>l.stage!=="Fechado").reduce((a,l)=>a+l.value,0);

    // Score distribution
    const scoreDist=[
      {l:"Quente (75-100)",v:leads.filter(l=>(l.score||50)>=75).length,c:C.green},
      {l:"Morno (50-74)",v:leads.filter(l=>(l.score||50)>=50&&(l.score||50)<75).length,c:C.amber},
      {l:"Frio (0-49)",v:leads.filter(l=>(l.score||50)<50).length,c:C.red},
    ];

    if(loading)return<Pg title="Relatórios" sub="Carregando..."><div style={{textAlign:"center",padding:60,color:C.muted}}>⟳</div></Pg>;

    return(
      <Pg title="Relatórios" sub="Análise completa do seu negócio">
        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:"white",padding:4,borderRadius:10,border:`1px solid ${C.border}`,width:"fit-content"}}>
          {[{v:"overview",l:"📊 Visão Geral"},{v:"forecast",l:"🎯 Forecasting"},{v:"funnel",l:"🔀 Funil"}].map(t=>(
            <button key={t.v} onClick={()=>setActiveTab(t.v)} style={{padding:"7px 18px",borderRadius:7,border:"none",background:activeTab===t.v?C.green:"transparent",color:activeTab===t.v?"white":C.slate,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.15s"}}>{t.l}</button>
          ))}
        </div>

        {/* Filtro período */}
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          {[{v:"7",l:"7 dias"},{v:"30",l:"30 dias"},{v:"90",l:"90 dias"},{v:"365",l:"12 meses"}].map(o=>(
            <button key={o.v} onClick={()=>setPeriod(o.v)} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${period===o.v?C.green:C.border}`,background:period===o.v?C.greenBg:"white",color:period===o.v?C.greenTx:C.slate,cursor:"pointer",fontSize:12,fontWeight:600}}>{o.l}</button>
          ))}
        </div>

        {/* ── FORECASTING TAB ── */}
        {activeTab==="forecast"&&forecast&&(
          <div>
            {/* KPIs forecast */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
              {[
                {l:"Previsão de receita",v:`R$ ${Math.round(forecast.forecastTotal).toLocaleString("pt-BR")}`,s:"Pipeline ponderado",c:C.purple,icon:"🎯"},
                {l:"Fechado este mês",v:`R$ ${forecast.closedValue.toLocaleString("pt-BR")}`,s:forecast.closedLastValue>0?`vs R$ ${forecast.closedLastValue.toLocaleString("pt-BR")} mês ant.`:"Mês atual",c:C.green,icon:"✅"},
                {l:"Pipeline total",v:`R$ ${forecast.totalPipeline.toLocaleString("pt-BR")}`,s:"Sem ponderação",c:C.blue,icon:"💼"},
                {l:"Fechados (30 dias)",v:forecast.recentClosedCount,s:"negócios fechados",c:C.amber,icon:"🏆"},
              ].map((k,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{k.l}</span>
                    <span style={{fontSize:18}}>{k.icon}</span>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,color:k.c,letterSpacing:"-0.5px",margin:"4px 0"}}>{k.v}</div>
                  <div style={{fontSize:11,color:C.slate}}>{k.s}</div>
                </div>
              ))}
            </div>

            {/* Pipeline ponderado por etapa */}
            <div style={card}>
              <STitle>Pipeline ponderado por probabilidade de fechamento</STitle>
              <p style={{fontSize:12,color:C.muted,marginBottom:16}}>Cada etapa tem uma probabilidade estimada de conversão. O valor ponderado é o que realmente conta para a previsão.</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {Object.entries(forecast.byStage).filter(([s])=>s!=="Fechado").map(([stage,data])=>{
                  const pct=Math.round(data.prob*100);
                  const stageColor=SC[stage]?.c||C.slate;
                  const barWidth=forecast.totalPipeline>0?Math.round((data.total/forecast.totalPipeline)*100):0;
                  return(
                    <div key={stage} style={{display:"grid",gridTemplateColumns:"130px 1fr 100px 120px 110px",alignItems:"center",gap:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:stageColor,flexShrink:0}}/>
                        <span style={{fontSize:12,color:C.text,fontWeight:500}}>{stage}</span>
                      </div>
                      <div style={{background:C.light,borderRadius:4,height:16,overflow:"hidden"}}>
                        <div style={{width:`${barWidth}%`,background:stageColor,height:"100%",borderRadius:4,opacity:0.7}}/>
                      </div>
                      <div style={{textAlign:"right",fontSize:12,color:C.muted}}>{data.count} leads</div>
                      <div style={{textAlign:"right",fontSize:12,color:C.text,fontWeight:600}}>R$ {data.total.toLocaleString("pt-BR")}</div>
                      <div style={{textAlign:"right"}}>
                        <span style={{background:C.purpleBg,color:C.purpleTx,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{pct}% → R$ {Math.round(data.weighted).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Total ponderado */}
              <div style={{marginTop:16,paddingTop:14,borderTop:`2px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>Previsão total ponderada</span>
                <span style={{fontSize:20,fontWeight:800,color:C.purple}}>R$ {Math.round(forecast.forecastTotal).toLocaleString("pt-BR")}</span>
              </div>
            </div>

            {/* Comparativo meses */}
            {(forecast.closedValue>0||forecast.closedLastValue>0)&&(
              <div style={{...card,marginTop:14}}>
                <STitle>Comparativo mensal</STitle>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:12}}>
                  {[{l:"Mês passado",v:forecast.closedLastValue,c:C.slate},{l:"Este mês",v:forecast.closedValue,c:C.green}].map((m,i)=>(
                    <div key={i}>
                      <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{m.l}</div>
                      <div style={{fontSize:24,fontWeight:800,color:m.c}}>R$ {m.v.toLocaleString("pt-BR")}</div>
                      <div style={{marginTop:8,background:C.light,borderRadius:4,height:8,overflow:"hidden"}}>
                        <div style={{width:`${Math.max(forecast.closedLastValue,forecast.closedValue)>0?Math.round((m.v/Math.max(forecast.closedLastValue,forecast.closedValue))*100):0}%`,background:m.c,height:"100%",borderRadius:4}}/>
                      </div>
                    </div>
                  ))}
                </div>
                {forecast.closedLastValue>0&&(
                  <div style={{marginTop:12,fontSize:13,color:forecast.closedValue>=forecast.closedLastValue?C.green:C.red,fontWeight:600}}>
                    {forecast.closedValue>=forecast.closedLastValue?"📈":"📉"} {forecast.closedLastValue>0?`${Math.round(((forecast.closedValue-forecast.closedLastValue)/forecast.closedLastValue)*100)}% vs mês anterior`:""}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab==="forecast"&&!forecast&&(
          <div style={{...card,textAlign:"center",padding:40,color:C.muted}}>Nenhum dado de forecast disponível ainda.</div>
        )}

        {/* ── VISÃO GERAL TAB ── */}
        {activeTab==="overview"&&(
          <div>
          {[
            {l:"Total de leads",v:totalLeads,s:"no CRM",c:C.blue},
            {l:"Receita fechada",v:`R$ ${closedValue.toLocaleString("pt-BR")}`,s:`${closedLeads} clientes`,c:C.green},
            {l:"Pipeline",v:`R$ ${(pipeVal/1000).toFixed(0)}K`,s:"em negociação",c:C.purple},
            {l:"Taxa de conversão",v:`${convRate}%`,s:`Ticket médio R$ ${avgTicket.toLocaleString("pt-BR")}`,c:Number(convRate)>=20?C.green:C.amber},
          ].map((k,i)=>(
            <div key={i} style={card}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{k.l}</div>
              <div style={{fontSize:24,fontWeight:800,color:k.c,letterSpacing:"-0.5px",margin:"4px 0"}}>{k.v}</div>
              <div style={{fontSize:11,color:C.slate}}>{k.s}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
          {/* Leads por dia */}
          <div style={card}>
            <STitle>Captação de leads por dia</STitle>
            {repData?.byDay?.length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={repData.byDay} barSize={8}>
                  <XAxis dataKey="day" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} interval={Math.floor(repData.byDay.length/6)}/>
                  <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}} formatter={v=>[v,"Leads"]}/>
                  <Bar dataKey="count" fill={C.green} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ):<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>Nenhum lead no período</div>}
          </div>
          {/* Distribuição de score */}
          <div style={card}>
            <STitle>Qualidade dos leads</STitle>
            <div style={{margin:"16px 0",display:"flex",flexDirection:"column",gap:12}}>
              {scoreDist.map(s=>(
                <div key={s.l}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:C.slate}}>{s.l}</span>
                    <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}</span>
                  </div>
                  <div style={{background:C.light,borderRadius:4,height:8,overflow:"hidden"}}>
                    <div style={{width:`${totalLeads>0?Math.round((s.v/totalLeads)*100):0}%`,background:s.c,height:"100%",borderRadius:4,transition:"width 0.5s"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.light}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:C.muted}}>Score médio</span>
                <span style={{fontSize:14,fontWeight:700,color:avgScore>=70?C.green:avgScore>=50?C.amber:C.red}}>{avgScore}/100</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {/* Funil de conversão */}
          <div style={card}>
            <STitle>Funil de conversão por etapa</STitle>
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
              {stageData.map((s,i)=>{
                const prev=i>0?stageData[i-1].value:null;
                const pct=prev&&prev>0?Math.round((s.value/prev)*100):null;
                const stageColor=SC[s.name]?.c||C.slate;
                return(
                  <div key={s.name} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:C.slate,width:90,flexShrink:0}}>{s.name}</span>
                    <div style={{flex:1,background:C.light,borderRadius:4,height:22,overflow:"hidden"}}>
                      <div style={{width:`${totalLeads>0?Math.max((s.value/totalLeads)*100,s.value>0?6:0):0}%`,background:stageColor,height:"100%",display:"flex",alignItems:"center",paddingLeft:6}}>
                        {s.value>0&&<span style={{color:"white",fontSize:10,fontWeight:700}}>{s.value}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:11,color:C.muted,width:70,textAlign:"right",flexShrink:0}}>R$ {(s.val/1000).toFixed(0)}K</span>
                    {pct!==null&&<span style={{fontSize:11,fontWeight:700,color:pct>=50?C.green:pct>=25?C.amber:C.red,width:50,textAlign:"right",flexShrink:0}}>{pct}%</span>}
                    {pct===null&&<span style={{width:50}}/>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Origem dos leads */}
          <div style={card}>
            <STitle>Leads por origem</STitle>
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
              {sourceData.slice(0,7).map((s,i)=>(
                <div key={s.n} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:srcColors[i%srcColors.length],flexShrink:0}}/>
                  <span style={{fontSize:12,color:C.slate,flex:1}}>{s.n}</span>
                  <div style={{flex:2,background:C.light,borderRadius:4,height:8,overflow:"hidden"}}>
                    <div style={{width:`${totalLeads>0?Math.round((s.v/totalLeads)*100):0}%`,background:srcColors[i%srcColors.length],height:"100%",borderRadius:4}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:C.text,width:28,textAlign:"right"}}>{s.v}</span>
                  <span style={{fontSize:11,color:C.muted,width:32,textAlign:"right"}}>{totalLeads>0?Math.round((s.v/totalLeads)*100):0}%</span>
                </div>
              ))}
              {sourceData.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>Nenhum dado</div>}
            </div>
          </div>
        </div>

        {/* Tabela resumo */}
        <div style={{...card,padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}><STitle>Resumo executivo</STitle></div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <tbody>
              {[
                {l:"Total de leads no CRM",v:totalLeads,c:C.text},
                {l:"Leads fechados (clientes)",v:closedLeads,c:C.green},
                {l:"Taxa de conversão geral",v:`${convRate}%`,c:Number(convRate)>=20?C.green:C.amber},
                {l:"Receita total fechada",v:`R$ ${closedValue.toLocaleString("pt-BR")}`,c:C.green},
                {l:"Ticket médio",v:`R$ ${avgTicket.toLocaleString("pt-BR")}`,c:C.text},
                {l:"Pipeline em aberto",v:`R$ ${pipeVal.toLocaleString("pt-BR")}`,c:C.purple},
                {l:"Score médio dos leads",v:`${avgScore}/100`,c:avgScore>=70?C.green:avgScore>=50?C.amber:C.red},
                {l:"Automações ativas",v:autos.filter(a=>a.active).length,c:C.blue},
                {l:"Tarefas atrasadas",v:overdue,c:overdue===0?C.green:C.red},
              ].map((k,i,arr)=>(
                <tr key={i} style={{borderBottom:i<arr.length-1?`1px solid ${C.light}`:"none",background:i%2===0?"white":C.light}}>
                  <td style={{padding:"11px 16px",color:C.text}}>{k.l}</td>
                  <td style={{padding:"11px 16px",fontWeight:700,color:k.c,textAlign:"right"}}>{k.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>)} {/* end overview tab */}

        {/* ── FUNIL TAB ── */}
        {activeTab==="funnel"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
              {[
                {l:"Total leads",v:totalLeads,c:C.blue},
                {l:"Tx. conversão",v:`${convRate}%`,c:Number(convRate)>=20?C.green:C.amber},
                {l:"Receita fechada",v:`R$ ${closedValue.toLocaleString("pt-BR")}`,c:C.green},
                {l:"Ticket médio",v:`R$ ${avgTicket.toLocaleString("pt-BR")}`,c:C.purple},
              ].map((k,i)=>(
                <div key={i} style={card}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{k.l}</div>
                  <div style={{fontSize:22,fontWeight:800,color:k.c,margin:"4px 0"}}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={card}>
                <STitle>Funil por etapa — volume e valor</STitle>
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:12}}>
                  {stageData.map((s,i)=>{
                    const prev=i>0?stageData[i-1].value:null;
                    const pct=prev&&prev>0?Math.round((s.value/prev)*100):null;
                    const color=SC[s.name]?.c||C.slate;
                    return(
                      <div key={s.name}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{s.name}</span>
                          <div style={{display:"flex",gap:12,alignItems:"center"}}>
                            {pct!==null&&<span style={{fontSize:11,fontWeight:700,color:pct>=50?C.green:pct>=25?C.amber:C.red,background:pct>=50?C.greenBg:pct>=25?C.amberBg:C.redBg,padding:"2px 8px",borderRadius:20}}>{pct}% conv.</span>}
                            <span style={{fontSize:12,fontWeight:700,color:C.text}}>{s.value} leads</span>
                          </div>
                        </div>
                        <div style={{background:C.light,borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
                          <div style={{width:`${totalLeads>0?Math.max((s.value/totalLeads)*100,s.value>0?4:0):0}%`,background:color,height:"100%",borderRadius:6,display:"flex",alignItems:"center",paddingLeft:10,transition:"width 0.5s"}}>
                            {s.value>0&&<span style={{color:"white",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>R$ {(s.val/1000).toFixed(0)}K</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={card}>
                <STitle>Leads por origem</STitle>
                <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
                  {sourceData.slice(0,7).map((s,i)=>(
                    <div key={s.n} style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:srcColors[i%srcColors.length],flexShrink:0}}/>
                      <span style={{fontSize:12,color:C.slate,flex:1}}>{s.n}</span>
                      <div style={{flex:2,background:C.light,borderRadius:4,height:8,overflow:"hidden"}}>
                        <div style={{width:`${totalLeads>0?Math.round((s.v/totalLeads)*100):0}%`,background:srcColors[i%srcColors.length],height:"100%",borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:C.text,width:24,textAlign:"right"}}>{s.v}</span>
                      <span style={{fontSize:11,color:C.muted,width:32,textAlign:"right"}}>{totalLeads>0?Math.round((s.v/totalLeads)*100):0}%</span>
                    </div>
                  ))}
                  {sourceData.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>Nenhum dado</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </Pg>
    );
  };

  const Settings=()=>{
    const members=[{name:"Ana Silva",email:"ana@empresa.com",role:"Admin",avatar:"AS",c:C.green},{name:"Pedro Costa",email:"pedro@empresa.com",role:"Gestor",avatar:"PC",c:C.blue},{name:"Lara Mendes",email:"lara@empresa.com",role:"Vendedor",avatar:"LM",c:C.amber}];
    const [newField,setNewField]=useState({name:"",type:"text",options:""});
    const [savingField,setSavingField]=useState(false);
    const [smtpForm,setSmtpForm]=useState({host:"",port:"465",user:"",pass:"",fromName:""});
    const [savingSmtp,setSavingSmtp]=useState(false);
    const [smtpMsg,setSmtpMsg]=useState("");
    const [formCfg,setFormCfg]=useState({formTitle:"",formSubtitle:"",formFields:["name","email","phone","company","message"],formColor:"#00c896",formThankYou:""});
    const [savingForm,setSavingForm]=useState(false);
    const [formMsg,setFormMsg]=useState("");
    const formLink=`${API}/form/${workspace.id}`;
    const ALL_FIELDS=[{k:"name",l:"Nome"},{k:"email",l:"E-mail"},{k:"phone",l:"Telefone"},{k:"company",l:"Empresa"},{k:"message",l:"Mensagem"}];

    useEffect(()=>{
      fetch(`${API}/api/workspaces/${workspace.id}/email/config`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{if(d.host)setSmtpForm({host:d.host,port:String(d.port||465),user:d.user,pass:"",fromName:d.fromName});}).catch(()=>{});
      fetch(`${API}/api/form/${workspace.id}`)
        .then(r=>r.json()).then(d=>{setFormCfg(p=>({...p,formTitle:d.formTitle||"",formSubtitle:d.formSubtitle||"",formColor:d.formColor||"#00c896",formThankYou:d.formThankYou||"",formFields:d.formFields||["name","email","phone","company","message"]}));}).catch(()=>{});
    },[]);
    const [arCfg,setArCfg]=useState({enabled:false,messages:{welcome:"",protocol:"",guarantee:"",followup24h:"",followup48h:""},escalationWords:""});
    const [savingAr,setSavingAr]=useState(false);
    const [arMsg,setArMsg]=useState("");
    useEffect(()=>{
      fetch(`${API}/api/workspaces/${workspace.id}/autoresponder`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{if(d&&d.messages)setArCfg({enabled:d.enabled||false,messages:d.messages,escalationWords:(d.escalationWords||[]).join(", ")});}).catch(()=>{});
    },[]);
    const saveAr=async()=>{
      setSavingAr(true);setArMsg("");
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/autoresponder`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({...arCfg,escalationWords:arCfg.escalationWords.split(",").map(w=>w.trim()).filter(Boolean)})});
        if(r.ok)setArMsg("✓ Salvo!");else setArMsg("✗ Erro ao salvar");
      }catch{setArMsg("✗ Erro ao salvar");}
      setSavingAr(false);
    };
    const saveSmtp=async()=>{
      setSavingSmtp(true);setSmtpMsg("");
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/email/config`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(smtpForm)});
        if(r.ok)setSmtpMsg("✓ Configuração salva!");else setSmtpMsg("✗ Erro ao salvar");
      }catch{setSmtpMsg("✗ Erro ao salvar");}
      setSavingSmtp(false);
    };
    const saveForm=async()=>{
      setSavingForm(true);setFormMsg("");
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/form/config`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(formCfg)});
        if(r.ok)setFormMsg("✓ Formulário salvo!");else setFormMsg("✗ Erro ao salvar");
      }catch{setFormMsg("✗ Erro ao salvar");}
      setSavingForm(false);
    };
    const toggleField=(k)=>setFormCfg(p=>({...p,formFields:p.formFields.includes(k)?p.formFields.filter(f=>f!==k):[...p.formFields,k]}));
    const addField=async()=>{
      if(!newField.name.trim())return;
      setSavingField(true);
      try{
        const payload={name:newField.name,type:newField.type,options:newField.type==="select"?newField.options.split(",").map(o=>o.trim()).filter(Boolean):null};
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/custom-fields`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
        const d=await r.json();
        if(r.ok){setCustomFields(prev=>[...prev,d]);setNewField({name:"",type:"text",options:""});}
      }catch{}
      setSavingField(false);
    };
    const delField=async(id)=>{
      await fetch(`${API}/api/workspaces/${workspace.id}/custom-fields/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
      setCustomFields(prev=>prev.filter(f=>f.id!==id));
    };
    return(
      <Pg title="Configurações" sub="Workspace e integrações">
        <Grid cols={2} gap={14}>
          <div style={card}><STitle>Workspace</STitle><div style={{marginTop:12}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{width:44,height:44,borderRadius:10,background:workspace.color||C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white"}}>{workspace.name[0]}</div><div><div style={{fontWeight:600,color:C.text}}>{workspace.name}</div><div style={{fontSize:12,color:C.slate}}>Plano {workspace.plan||"Starter"}</div></div></div>{[{l:"Moeda",v:"BRL (R$)"},{l:"Fuso horário",v:"America/Sao_Paulo"},{l:"Idioma",v:"Português (BR)"}].map((f,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.light}`,fontSize:13}}><span style={{color:C.slate}}>{f.l}</span><span style={{color:C.text,fontWeight:500}}>{f.v}</span></div>)}</div></div>
          <div style={card}><STitle>Equipe</STitle><div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>{members.map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:"50%",background:m.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white",flexShrink:0}}>{m.avatar}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.email}</div></div><span style={{background:C.light,color:C.slate,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:500}}>{m.role}</span></div>)}<button style={{marginTop:4,background:"none",border:`1px dashed ${C.border}`,borderRadius:8,padding:"8px",fontSize:12,color:C.slate,cursor:"pointer"}}>+ Convidar membro</button></div></div>
          <div style={card}><STitle>Integrações</STitle><div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>{[{n:"Meta Ads",s:"Conectado",ok:true,icon:"📢"},{n:"WhatsApp",s:"Conectado",ok:true,icon:"💬"},{n:"Google Ads",s:"Desconectado",ok:false,icon:"🔍"},{n:"RD Station",s:"Desconectado",ok:false,icon:"📧"},{n:"Stripe/Pix",s:"Desconectado",ok:false,icon:"💳"}].map((itg,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18,width:28}}>{itg.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.text}}>{itg.n}</div></div><span style={{background:itg.ok?C.greenBg:C.light,color:itg.ok?C.greenTx:C.slate,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:500}}>{itg.s}</span>{!itg.ok&&<button style={{background:C.blueBg,color:C.blue,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>Conectar</button>}</div>)}</div></div>
          <div style={{...card,gridColumn:"1/-1"}}><STitle>Plano e Cobrança</STitle>
            <div style={{marginTop:12,marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:13,color:C.text}}>Plano atual:</span>
              <span style={{background:billing.plan==="free"?C.light:C.greenBg,color:billing.plan==="free"?C.slate:C.greenTx,borderRadius:20,padding:"3px 14px",fontSize:13,fontWeight:700,textTransform:"capitalize"}}>{billing.plan==="free"?"Gratuito":billing.plan}</span>
              {billing.plan!=="free"&&<span style={{fontSize:12,color:C.muted}}>Renova em {billing.renewsAt?new Date(billing.renewsAt).toLocaleDateString("pt-BR"):""}</span>}
              {billing.plan!=="free"&&<button onClick={openPortal} style={{background:C.light,color:C.slate,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 14px",cursor:"pointer",fontSize:12,fontWeight:600,marginLeft:"auto"}}>Gerenciar assinatura</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[{id:"starter",name:"Starter",price:"R$77",desc:"1 usuário · 500 leads · 1 funil · WhatsApp · E-mail"},{id:"pro",name:"Pro",price:"R$147",desc:"5 usuários · Leads ilimitados · Múltiplos funis · IA avançada",highlight:true},{id:"agency",name:"Agency",price:"R$297",desc:"Usuários ilimitados · Múltiplos workspaces · Suporte prioritário"}].map(p=>(
                <div key={p.id} style={{border:`2px solid ${p.highlight?C.green:C.border}`,borderRadius:12,padding:16,background:p.highlight?C.greenBg:"white",position:"relative"}}>
                  {p.highlight&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:C.green,color:"white",borderRadius:20,padding:"2px 12px",fontSize:11,fontWeight:700}}>Mais popular</div>}
                  <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:24,fontWeight:700,color:p.highlight?C.greenTx:C.text,marginBottom:8}}>{p.price}<span style={{fontSize:12,fontWeight:400,color:C.muted}}>/mês</span></div>
                  <div style={{fontSize:12,color:C.slate,marginBottom:14,lineHeight:1.6}}>{p.desc}</div>
                  <button onClick={()=>openCheckout(p.id)} disabled={billing.plan===p.id} style={{width:"100%",background:billing.plan===p.id?C.light:p.highlight?C.green:C.blue,color:billing.plan===p.id?C.muted:"white",border:"none",borderRadius:8,padding:"9px",cursor:billing.plan===p.id?"default":"pointer",fontSize:13,fontWeight:600,opacity:1}}>
                    {billing.plan===p.id?"Plano atual":"Assinar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={card}><STitle>API & Webhooks</STitle><div style={{marginTop:12}}><div style={{fontSize:12,color:C.slate,marginBottom:6}}>Webhook URL (Meta Ads)</div><div style={{background:C.light,borderRadius:8,padding:"10px 12px",fontFamily:"monospace",fontSize:11,color:C.text}}>{API}/api/webhooks/meta</div></div></div>
          <div style={{...card,gridColumn:"1/-1"}}>
            <STitle>📋 Formulário de Captura de Leads</STitle>
            <p style={{fontSize:13,color:C.muted,marginTop:6,marginBottom:16}}>Compartilhe o link abaixo no seu site, bio do Instagram ou onde quiser. Leads que preencherem entram automaticamente no CRM.</p>
            {/* Link público */}
            <div style={{background:C.greenBg,border:`1px solid ${C.green}`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,fontFamily:"monospace",fontSize:12,color:C.greenTx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formLink}</div>
              <button onClick={()=>{navigator.clipboard.writeText(formLink);setFormMsg("✓ Link copiado!");setTimeout(()=>setFormMsg(""),2000);}} style={{background:C.green,color:"white",border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>Copiar</button>
              <a href={formLink} target="_blank" rel="noreferrer" style={{background:C.light,color:C.slate,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none",flexShrink:0}}>Ver ↗</a>
            </div>
            {/* Configurações */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Título do formulário</label>
                <input value={formCfg.formTitle} onChange={e=>setFormCfg(p=>({...p,formTitle:e.target.value}))} placeholder={`Fale com ${workspace.name}`} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Cor do formulário</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="color" value={formCfg.formColor} onChange={e=>setFormCfg(p=>({...p,formColor:e.target.value}))} style={{width:40,height:36,border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",padding:2}}/>
                  <input value={formCfg.formColor} onChange={e=>setFormCfg(p=>({...p,formColor:e.target.value}))} style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"monospace"}}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Subtítulo</label>
                <input value={formCfg.formSubtitle} onChange={e=>setFormCfg(p=>({...p,formSubtitle:e.target.value}))} placeholder="Preencha o formulário e entraremos em contato." style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Mensagem após envio</label>
                <input value={formCfg.formThankYou} onChange={e=>setFormCfg(p=>({...p,formThankYou:e.target.value}))} placeholder="Obrigado! Entraremos em contato em breve." style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
              </div>
            </div>
            {/* Campos */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:8}}>Campos do formulário</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {ALL_FIELDS.map(f=>(
                  <label key={f.k} style={{display:"flex",alignItems:"center",gap:6,background:formCfg.formFields.includes(f.k)?C.greenBg:C.light,border:`1px solid ${formCfg.formFields.includes(f.k)?C.green:C.border}`,borderRadius:20,padding:"5px 14px",cursor:"pointer",fontSize:13,color:formCfg.formFields.includes(f.k)?C.greenTx:C.slate,fontWeight:500}}>
                    <input type="checkbox" checked={formCfg.formFields.includes(f.k)} onChange={()=>toggleField(f.k)} style={{display:"none"}}/>{f.l}
                  </label>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={saveForm} disabled={savingForm} style={{background:C.green,color:"white",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontSize:13,fontWeight:700,opacity:savingForm?0.6:1}}>Salvar formulário</button>
              {formMsg&&<span style={{fontSize:13,color:formMsg.startsWith("✓")?C.green:C.red,fontWeight:600}}>{formMsg}</span>}
            </div>
          </div>
          <div style={{...card,gridColumn:"1/-1"}}><STitle>E-mail (SMTP)</STitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
              <div><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Servidor SMTP</label><input value={smtpForm.host} onChange={e=>setSmtpForm(p=>({...p,host:e.target.value}))} placeholder="smtp.gmail.com" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Porta</label><input value={smtpForm.port} onChange={e=>setSmtpForm(p=>({...p,port:e.target.value}))} placeholder="465" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Usuário (e-mail)</label><input value={smtpForm.user} onChange={e=>setSmtpForm(p=>({...p,user:e.target.value}))} placeholder="contato@suaempresa.com" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Senha</label><input type="password" value={smtpForm.pass} onChange={e=>setSmtpForm(p=>({...p,pass:e.target.value}))} placeholder="••••••••" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Nome do remetente</label><input value={smtpForm.fromName} onChange={e=>setSmtpForm(p=>({...p,fromName:e.target.value}))} placeholder="Minha Empresa" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:12}}>
              <button onClick={saveSmtp} disabled={savingSmtp} style={{background:C.blue,color:"white",border:"none",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:600,opacity:savingSmtp?0.6:1}}>{savingSmtp?"Salvando...":"Salvar configuração"}</button>
              {smtpMsg&&<span style={{fontSize:12,color:smtpMsg.startsWith("✓")?C.green:C.red,fontWeight:500}}>{smtpMsg}</span>}
            </div>
            <div style={{marginTop:10,fontSize:11,color:C.muted}}>Para Gmail: use uma <strong>senha de app</strong>. Para domínio próprio: use as credenciais SMTP do seu provedor (Hostinger, Locaweb, etc).</div>
          </div>
          <div style={{...card,gridColumn:"1/-1"}}><STitle>Campos Personalizados</STitle>
            <div style={{display:"flex",gap:8,marginTop:12,marginBottom:16,flexWrap:"wrap"}}>
              <input value={newField.name} onChange={e=>setNewField(p=>({...p,name:e.target.value}))} placeholder="Nome do campo" style={{flex:1,minWidth:140,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none"}}/>
              <select value={newField.type} onChange={e=>setNewField(p=>({...p,type:e.target.value}))} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,background:"white",outline:"none"}}>
                <option value="text">Texto</option><option value="number">Número</option><option value="date">Data</option><option value="select">Seleção</option>
              </select>
              {newField.type==="select"&&<input value={newField.options} onChange={e=>setNewField(p=>({...p,options:e.target.value}))} placeholder="Opções separadas por vírgula" style={{flex:2,minWidth:180,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none"}}/>}
              <button onClick={addField} disabled={savingField||!newField.name.trim()} style={{background:C.green,color:"white",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:600,opacity:(savingField||!newField.name.trim())?0.6:1}}>+ Adicionar</button>
            </div>
            {customFields.length===0&&<div style={{textAlign:"center",padding:16,color:C.muted,fontSize:12}}>Nenhum campo personalizado criado</div>}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {customFields.map(f=><div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.light,borderRadius:8}}>
                <span style={{fontSize:13,fontWeight:500,color:C.text,flex:1}}>{f.name}</span>
                <span style={{background:C.border,color:C.slate,borderRadius:4,padding:"1px 8px",fontSize:11}}>{f.type}</span>
                {f.options&&<span style={{fontSize:11,color:C.muted}}>{(f.options||[]).join(", ")}</span>}
                <button onClick={()=>delField(f.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14,padding:"0 4px"}}>✕</button>
              </div>)}
            </div>
          </div>
        </Grid>
        <div style={{...card,marginTop:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div><div style={{fontWeight:700,fontSize:14,color:C.text}}>🤖 Autoresponder WhatsApp</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Configure as mensagens automáticas enviadas aos seus leads</div></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:C.slate}}>{arCfg.enabled?"Ativo":"Inativo"}</span>
              <div onClick={()=>setArCfg(p=>({...p,enabled:!p.enabled}))} style={{width:40,height:22,borderRadius:11,background:arCfg.enabled?C.green:C.border,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:2,left:arCfg.enabled?20:2,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
              </div>
            </div>
          </div>
          {[{k:"welcome",l:"1ª Mensagem — Boas-vindas (3s após contato)"},{k:"protocol",l:"2ª Mensagem — Apresentação/Oferta (30s após resposta)"},{k:"guarantee",l:"3ª Mensagem — Garantia (2min após oferta)"},{k:"followup24h",l:"Follow-up 24h"},{k:"followup48h",l:"Follow-up 48h"}].map(({k,l})=>(
            <div key={k} style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:5}}>{l}</label>
              <textarea value={arCfg.messages[k]||""} onChange={e=>setArCfg(p=>({...p,messages:{...p.messages,[k]:e.target.value}}))} rows={4} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}}/>
            </div>
          ))}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:5}}>Palavras que escalam para atendimento humano (separadas por vírgula)</label>
            <input value={arCfg.escalationWords} onChange={e=>setArCfg(p=>({...p,escalationWords:e.target.value}))} placeholder="cirurgia, emergência, cancelar, reembolso" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={saveAr} disabled={savingAr} style={{background:C.green,color:"white",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{savingAr?"Salvando...":"Salvar autoresponder"}</button>
            {arMsg&&<span style={{fontSize:13,color:arMsg.startsWith("✓")?C.greenTx:C.red}}>{arMsg}</span>}
          </div>
        </div>
      </Pg>
    );
  };

  const LeadDrawer=()=>{
    if(!selLead)return null;const l=selLead;const cfg=SC[l.stage]||{c:C.slate,bg:C.light,tx:C.slate};
    const [activities,setActivities]=useState([]);
    const [loadingAct,setLoadingAct]=useState(false);
    const [newNote,setNewNote]=useState("");
    const [savingNote,setSavingNote]=useState(false);
    const ACT_ICONS={CRIADO:"✦",ESTAGIO:"→",NOTA:"📝",WHATSAPP:"💬",EMAIL:"✉",LIGACAO:"📞",REUNIAO:"📅",ATRIBUIDO:"👤",SCORE:"◉"};
    const ACT_COLORS={CRIADO:C.purple,ESTAGIO:C.blue,NOTA:C.amber,WHATSAPP:C.green,EMAIL:C.blue,LIGACAO:C.green,REUNIAO:C.purple,ATRIBUIDO:C.slate,SCORE:C.amber};
    useEffect(()=>{
      if(!l.id||!token)return;
      setLoadingAct(true);
      fetch(`${API}/api/workspaces/${workspace.id}/leads/${l.id}/activities`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{if(Array.isArray(d))setActivities(d);}).catch(()=>{}).finally(()=>setLoadingAct(false));
    },[l.id]);
    const saveNote=async()=>{
      if(!newNote.trim())return;
      setSavingNote(true);
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/leads/${l.id}/activities`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({type:"NOTA",description:newNote})});
        const d=await r.json();
        if(r.ok){setActivities(prev=>[d,...prev]);setNewNote("");}
      }catch{}
      setSavingNote(false);
    };
    const addItem=()=>setProposal(p=>({...p,items:[...p.items,{description:"",qty:1,price:""}]}));
    const removeItem=(i)=>setProposal(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));
    const updateItem=(i,k,v)=>setProposal(p=>({...p,items:p.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:200,display:"flex",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&(setSelLead(null),setAiData(null))}>
        <div style={{width:430,background:"white",height:"100%",overflowY:"auto",boxShadow:"-8px 0 32px rgba(0,0,0,0.12)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:"white",zIndex:1}}>
            <Row mb={8}><div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:C.text}}>{l.name}</div><div style={{fontSize:12,color:C.slate,marginTop:2}}>{l.company}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>{setEditingLead(l);setEditForm({name:l.name,company:l.company||"",email:l.email||"",phone:l.phone||"",value:l.value||"",source:l.source||"Indicação",notes:l.notes||""});}} style={{background:C.blueBg,color:C.blue,border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Editar</button><button onClick={()=>{setSelLead(null);setAiData(null);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:20}}>✕</button></div></Row>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{badge(l.stage,cfg.c,cfg.bg,cfg.tx,true)}<ScoreBadge s={l.score||50}/></div>
          </div>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.light}`}}>
            <Grid cols={2} gap={10} mb={12}>{[{l:"Valor",v:fmt(l.value),c:C.green},{l:"Fonte",v:l.source||"—",c:C.text},{l:"Telefone",v:l.phone||"—",c:C.text},{l:"E-mail",v:l.email||"—",c:C.text}].map(x=><div key={x.l}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{x.l}</div><div style={{fontSize:13,fontWeight:500,color:x.c}}>{x.v}</div></div>)}</Grid>
            {l.notes&&<><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Notas</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6,background:C.light,borderRadius:8,padding:"10px 12px"}}>{l.notes}</div></>}
            {customFields.length>0&&<div style={{marginTop:12}}><div style={{fontSize:11,color:C.muted,marginBottom:8}}>Campos personalizados</div><Grid cols={2} gap={8}>{customFields.map(f=><div key={f.id}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{f.name}</div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{(l.metadata&&l.metadata[f.id])||"—"}</div></div>)}</Grid></div>}
          </div>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.light}`}}>
            {l.phone&&<button onClick={()=>{setSelLead(null);openLeadWhatsApp(l);}} style={{width:"100%",background:C.green,color:"white",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>💬 Enviar mensagem no WhatsApp</button>}
            {l.email&&<button onClick={()=>setEmailModal(l)} style={{width:"100%",background:C.blueBg,color:C.blue,border:`1px solid ${C.blue}`,borderRadius:8,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>✉ Enviar E-mail</button>}
            <button onClick={()=>setProposalModal(true)} style={{width:"100%",background:C.amberBg,color:C.amberTx,border:`1px solid ${C.amber}`,borderRadius:8,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📄 Gerar Proposta PDF</button>
            <Row mb={10}><span style={{fontWeight:600,color:C.text,fontSize:13}}>✦ Análise de IA</span><button onClick={()=>analyzeAI(l)} disabled={aiLoading} style={{background:aiLoading?C.light:C.blueBg,color:aiLoading?C.muted:C.blue,border:"none",borderRadius:6,padding:"5px 12px",cursor:aiLoading?"wait":"pointer",fontSize:12,fontWeight:600,marginLeft:"auto"}}>{aiLoading?"Analisando...":"Gerar análise"}</button></Row>
            {aiLoading&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:13}}>✦ Analisando com IA...</div>}
            {aiData&&!aiData.error&&(<>
              <div style={{background:"#f0f9ff",borderRadius:8,padding:12,marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:C.blueTx,marginBottom:3}}>Análise</div><div style={{fontSize:13,color:C.text}}>{aiData.score_analise}</div><div style={{fontSize:12,color:C.slate,marginTop:3}}>Probabilidade: <strong style={{color:C.green}}>{aiData.probabilidade}</strong></div></div>
              {aiData.risco&&aiData.risco!=="null"&&<div style={{background:C.redBg,borderRadius:8,padding:10,marginBottom:10,borderLeft:`3px solid ${C.red}`}}><div style={{fontSize:11,fontWeight:600,color:C.redTx}}>⚠ Risco</div><div style={{fontSize:12,color:C.redTx,marginTop:2}}>{aiData.risco}</div></div>}
              {aiData.acoes?.map((a,i)=><div key={i} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:11,marginBottom:7}}><Row mb={5}><span style={{background:C.blueBg,color:C.blue,borderRadius:4,padding:"1px 8px",fontSize:11,fontWeight:600}}>{a.tipo}</span><span style={{fontSize:11,color:a.urgencia==="Alta"?C.red:C.amber,fontWeight:600,marginLeft:"auto"}}>● {a.urgencia}</span></Row><div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:2}}>{a.acao}</div><div style={{fontSize:11,color:C.muted}}>{a.prazo}</div></div>)}
              {aiData.whatsapp_msg&&<div style={{background:C.greenBg,borderRadius:8,padding:11,marginTop:8}}><div style={{fontSize:11,fontWeight:600,color:C.greenTx,marginBottom:4}}>💬 Mensagem sugerida para WhatsApp</div><div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{aiData.whatsapp_msg}</div><button onClick={()=>setTab("whatsapp")} style={{marginTop:8,background:C.green,color:"white",border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:600}}>Abrir WhatsApp</button></div>}
            </>)}
            {!aiLoading&&!aiData&&<div style={{border:`2px dashed ${C.border}`,borderRadius:8,padding:20,textAlign:"center",color:C.muted,fontSize:12}}>Clique em "Gerar análise" para receber recomendações de IA para este lead</div>}
          </div>
          <div style={{padding:"14px 20px"}}>
            <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:12}}>📋 Histórico</div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Adicionar nota..." rows={2} style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,outline:"none",resize:"none"}}/>
              <button onClick={saveNote} disabled={savingNote||!newNote.trim()} style={{background:C.green,color:"white",border:"none",borderRadius:8,padding:"0 14px",cursor:"pointer",fontSize:12,fontWeight:600,opacity:(savingNote||!newNote.trim())?0.6:1}}>+</button>
            </div>
            {loadingAct&&<div style={{textAlign:"center",padding:16,color:C.muted,fontSize:12}}>Carregando...</div>}
            {!loadingAct&&activities.length===0&&<div style={{textAlign:"center",padding:16,color:C.muted,fontSize:12}}>Nenhuma atividade ainda</div>}
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {activities.map((a,i)=>(
                <div key={a.id} style={{display:"flex",gap:10,paddingBottom:14,position:"relative"}}>
                  {i<activities.length-1&&<div style={{position:"absolute",left:13,top:24,bottom:0,width:1,background:C.border}}/>}
                  <div style={{width:26,height:26,borderRadius:"50%",background:(ACT_COLORS[a.type]||C.slate)+"20",border:`1.5px solid ${ACT_COLORS[a.type]||C.slate}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,zIndex:1}}>{ACT_ICONS[a.type]||"•"}</div>
                  <div style={{flex:1,paddingTop:3}}>
                    <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{a.description}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.user?.name&&`${a.user.name} · `}{new Date(a.createdAt).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EmailModal=()=>{
    const [subj,setSubj]=useState("");
    const [body,setBody]=useState("");
    const [sending,setSending]=useState(false);
    const [msg,setMsg]=useState("");
    const send=async()=>{
      setSending(true);setMsg("");
      try{
        const r=await fetch(`${API}/api/workspaces/${workspace.id}/email/send`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({to:emailModal.email,subject:subj,body,leadId:emailModal.id})});
        const d=await r.json();
        if(r.ok){setMsg("✓ E-mail enviado!");setTimeout(()=>setEmailModal(null),1500);}
        else setMsg("✗ "+(d.error||"Erro"));
      }catch{setMsg("✗ Erro ao enviar");}
      setSending(false);
    };
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&setEmailModal(null)}>
        <div style={{background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:500,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <span style={{fontSize:16,fontWeight:700,color:C.text}}>✉ Enviar E-mail</span>
            <button onClick={()=>setEmailModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.muted}}>✕</button>
          </div>
          <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Para</label><input value={emailModal.email} readOnly style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box",background:C.light}}/></div>
          <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Assunto</label><input value={subj} onChange={e=>setSubj(e.target.value)} placeholder="Assunto do e-mail" style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
          <div style={{marginBottom:20}}><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Mensagem</label><textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} placeholder="Escreva sua mensagem..." style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical"}}/></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={send} disabled={sending||!subj.trim()||!body.trim()} style={{background:C.blue,color:"white",border:"none",borderRadius:8,padding:"11px 24px",cursor:"pointer",fontSize:14,fontWeight:600,opacity:(sending||!subj.trim()||!body.trim())?0.6:1}}>{sending?"Enviando...":"Enviar"}</button>
            {msg&&<span style={{fontSize:13,color:msg.startsWith("✓")?C.green:C.red,fontWeight:500}}>{msg}</span>}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',background:"#f1f5f9",overflow:"hidden"}}>
      <div style={{width:220,background:"#0d1117",display:"flex",flexDirection:"column",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="9" fill="#00c896"/>
              <path d="M10 20C10 14.477 14.477 10 20 10C23.18 10 26.02 11.38 28 13.6L24.4 16.5C23.36 15.24 21.78 14.44 20 14.44C16.93 14.44 14.44 16.93 14.44 20C14.44 23.07 16.93 25.56 20 25.56C21.78 25.56 23.36 24.76 24.4 23.5L28 26.4C26.02 28.62 23.18 30 20 30C14.477 30 10 25.523 10 20Z" fill="#0d1117"/>
              <circle cx="28" cy="20" r="3" fill="#0d1117"/>
            </svg>
            <span style={{color:"white",fontWeight:800,fontSize:16,letterSpacing:"-0.3px"}}>Clien<span style={{color:"#00c896"}}>Data</span></span>
          </div>
          <div onClick={()=>setWorkspace(null)} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 10px",cursor:"pointer",border:"1px solid rgba(255,255,255,0.05)",transition:"all 0.2s"}} onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.09)"} onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
            <div style={{width:22,height:22,borderRadius:6,background:workspace.color||C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"white",flexShrink:0}}>{workspace.name[0]}</div>
            <span style={{color:"#94a3b8",fontSize:12,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{workspace.name}</span>
            <span style={{color:"#475569",fontSize:10}}>⇅</span>
          </div>
        </div>
        <nav style={{padding:"10px 8px",flex:1,overflowY:"auto"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:"none",cursor:"pointer",marginBottom:2,background:tab===item.id?"rgba(0,200,150,0.12)":"transparent",color:tab===item.id?"#00c896":"#64748b",fontSize:13,fontWeight:tab===item.id?600:400,textAlign:"left",transition:"all 0.15s"}}>
              <span style={{fontSize:14,width:18,textAlign:"center",opacity:tab===item.id?1:0.7}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.id==="tasks"&&overdue>0&&<span style={{background:C.red,color:"white",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{overdue}</span>}
              {item.id==="whatsapp"&&unreadWA>0&&<span style={{background:"#00c896",color:"#0d1117",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>{unreadWA}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"14px 12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px",borderRadius:9,background:"rgba(255,255,255,0.03)"}}>
            <div style={{width:32,height:32,background:"linear-gradient(135deg,#00c896,#0097a7)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"white",flexShrink:0}}>{authUser.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"white",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{authUser.name}</div>
              <div style={{color:"#475569",fontSize:10,marginTop:1}}>{workspace.role||"Admin"}</div>
            </div>
            <button onClick={()=>{setAuthUser(null);setWorkspace(null);setWsList([]);setTab("dashboard");localStorage.removeItem("crm_token");}} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:14,padding:"4px",borderRadius:6,transition:"color 0.2s"}} title="Sair">⏻</button>
          </div>
        </div>
      </div>
      <main style={{flex:1,overflow:"auto",background:"#f1f5f9",display:"flex",flexDirection:"column"}}>
        {tab==="dashboard"   &&<Dashboard/>}
        {tab==="pipeline"    &&<Pipeline/>}
        {tab==="leads"       &&<LeadsTable/>}
        {tab==="tasks"       &&<TasksPage/>}
        {tab==="whatsapp"    &&<WhatsApp/>}
        {tab==="automations" &&<Automations/>}
        {tab==="metaads"     &&<MetaAds/>}
        {tab==="reports"     &&<Reports/>}
        {tab==="settings"    &&<Settings/>}
      </main>
      <LeadDrawer/>
      {emailModal&&<EmailModal/>}
      {selLead&&proposalModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&setProposalModal(false)}>
          <div style={{background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:600,boxShadow:"0 20px 60px rgba(0,0,0,0.25)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:C.text}}>📄 Gerar Proposta PDF</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>Para: {selLead.name} {selLead.company?`· ${selLead.company}`:""}</div>
              </div>
              <button onClick={()=>setProposalModal(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.muted}}>✕</button>
            </div>

            {/* Dados da empresa */}
            <div style={{background:C.light,borderRadius:10,padding:14,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Sua Empresa</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{l:"Nome da empresa",k:"companyName",ph:"Minha Empresa"},{l:"E-mail",k:"companyEmail",ph:"contato@empresa.com"},{l:"Telefone",k:"companyPhone",ph:"(47) 99999-9999"}].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:11,fontWeight:600,color:C.slate,display:"block",marginBottom:3}}>{f.l}</label>
                    <input value={proposal[f.k]} onChange={e=>setProposal(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Título e validade */}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Título da proposta</label>
                <input value={proposal.title} onChange={e=>setProposal(p=>({...p,title:e.target.value}))} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Validade (dias)</label>
                <input type="number" value={proposal.validDays} onChange={e=>setProposal(p=>({...p,validDays:e.target.value}))} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
            </div>

            {/* Itens */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{fontSize:12,fontWeight:600,color:C.text}}>Itens da proposta</label>
                <button onClick={addItem} style={{background:C.greenBg,color:C.greenTx,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Item</button>
              </div>
              <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"3fr 60px 100px 30px",gap:0,background:C.light,padding:"6px 10px"}}>
                  {["Descrição","Qtd","Valor (R$)",""].map(h=><div key={h} style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase"}}>{h}</div>)}
                </div>
                {proposal.items.map((item,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 60px 100px 30px",gap:4,padding:"6px 10px",borderTop:`1px solid ${C.light}`}}>
                    <input value={item.description} onChange={e=>updateItem(i,"description",e.target.value)} placeholder="Descrição do serviço..." style={{border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,outline:"none"}}/>
                    <input type="number" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)} min="1" style={{border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 6px",fontSize:12,outline:"none",textAlign:"center"}}/>
                    <input type="number" value={item.price} onChange={e=>updateItem(i,"price",e.target.value)} placeholder="0,00" style={{border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,outline:"none"}}/>
                    <button onClick={()=>removeItem(i)} disabled={proposal.items.length===1} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14,opacity:proposal.items.length===1?0.3:1}}>✕</button>
                  </div>
                ))}
                <div style={{padding:"8px 10px",background:C.light,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,color:C.slate}}>Total:</span>
                  <span style={{fontSize:15,fontWeight:700,color:C.green}}>R$ {propTotal.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
                </div>
              </div>
            </div>

            {/* Condições e Observações */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Condições de pagamento</label>
                <textarea value={proposal.paymentTerms} onChange={e=>setProposal(p=>({...p,paymentTerms:e.target.value}))} placeholder="Ex: 50% na assinatura, 50% na entrega..." rows={3} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,outline:"none",boxSizing:"border-box",resize:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Observações</label>
                <textarea value={proposal.notes} onChange={e=>setProposal(p=>({...p,notes:e.target.value}))} placeholder="Informações adicionais..." rows={3} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,outline:"none",boxSizing:"border-box",resize:"none"}}/>
              </div>
            </div>

            <button onClick={generatePDF} disabled={generatingPDF||!proposal.items[0].description} style={{width:"100%",background:C.amber,color:"white",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",opacity:(generatingPDF||!proposal.items[0].description)?0.6:1,boxShadow:"0 4px 20px rgba(245,158,11,0.3)"}}>
              {generatingPDF?"⟳ Gerando PDF...":"📄 Baixar Proposta em PDF"}
            </button>
          </div>
        </div>
      )}
      {editingLead&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&setEditingLead(null)}>
          <div style={{background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <span style={{fontSize:16,fontWeight:700,color:C.text}}>Editar Lead</span>
              <button onClick={()=>setEditingLead(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.muted}}>✕</button>
            </div>
            {[{l:"Nome *",k:"name",ph:"João Silva"},{l:"Empresa",k:"company",ph:"Empresa Ltda"},{l:"E-mail",k:"email",ph:"joao@empresa.com"},{l:"Telefone",k:"phone",ph:"(47) 99999-9999"},{l:"Valor estimado (R$)",k:"value",ph:"10000"}].map(f=>(
              <div key={f.k} style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>{f.l}</label>
                <input value={editForm[f.k]||""} onChange={e=>setEditForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Fonte</label>
              <select value={editForm.source||"Indicação"} onChange={e=>setEditForm(p=>({...p,source:e.target.value}))} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,background:"white",outline:"none"}}>
                {["Indicação","Meta Ads","Google Ads","LinkedIn","Site","Evento","WhatsApp","Outro"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Notas</label>
              <textarea value={editForm.notes||""} onChange={e=>setEditForm(p=>({...p,notes:e.target.value}))} rows={3} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical"}}/>
            </div>
            {customFields.length>0&&<><div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:10}}>Campos personalizados</div>{customFields.map(f=><div key={f.id} style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>{f.name}</label>{f.type==="select"?<select value={(editForm.metadata||{})[f.id]||""} onChange={e=>setEditForm(p=>({...p,metadata:{...(p.metadata||{}),[f.id]:e.target.value}}))} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,background:"white",outline:"none"}}><option value="">—</option>{(f.options||[]).map(o=><option key={o}>{o}</option>)}</select>:<input type={f.type==="number"?"number":f.type==="date"?"date":"text"} value={(editForm.metadata||{})[f.id]||""} onChange={e=>setEditForm(p=>({...p,metadata:{...(p.metadata||{}),[f.id]:e.target.value}}))} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>}</div>)}</>}
            <button onClick={saveEdit} disabled={savingEdit||!editForm.name} style={{width:"100%",background:C.green,color:"white",border:"none",borderRadius:8,padding:"11px",fontSize:14,fontWeight:600,cursor:"pointer",opacity:(savingEdit||!editForm.name)?0.6:1}}>
              {savingEdit?"Salvando...":"Salvar alterações"}
            </button>
          </div>
        </div>
      )}
      {newLeadModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&setNewLeadModal(false)}>
          <div style={{background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <span style={{fontSize:16,fontWeight:700,color:C.text}}>Novo Lead</span>
              <button onClick={()=>setNewLeadModal(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.muted}}>✕</button>
            </div>
            {[{l:"Nome *",k:"name",ph:"João Silva"},{l:"Empresa",k:"company",ph:"Empresa Ltda"},{l:"E-mail",k:"email",ph:"joao@empresa.com"},{l:"Telefone",k:"phone",ph:"(11) 99999-9999"},{l:"Valor estimado (R$)",k:"value",ph:"10000"}].map(f=>(
              <div key={f.k} style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>{f.l}</label>
                <input value={newLeadForm[f.k]} onChange={e=>setNewLeadForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Fonte</label>
              <select value={newLeadForm.source} onChange={e=>setNewLeadForm(p=>({...p,source:e.target.value}))} style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,background:"white",outline:"none"}}>
                {["Indicação","Meta Ads","Google Ads","LinkedIn","Site","Evento","WhatsApp","Outro"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:4}}>Notas</label>
              <textarea value={newLeadForm.notes} onChange={e=>setNewLeadForm(p=>({...p,notes:e.target.value}))} rows={3} placeholder="Observações sobre o lead..." style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical"}}/>
            </div>
            <button onClick={saveLead} disabled={savingLead||!newLeadForm.name} style={{width:"100%",background:C.green,color:"white",border:"none",borderRadius:8,padding:"11px",fontSize:14,fontWeight:600,cursor:"pointer",opacity:(savingLead||!newLeadForm.name)?0.6:1}}>
              {savingLead?"Salvando...":"Salvar Lead"}
            </button>
          </div>
        </div>
      )}
      {limitModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24}}>
          <div style={{background:"white",borderRadius:20,padding:"40px 36px",maxWidth:440,width:"100%",textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:44,marginBottom:16}}>🚀</div>
            <h2 style={{fontSize:22,fontWeight:800,color:"#1e293b",letterSpacing:"-0.5px",marginBottom:10}}>Limite do plano atingido</h2>
            <p style={{fontSize:14,color:"#64748b",lineHeight:1.7,marginBottom:28}}>Você atingiu o limite de leads do seu plano atual. Faça upgrade para continuar adicionando leads e crescer suas vendas.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{setLimitModal(false);setTab("settings");}} style={{background:"#00c896",color:"white",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(0,200,150,0.3)"}}>
                Ver planos e fazer upgrade →
              </button>
              <button onClick={()=>setLimitModal(false)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:10,padding:"11px",fontSize:14,color:"#64748b",cursor:"pointer"}}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Pg({title,sub,children,onNew}){
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100%"}}>
      {/* Page header */}
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#0f172a",letterSpacing:"-0.4px"}}>{title}</h1>
          {sub&&<p style={{margin:"3px 0 0",fontSize:12,color:"#94a3b8",fontWeight:400}}>{sub}</p>}
        </div>
        {onNew&&<button onClick={onNew} style={{background:"#00c896",color:"white",border:"none",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 12px rgba(0,200,150,0.25)",transition:"all 0.2s"}} onMouseOver={e=>e.currentTarget.style.background="#00b388"} onMouseOut={e=>e.currentTarget.style.background="#00c896"}>+ Novo Lead</button>}
      </div>
      {/* Page content */}
      <div style={{flex:1,padding:"24px 28px"}}>
        {children}
      </div>
    </div>
  );
}
function STitle({children}){return <div style={{fontWeight:700,color:"#0f172a",fontSize:13,marginBottom:10,letterSpacing:"-0.1px"}}>{children}</div>;}
function Row({children,mb}){return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:mb||0}}>{children}</div>;}
function Grid({cols,gap,mb,children}){return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,gap,marginBottom:mb||0}}>{children}</div>;}
function Avatar({name,size=28}){if(!name)return null;const initials=name.split(" ").map(n=>n[0]).join("");return <div style={{width:size,height:size,borderRadius:"50%",background:"#f1f5f9",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.37,fontWeight:700,color:"#64748b",flexShrink:0}}>{initials}</div>;}
function ScoreBadge({s}){const score=s||50;const bg=score>=80?"#ecfdf5":score>=60?"#fffbeb":"#fef2f2";const tx=score>=80?"#047857":score>=60?"#b45309":"#b91c1c";return <span style={{background:bg,color:tx,borderRadius:5,padding:"1px 7px",fontSize:11,fontWeight:700,flexShrink:0}}>{score}</span>;}
function Toggle({active,onToggle}){return(<div onClick={e=>{e.stopPropagation();onToggle();}} style={{width:38,height:20,borderRadius:10,background:active?"#00c896":"#e2e8f0",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:active?20:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/></div>);}

