import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const C = {
  green:"#10b981",greenBg:"#ecfdf5",greenTx:"#047857",
  blue:"#3b82f6", blueBg:"#eff6ff", blueTx:"#1d4ed8",
  amber:"#f59e0b",amberBg:"#fffbeb",amberTx:"#b45309",
  red:"#ef4444",  redBg:"#fef2f2",  redTx:"#b91c1c",
  purple:"#8b5cf6",purpleBg:"#f5f3ff",purpleTx:"#6d28d9",
  slate:"#64748b", light:"#f8fafc", border:"#e2e8f0",
  dark:"#0f172a",  text:"#1e293b",  muted:"#94a3b8",
};
const fmt  = n => "R$ "+n.toLocaleString("pt-BR");
const card = {background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:"18px 20px"};
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
const INIT_CONVOS = [
  {id:1,lead:"Fernanda Lima",phone:"(47) 98414-2020",avatar:"FL",color:"#10b981",unread:0,last:"Perfeito! Vou confirmar com o financeiro ainda hoje.",time:"14:32",messages:[{from:"me",text:"Olá Fernanda! Tudo bem? Passando para confirmar nossa proposta de R$28.000.",time:"10:15"},{from:"lead",text:"Sim! Gostei muito do material. Só preciso aprovar com o financeiro.",time:"10:48"},{from:"lead",text:"Perfeito! Vou confirmar com o financeiro ainda hoje.",time:"14:32"}]},
  {id:2,lead:"Carlos Mendes",phone:"(47) 99123-4567",avatar:"CM",color:"#3b82f6",unread:2,last:"Pode ser na sexta às 14h?",time:"09:18",messages:[{from:"me",text:"Carlos, bom dia! Sua proposta está pronta. Posso te chamar para uma call de 20min?",time:"08:45"},{from:"lead",text:"Pode ser na sexta às 14h?",time:"09:18"}]},
  {id:3,lead:"Amanda Vieira",phone:"(51) 99876-1234",avatar:"AV",color:"#f59e0b",unread:0,last:"Vejo você quinta então 👍",time:"Ontem",messages:[{from:"lead",text:"Oi! Só confirmando a call de quinta às 15h.",time:"16:20"},{from:"me",text:"Confirmado! Te envio o link do meet em breve.",time:"16:35"},{from:"lead",text:"Vejo você quinta então 👍",time:"16:36"}]},
  {id:4,lead:"Lucas Ferreira",phone:"(21) 98123-9876",avatar:"LF",color:"#8b5cf6",unread:1,last:"Olá! Gostaria de saber mais sobre os planos.",time:"08:02",messages:[{from:"lead",text:"Olá! Gostaria de saber mais sobre os planos.",time:"08:02"}]},
];
const NAV=[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"pipeline",label:"Pipeline",icon:"⋮⋮"},{id:"leads",label:"Leads",icon:"◉"},{id:"tasks",label:"Tarefas",icon:"✓"},{id:"whatsapp",label:"WhatsApp",icon:"💬"},{id:"automations",label:"Automações",icon:"⚡"},{id:"metaads",label:"Meta Ads",icon:"↗"},{id:"reports",label:"Relatórios",icon:"📊"},{id:"settings",label:"Configurações",icon:"⚙"}];
const WS_COLORS=["#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#f97316"];
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
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,background:C.green,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"white",margin:"0 auto 12px"}}>C</div>
          <div style={{color:"white",fontSize:24,fontWeight:700}}>CRM Pro</div>
          <div style={{color:C.muted,fontSize:13,marginTop:4}}>Gestão inteligente de vendas</div>
        </div>
        <div style={{background:"white",borderRadius:16,padding:28}}>
          <div style={{display:"flex",background:C.light,borderRadius:8,padding:3,marginBottom:22}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"7px",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,background:mode===m?"white":"transparent",color:mode===m?C.text:C.slate,boxShadow:mode===m?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>
                {m==="login"?"Entrar":"Criar conta"}
              </button>
            ))}
          </div>
          {mode==="register"&&<><Field label="Seu nome" value={form.name} onChange={up("name")} placeholder="João Silva"/><Field label="Empresa / Workspace" value={form.company} onChange={up("company")} placeholder="Minha Empresa"/></>}
          <Field label="E-mail" value={form.email} onChange={up("email")} placeholder="joao@empresa.com"/>
          <Field label="Senha" value={form.pass} onChange={up("pass")} type="password" placeholder="••••••••"/>
          {mode==="login"&&<div style={{textAlign:"right",marginBottom:16}}><span style={{fontSize:12,color:C.blue,cursor:"pointer"}}>Esqueci a senha</span></div>}
          {error&&<div style={{background:C.redBg,color:C.redTx,borderRadius:8,padding:"10px 12px",fontSize:13,marginBottom:12}}>{error}</div>}
          <button onClick={submit} disabled={loading} style={{width:"100%",background:C.green,color:"white",border:"none",borderRadius:8,padding:"11px",fontSize:14,fontWeight:600,cursor:"pointer",opacity:loading?0.7:1}}>
            {loading?"Aguarde...":(mode==="login"?"Entrar na conta":"Criar conta grátis")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({label,value,onChange,type="text",placeholder}){
  return(
    <div style={{marginBottom:14}}>
      <label style={{fontSize:12,fontWeight:600,color:C.text,display:"block",marginBottom:5}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",boxSizing:"border-box",background:"white"}}/>
    </div>
  );
}

function WorkspaceSelector({user,workspaces,onSelect}){
  return(
    <div style={{minHeight:"100vh",background:C.light,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:40,height:40,background:C.green,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white",margin:"0 auto 10px"}}>C</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text}}>Olá, {user.name.split(" ")[0]}!</div>
          <div style={{fontSize:13,color:C.slate,marginTop:4}}>Selecione o workspace para acessar</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {workspaces.map((ws,i)=>(
            <div key={ws.id||i} onClick={()=>onSelect(ws)} style={{...card,cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:16,transition:"transform 0.1s"}}
              onMouseOver={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseOut={e=>e.currentTarget.style.transform="none"}>
              <div style={{width:42,height:42,borderRadius:10,background:ws.color||WS_COLORS[i%WS_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"white",flexShrink:0}}>{ws.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:C.text,fontSize:14}}>{ws.name}</div>
                <div style={{fontSize:12,color:C.slate,marginTop:2}}>Plano {ws.plan||"Starter"} · Acesso: {ws.role||"Admin"}</div>
              </div>
              <span style={{color:C.slate,fontSize:18}}>›</span>
            </div>
          ))}
          <div style={{...card,cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:16,border:`1.5px dashed ${C.border}`}}
            onMouseOver={e=>e.currentTarget.style.borderColor=C.green} onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{width:42,height:42,borderRadius:10,background:C.light,border:`1.5px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:C.muted}}>+</div>
            <div style={{flex:1}}><div style={{fontWeight:600,color:C.slate,fontSize:14}}>Criar novo workspace</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Ideal para nova empresa ou projeto</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMPro(){
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
  const [newLeadForm,setNewLeadForm]=useState({name:"",company:"",email:"",phone:"",value:"",source:"Indicação",notes:""});
  const [savingLead,setSavingLead]=useState(false);
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
  },[workspace]);

  const saveLead=async()=>{
    setSavingLead(true);
    try{
      const r=await fetch(`${API}/api/workspaces/${workspace.id}/leads`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({...newLeadForm,value:Number(newLeadForm.value)||0})});
      const d=await r.json();
      if(r.ok){setLeads(p=>[d,...p]);setNewLeadModal(false);setNewLeadForm({name:"",company:"",email:"",phone:"",value:"",source:"Indicação",notes:""});}
    }catch{}
    setSavingLead(false);
  };

  if(!authUser)return <AuthScreen onLogin={handleLogin}/>;
  if(!workspace)return <WorkspaceSelector user={authUser} workspaces={wsList} onSelect={setWorkspace}/>;

  const overdue=tasks.filter(t=>t.due==="Atrasado"&&!t.done).length;
  const unreadWA=convos.reduce((a,c)=>a+c.unread,0);
  const pipeVal=leads.filter(l=>l.stage!=="Fechado").reduce((a,l)=>a+l.value,0);

  const analyzeAI=async lead=>{
    setAiData(null);setAiLoading(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:`Especialista em vendas B2B. Analise e retorne SOMENTE JSON válido.\nLead: ${lead.name} | ${lead.company} | Stage: ${lead.stage} | Valor: R$${lead.value.toLocaleString()} | Score: ${lead.score||50}\nFonte: ${lead.source} | Notas: ${lead.notes}\n{"score_analise":"1 frase","probabilidade":"XX%","acoes":[{"tipo":"Ligação|E-mail|WhatsApp|Reunião","acao":"ação específica","urgencia":"Alta|Média|Baixa","prazo":"quando"}],"risco":"risco ou null","whatsapp_msg":"mensagem pronta para enviar no WhatsApp (informal, até 100 palavras)"}`}]})});
      const d=await r.json();
      setAiData(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()));
    }catch{setAiData({error:true});}
    setAiLoading(false);
  };

  const Dashboard=()=>{
    const rev=[{mes:"Out",v:38},{mes:"Nov",v:52},{mes:"Dez",v:41},{mes:"Jan",v:65},{mes:"Fev",v:58},{mes:"Mar",v:74}];
    return(
      <Pg title="Dashboard" sub="Visão geral — Março 2026" onNew={()=>setNewLeadModal(true)}>
        <Grid cols={4} gap={12} mb={18}>
          {[{l:"Pipeline",v:`R$${(pipeVal/1000).toFixed(0)}K`,s:`${leads.filter(l=>l.stage!=="Fechado").length} deals`,c:C.purple},{l:"Fechado",v:"R$ 45K",s:"taxa conversão 22%",c:C.green},{l:"Tarefas",v:tasks.filter(t=>!t.done).length,s:`${overdue} atrasadas`,c:overdue>0?C.red:C.amber},{l:"WhatsApp",v:unreadWA,s:"msg não lidas",c:unreadWA>0?C.blue:C.slate}].map((k,i)=>(
            <div key={i} style={card}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{k.l}</div><div style={{fontSize:26,fontWeight:700,color:k.c,margin:"4px 0"}}>{k.v}</div><div style={{fontSize:12,color:C.slate}}>{k.s}</div></div>
          ))}
        </Grid>
        <Grid cols={2} gap={14}>
          <div style={card}><STitle>Receita Mensal (R$ mil)</STitle><ResponsiveContainer width="100%" height={180}><BarChart data={rev}><XAxis dataKey="mes" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>`R$ ${v}K`} contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/><Bar dataKey="v" fill={C.green} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
          <div style={card}><STitle>Funil por Etapa</STitle>{STAGES.map(s=>{const n=leads.filter(l=>l.stage===s).length;return(<div key={s} style={{marginBottom:10}}><Row><span style={{fontSize:12,color:C.slate,width:100}}>{s}</span><div style={{flex:1,background:C.light,borderRadius:4,height:8}}><div style={{width:`${Math.min(n*22,100)}%`,background:SC[s].c,height:"100%",borderRadius:4}}/></div><span style={{fontSize:12,fontWeight:600,color:C.text,width:20,textAlign:"right"}}>{n}</span></Row></div>);})}</div>
        </Grid>
      </Pg>
    );
  };

  const Pipeline=()=>(
    <Pg title="Pipeline" sub="Clique em um lead para análise com IA" onNew={()=>setNewLeadModal(true)}>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,alignItems:"flex-start"}}>
        {STAGES.map(stage=>{
          const sl=leads.filter(l=>l.stage===stage);
          const {c,bg,tx}=SC[stage];
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
                {filtered.map(lead=>{const cfg=SC[lead.stage]||SC["Novo Lead"];return(
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
       const [sel,setSel]=useState(convos[0]);const [msg,setMsg]=useState("");const [aiSug,setAiSug]=useState(null);const [aiSugL,setAiSugL]=useState(false);const endRef=useRef(null);
    useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[sel]);
      const send=async()=>{if(!msg.trim())return;const text=msg;setMsg("");const nm={from:"me",text,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})};setConvos(prev=>prev.map(c=>c.id===sel.id?{...c,messages:[...c.messages,nm],last:text,unread:0}:c));setSel(prev=>({...prev,messages:[...prev.messages,nm]}));try{const resp=await fetch(`${API}/api/workspaces/${workspace.id}/whatsapp/send`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({phone:"55"+sel.phone.replace(/\D/g,""),message:text})});const data=await resp.json();console.log("WA response:",resp.status,data);}catch(e){console.error("Erro WA:",e);}};
    const suggestReply=async()=>{setAiSugL(true);setAiSug(null);const last=sel.messages.filter(m=>m.from==="lead").slice(-1)[0];try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Vendedor respondendo cliente no WhatsApp. Sugira 3 respostas curtas e eficazes para: "${last?.text||"primeiro contato"}". Retorne SOMENTE JSON: {"sugestoes":["resp1","resp2","resp3"]}`}]})});const d=await r.json();setAiSug(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()).sugestoes);}catch{setAiSug(["Oi! Obrigado pelo contato. Podemos falar agora?","Claro! Me conta mais sobre sua necessidade.","Perfeito! Vou te passar todos os detalhes."]);}setAiSugL(false);};
    return(
      <Pg title="WhatsApp" sub={`${unreadWA} mensagens não lidas · ${convos.length} conversas`}>
        <div style={{...card,padding:0,overflow:"hidden",display:"flex",height:520}}>
          <div style={{width:240,borderRight:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.text}}>Conversas</div>
            {convos.map(c=>(
              <div key={c.id} onClick={()=>{setSel(c);setConvos(prev=>prev.map(x=>x.id===c.id?{...x,unread:0}:x));setAiSug(null);}} style={{display:"flex",gap:10,padding:"11px 14px",cursor:"pointer",background:sel?.id===c.id?C.light:"white",borderBottom:`1px solid ${C.light}`,alignItems:"center"}}>
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
    const genAuto=async()=>{setAiL(true);setAiAuto(null);try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`Crie 1 nova automação inteligente para um CRM de vendas brasileiro. Retorne SOMENTE JSON: {"name":"nome da automação","trigger":{"tipo":"sem_atividade|novo_lead|score_threshold|sem_avanco","descricao":"descrição do gatilho"},"acoes":[{"tipo":"whatsapp|criar_tarefa|notificar|score|tag","label":"o que fazer"}],"justificativa":"por que essa automação gera resultado"}`}]})});const d=await r.json();setAiAuto(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()));}catch{setAiAuto({error:true});}setAiL(false);};
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
    const total={leads:ADS_CAMPAIGNS.reduce((a,c)=>a+c.leads,0),spent:ADS_CAMPAIGNS.reduce((a,c)=>a+c.spent,0),synced:ADS_CAMPAIGNS.reduce((a,c)=>a+c.synced,0)};
    return(
      <Pg title="Meta Ads" sub="Campanhas integradas · Sincronização automática de leads">
        <Grid cols={3} gap={12} mb={18}>{[{l:"Leads Capturados",v:total.leads,s:"Últimos 7 dias",c:C.blue},{l:"Investimento",v:`R$ ${total.spent}`,s:"Última semana",c:C.amber},{l:"Leads Sincronizados",v:total.synced,s:"No CRM automaticamente",c:C.green}].map((k,i)=><div key={i} style={card}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:k.c,margin:"4px 0"}}>{k.v}</div><div style={{fontSize:12,color:C.slate}}>{k.s}</div></div>)}</Grid>
        <div style={{...card,marginBottom:16}}><STitle>Leads por dia (últimos 7 dias)</STitle><ResponsiveContainer width="100%" height={160}><LineChart data={ADS_DAILY}><XAxis dataKey="d" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/><Line type="monotone" dataKey="leads" stroke={C.blue} strokeWidth={2} dot={{fill:C.blue,r:3}} name="Leads"/></LineChart></ResponsiveContainer></div>
        <div style={card}><STitle>Campanhas Ativas</STitle><table style={{width:"100%",borderCollapse:"collapse",fontSize:13,marginTop:10}}><thead><tr style={{background:C.light}}>{["Campanha","Status","Orçamento","Investido","Leads","CPL","ROAS","CRM Sync"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",color:C.slate,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{ADS_CAMPAIGNS.map(c=><tr key={c.id} style={{borderBottom:`1px solid ${C.light}`}}><td style={{padding:"10px 12px",fontWeight:500,color:C.text}}>{c.name}</td><td style={{padding:"10px 12px"}}><span style={{background:c.status==="Ativo"?C.greenBg:C.light,color:c.status==="Ativo"?C.greenTx:C.slate,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>{c.status}</span></td><td style={{padding:"10px 12px",color:C.slate}}>R$ {c.budget}/dia</td><td style={{padding:"10px 12px",color:C.text}}>R$ {c.spent}</td><td style={{padding:"10px 12px",fontWeight:700,color:C.blue}}>{c.leads}</td><td style={{padding:"10px 12px",color:C.text}}>R$ {c.cpl>0?c.cpl.toFixed(2):"—"}</td><td style={{padding:"10px 12px",fontWeight:600,color:c.roas>2?C.green:c.roas>0?C.amber:C.muted}}>{c.roas>0?`${c.roas}×`:"—"}</td><td style={{padding:"10px 12px"}}><span style={{background:C.greenBg,color:C.greenTx,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>{c.synced}/{c.leads} ✓</span></td></tr>)}</tbody></table></div>
      </Pg>
    );
  };

  const Reports=()=>{
    const rev=[{mes:"Out",r:38,m:42},{mes:"Nov",r:52,m:45},{mes:"Dez",r:41,m:48},{mes:"Jan",r:65,m:50},{mes:"Fev",r:58,m:55},{mes:"Mar",r:74,m:60}];
    const src=[{n:"Meta Ads",v:38,c:C.blue},{n:"Indicação",v:32,c:C.green},{n:"Google",v:18,c:C.amber},{n:"Orgânico",v:8,c:C.purple},{n:"Evento",v:4,c:C.slate}];
    return(
      <Pg title="Relatórios" sub="Performance consolidada">
        <Grid cols={2} gap={14}>
          <div style={card}><STitle>Receita vs Meta (R$ mil)</STitle><ResponsiveContainer width="100%" height={200}><BarChart data={rev} barGap={3}><XAxis dataKey="mes" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>`R$ ${v}K`} contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/><Bar dataKey="r" fill={C.green} radius={[4,4,0,0]} name="Receita"/><Bar dataKey="m" fill={C.border} radius={[4,4,0,0]} name="Meta"/></BarChart></ResponsiveContainer></div>
          <div style={card}><STitle>Origem dos Leads</STitle><ResponsiveContainer width="100%" height={160}><PieChart><Pie data={src} cx="50%" cy="50%" outerRadius={70} dataKey="v" labelLine={false}>{src.map((e,i)=><Cell key={i} fill={e.c}/>)}</Pie><Tooltip formatter={v=>`${v}%`} contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>{src.map(s=><span key={s.n} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:C.slate}}><span style={{width:8,height:8,borderRadius:"50%",background:s.c,display:"inline-block"}}/>{s.n} {s.v}%</span>)}</div></div>
          <div style={card}><STitle>Conversão por Etapa</STitle>{STAGES.map((s,i)=>{const n=leads.filter(l=>l.stage===s).length;const prev=i>0?leads.filter(l=>l.stage===STAGES[i-1]).length:null;const pct=prev?Math.round((n/prev)*100):null;return(<div key={s} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}><span style={{width:82,fontSize:12,color:C.slate,flexShrink:0}}>{s}</span><div style={{flex:1,background:C.light,borderRadius:4,height:22,overflow:"hidden"}}><div style={{width:`${Math.max(n*22,8)}%`,background:SC[s].c,height:"100%",borderRadius:4,display:"flex",alignItems:"center",paddingLeft:8}}><span style={{color:"white",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{n}</span></div></div>{pct!==null?<span style={{width:38,fontSize:11,color:pct<50?C.red:C.green,fontWeight:700,textAlign:"right",flexShrink:0}}>{pct}%</span>:<span style={{width:38}}/>}</div>);})}</div>
          <div style={card}><STitle>KPIs Principais</STitle>{[{l:"Taxa de conversão",v:"22%",ok:true},{l:"Ticket médio",v:"R$ 17,9K",ok:true},{l:"Automações ativas",v:autos.filter(a=>a.active).length,ok:true},{l:"Leads Meta Ads",v:ADS_CAMPAIGNS.reduce((a,c)=>a+c.leads,0),ok:true},{l:"Score médio",v:`${Math.round(leads.reduce((a,l)=>a+(l.score||50),0)/leads.length)}/100`,ok:true},{l:"Tarefas atrasadas",v:overdue,ok:overdue===0}].map((k,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<5?`1px solid ${C.light}`:"none"}}><span style={{fontSize:13,color:C.text}}>{k.l}</span><span style={{fontSize:16,fontWeight:700,color:k.ok?C.green:C.red}}>{k.v}</span></div>)}</div>
        </Grid>
      </Pg>
    );
  };

  const Settings=()=>{
    const members=[{name:"Ana Silva",email:"ana@empresa.com",role:"Admin",avatar:"AS",c:C.green},{name:"Pedro Costa",email:"pedro@empresa.com",role:"Gestor",avatar:"PC",c:C.blue},{name:"Lara Mendes",email:"lara@empresa.com",role:"Vendedor",avatar:"LM",c:C.amber}];
    return(
      <Pg title="Configurações" sub="Workspace e integrações">
        <Grid cols={2} gap={14}>
          <div style={card}><STitle>Workspace</STitle><div style={{marginTop:12}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{width:44,height:44,borderRadius:10,background:workspace.color||C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white"}}>{workspace.name[0]}</div><div><div style={{fontWeight:600,color:C.text}}>{workspace.name}</div><div style={{fontSize:12,color:C.slate}}>Plano {workspace.plan||"Starter"}</div></div></div>{[{l:"Moeda",v:"BRL (R$)"},{l:"Fuso horário",v:"America/Sao_Paulo"},{l:"Idioma",v:"Português (BR)"}].map((f,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.light}`,fontSize:13}}><span style={{color:C.slate}}>{f.l}</span><span style={{color:C.text,fontWeight:500}}>{f.v}</span></div>)}</div></div>
          <div style={card}><STitle>Equipe</STitle><div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>{members.map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:"50%",background:m.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white",flexShrink:0}}>{m.avatar}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.email}</div></div><span style={{background:C.light,color:C.slate,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:500}}>{m.role}</span></div>)}<button style={{marginTop:4,background:"none",border:`1px dashed ${C.border}`,borderRadius:8,padding:"8px",fontSize:12,color:C.slate,cursor:"pointer"}}>+ Convidar membro</button></div></div>
          <div style={card}><STitle>Integrações</STitle><div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>{[{n:"Meta Ads",s:"Conectado",ok:true,icon:"📢"},{n:"WhatsApp",s:"Conectado",ok:true,icon:"💬"},{n:"Google Ads",s:"Desconectado",ok:false,icon:"🔍"},{n:"RD Station",s:"Desconectado",ok:false,icon:"📧"},{n:"Stripe/Pix",s:"Desconectado",ok:false,icon:"💳"}].map((itg,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18,width:28}}>{itg.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.text}}>{itg.n}</div></div><span style={{background:itg.ok?C.greenBg:C.light,color:itg.ok?C.greenTx:C.slate,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:500}}>{itg.s}</span>{!itg.ok&&<button style={{background:C.blueBg,color:C.blue,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>Conectar</button>}</div>)}</div></div>
          <div style={card}><STitle>API & Webhooks</STitle><div style={{marginTop:12}}><div style={{fontSize:12,color:C.slate,marginBottom:6}}>Webhook URL (Meta Ads)</div><div style={{background:C.light,borderRadius:8,padding:"10px 12px",fontFamily:"monospace",fontSize:11,color:C.text}}>{API}/api/webhooks/meta</div></div></div>
        </Grid>
      </Pg>
    );
  };

  const LeadDrawer=()=>{
    if(!selLead)return null;const l=selLead;const cfg=SC[l.stage]||SC["Novo Lead"];
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:200,display:"flex",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&(setSelLead(null),setAiData(null))}>
        <div style={{width:430,background:"white",height:"100%",overflowY:"auto",boxShadow:"-8px 0 32px rgba(0,0,0,0.12)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:"white",zIndex:1}}>
            <Row mb={8}><div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:C.text}}>{l.name}</div><div style={{fontSize:12,color:C.slate,marginTop:2}}>{l.company}</div></div><button onClick={()=>{setSelLead(null);setAiData(null);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:20}}>✕</button></Row>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{badge(l.stage,cfg.c,cfg.bg,cfg.tx,true)}<ScoreBadge s={l.score||50}/></div>
          </div>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.light}`}}>
            <Grid cols={2} gap={10} mb={12}>{[{l:"Valor",v:fmt(l.value),c:C.green},{l:"Fonte",v:l.source||"—",c:C.text},{l:"Telefone",v:l.phone||"—",c:C.text},{l:"E-mail",v:l.email||"—",c:C.text}].map(x=><div key={x.l}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{x.l}</div><div style={{fontSize:13,fontWeight:500,color:x.c}}>{x.v}</div></div>)}</Grid>
            {l.notes&&<><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Notas</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6,background:C.light,borderRadius:8,padding:"10px 12px"}}>{l.notes}</div></>}
          </div>
          <div style={{padding:"14px 20px"}}>
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
        </div>
      </div>
    );
  };

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',background:C.light,overflow:"hidden"}}>
      <div style={{width:200,background:C.dark,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,background:C.green,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"white"}}>C</div>
            <span style={{color:"white",fontWeight:700,fontSize:14}}>CRM Pro</span>
          </div>
          <div onClick={()=>setWorkspace(null)} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.06)",borderRadius:7,padding:"6px 8px",cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}>
            <div style={{width:20,height:20,borderRadius:4,background:workspace.color||C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",flexShrink:0}}>{workspace.name[0]}</div>
            <span style={{color:"#94a3b8",fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{workspace.name}</span>
            <span style={{color:"#475569",fontSize:10}}>⇅</span>
          </div>
        </div>
        <nav style={{padding:"8px",flex:1,overflowY:"auto"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,border:"none",cursor:"pointer",marginBottom:1,background:tab===item.id?"rgba(16,185,129,0.15)":"transparent",color:tab===item.id?C.green:"#94a3b8",fontSize:12,fontWeight:tab===item.id?600:400,textAlign:"left"}}>
              <span style={{fontSize:13,width:16,textAlign:"center"}}>{item.icon}</span>{item.label}
              {item.id==="tasks"&&overdue>0&&<span style={{marginLeft:"auto",background:C.red,color:"white",borderRadius:"50%",width:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{overdue}</span>}
              {item.id==="whatsapp"&&unreadWA>0&&<span style={{marginLeft:"auto",background:C.green,color:"white",borderRadius:"50%",width:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{unreadWA}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,background:C.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",flexShrink:0}}>{authUser.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div style={{flex:1,minWidth:0}}><div style={{color:"white",fontSize:11,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{authUser.name}</div><div style={{color:"#475569",fontSize:10}}>{workspace.role||"Admin"}</div></div>
            <button onClick={()=>{setAuthUser(null);setWorkspace(null);setWsList([]);setTab("dashboard");localStorage.removeItem("crm_token");}} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:13}}>⏻</button>
          </div>
        </div>
      </div>
      <main style={{flex:1,overflow:"auto"}}>
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
    </div>
  );
}
function Pg({title,sub,children,onNew}){
  return(
    <div style={{padding:24}}>
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h1 style={{margin:0,fontSize:19,fontWeight:700,color:"#1e293b"}}>{title}</h1><p style={{margin:"3px 0 0",fontSize:12,color:"#64748b"}}>{sub}</p></div>
        {onNew&&<button onClick={onNew} style={{background:"#10b981",color:"white",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Novo Lead</button>}
      </div>
      {children}
    </div>
  );
}
function STitle({children}){return <div style={{fontWeight:600,color:"#1e293b",fontSize:13,marginBottom:8}}>{children}</div>;}
function Row({children,mb}){return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:mb||0}}>{children}</div>;}
function Grid({cols,gap,mb,children}){return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,gap,marginBottom:mb||0}}>{children}</div>;}
function Avatar({name,size=28}){if(!name)return null;const initials=name.split(" ").map(n=>n[0]).join("");return <div style={{width:size,height:size,borderRadius:"50%",background:"#f1f5f9",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.37,fontWeight:700,color:"#64748b",flexShrink:0}}>{initials}</div>;}
function ScoreBadge({s}){const score=s||50;const bg=score>=80?"#ecfdf5":score>=60?"#fffbeb":"#fef2f2";const tx=score>=80?"#047857":score>=60?"#b45309":"#b91c1c";return <span style={{background:bg,color:tx,borderRadius:5,padding:"1px 7px",fontSize:11,fontWeight:700,flexShrink:0}}>{score}</span>;}
function Toggle({active,onToggle}){return(<div onClick={e=>{e.stopPropagation();onToggle();}} style={{width:38,height:20,borderRadius:10,background:active?"#10b981":"#e2e8f0",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:active?20:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/></div>);}
