const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA = path.join(__dirname, "data.json");
const sessions = new Map();

app.use(express.json({ limit: "1mb" }));
// Embedded frontend for simple deployment
const embeddedPublic = {
  "index.html": `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>STAR Store — متجر البطاقات الرقمية</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="top">
  <div class="wrap nav">
    <a class="brand" href="#home">STAR<span>STORE</span></a>
    <nav>
      <a href="#home">الرئيسية</a><a href="#products">المتجر</a><a href="#topup">شحن الرصيد</a>
      <a href="#orders">طلباتي</a><a href="#admin" id="adminLink" hidden>الإدارة</a>
    </nav>
    <div class="account"><span id="balancePill" class="pill">الرصيد: 0</span><button id="loginBtn" class="ghost">دخول</button><button id="logoutBtn" class="ghost" hidden>خروج</button></div>
  </div>
</header>

<main>
<section id="home" class="hero"><div class="wrap hero-grid">
  <div><div class="eyebrow">متجر رقمي • تسليم فوري</div><h1>كل بطاقاتك الرقمية<br><span>في مكان واحد.</span></h1>
  <p>تصفح المنتجات، اشحن رصيدك، واشترِ مباشرة من محفظتك الرقمية.</p>
  <div class="actions"><a href="#products" class="btn primary">تصفح المتجر</a><a href="#topup" class="btn secondary">اشحن رصيدك</a></div></div>
  <div class="hero-card"><div class="orb"></div><div class="mini-card"><b>STAR</b><span>DIGITAL CARD</span><strong>50.00</strong></div></div>
</div></section>

<section class="wrap features"><div><b>⚡ فوري</b><span>استلام الكود بعد الدفع</span></div><div><b>🔒 آمن</b><span>حساب ومحفظة شخصية</span></div><div><b>💳 مرن</b><span>اشحن رصيدك بالطريقة المناسبة</span></div></section>

<section id="products" class="wrap section"><div class="section-head"><div><small>المتجر</small><h2>المنتجات</h2></div><div id="productCount"></div></div><div id="productsGrid" class="grid"></div></section>

<section id="topup" class="wrap section split"><div><small>المحفظة</small><h2>شحن الرصيد</h2><p>أرسل طلب الشحن، وبعد التحقق واعتماد العملية يضاف المبلغ إلى محفظتك.</p>
<div class="topup-box"><label>المبلغ</label><div class="amounts"><button data-amt="10">10</button><button data-amt="25">25</button><button data-amt="50">50</button><button data-amt="100">100</button></div>
<input id="topAmount" type="number" min="1" placeholder="مبلغ آخر">
<label>طريقة الشحن</label><select id="topMethod"><option value="manual">تحويل / دفع يدوي</option><option value="voucher">قسيمة شحن</option><option value="gateway">بوابة دفع</option></select>
<label>رقم العملية / الملاحظة</label><input id="topRef" placeholder="اختياري">
<button id="topupBtn" class="btn primary full">إرسال طلب الشحن</button></div></div>
<div class="panel"><h3>آخر عمليات الشحن</h3><div id="topupsList" class="list"></div></div></section>

<section id="orders" class="wrap section"><div class="section-head"><div><small>الحساب</small><h2>طلباتي</h2></div></div><div id="ordersList" class="orders"></div></section>

<section id="admin" class="wrap section" hidden><div class="section-head"><div><small>لوحة التحكم</small><h2>الإدارة</h2></div></div><div id="stats" class="stats"></div><div class="admin-grid"><div class="panel"><h3>طلبات الشحن</h3><div id="adminTopups"></div></div><div class="panel"><h3>إضافة منتج</h3><input id="newName" placeholder="اسم المنتج"><input id="newCategory" placeholder="التصنيف" value="بطاقات رقمية"><input id="newPrice" type="number" placeholder="السعر"><input id="newStock" type="number" placeholder="المخزون"><input id="newPrefix" placeholder="بادئة الأكواد" value="CARD"><textarea id="newDesc" placeholder="الوصف"></textarea><button id="addProduct" class="btn primary full">إضافة</button><hr><h3>المنتجات</h3><div id="adminProducts"></div></div></div></section>
</main>

<div id="modal" class="modal" hidden><div class="modal-card"><button id="closeModal" class="close">×</button><div id="modalBody"></div></div></div>
<footer><div class="wrap"><b>STAR STORE</b><span>متجر رقمي تجريبي قابل للتخصيص والإطلاق.</span></div></footer>
<script src="/app.js"></script>
</body></html>
`,
  "style.css": `:root{--bg:#07090f;--panel:#10141d;--panel2:#151b27;--text:#f6f7fb;--muted:#9aa3b5;--line:#252c3a;--accent:#8b5cf6;--accent2:#c084fc;--ok:#34d399;--danger:#fb7185}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 80% 0,#17112b 0,transparent 35%),var(--bg);color:var(--text);font-family:Tahoma,Arial,sans-serif;line-height:1.7}.wrap{width:min(1120px,92%);margin:auto}.top{position:sticky;top:0;z-index:20;background:#07090fe8;backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.nav{height:72px;display:flex;align-items:center;gap:28px}.brand{font-size:20px;font-weight:900;color:white;text-decoration:none;letter-spacing:.5px}.brand span{color:var(--accent2);margin-right:5px}.nav nav{display:flex;gap:18px;flex:1}.nav nav a{color:#c5cada;text-decoration:none;font-size:14px}.nav nav a:hover{color:white}.account{display:flex;gap:8px;align-items:center}.pill,.ghost{border:1px solid var(--line);background:#0d1119;color:#dce1ec;border-radius:10px;padding:7px 11px;font-size:12px}.ghost{cursor:pointer}.hero{padding:95px 0 70px;border-bottom:1px solid var(--line)}.hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:60px;align-items:center}.eyebrow,small{color:var(--accent2);font-weight:700;font-size:12px;letter-spacing:1px}h1{font-size:clamp(42px,6vw,72px);line-height:1.08;margin:12px 0 20px;letter-spacing:-2px}h1 span{color:var(--accent2)}h2{font-size:32px;margin:5px 0 15px}p{color:var(--muted)}.actions{display:flex;gap:10px;margin-top:28px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:12px;padding:12px 18px;font-weight:800;text-decoration:none;cursor:pointer}.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white}.secondary{background:#171d28;color:white;border:1px solid var(--line)}.full{width:100%;margin-top:12px}.hero-card{min-height:310px;display:grid;place-items:center;position:relative}.orb{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#7c3aed55,transparent 65%);filter:blur(8px)}.mini-card{position:relative;width:290px;height:175px;border:1px solid #ffffff25;border-radius:22px;background:linear-gradient(135deg,#1b1f2b,#090b11);box-shadow:0 25px 70px #0009;padding:25px;display:flex;flex-direction:column;justify-content:space-between;transform:rotate(-5deg)}.mini-card span{font-size:10px;color:#aeb5c4}.mini-card strong{font-size:34px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:24px 0}.features>div,.panel,.topup-box{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px}.features b,.features span{display:block}.features span{color:var(--muted);font-size:13px}.section{padding:75px 0}.section-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:25px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.product{background:linear-gradient(180deg,#121722,#0d1119);border:1px solid var(--line);border-radius:18px;padding:18px;transition:.2s}.product:hover{transform:translateY(-3px);border-color:#4a3a72}.product-art{height:145px;border-radius:14px;background:radial-gradient(circle at 20% 20%,#a855f755,transparent 40%),#151a24;display:flex;align-items:end;padding:16px;margin-bottom:16px}.product-art b{font-size:22px}.product-meta{display:flex;justify-content:space-between;gap:10px}.price{font-size:21px;font-weight:900}.stock{font-size:12px;color:var(--muted)}.split{display:grid;grid-template-columns:1fr 1fr;gap:22px}.topup-box{margin-top:20px}label{display:block;font-size:12px;color:#c5cada;margin:12px 0 5px}input,select,textarea{width:100%;background:#0a0d13;border:1px solid var(--line);color:white;border-radius:10px;padding:11px;margin-bottom:6px;outline:none}textarea{min-height:80px}.amounts{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.amounts button{background:#171d28;color:white;border:1px solid var(--line);border-radius:9px;padding:9px;cursor:pointer}.amounts button.active{border-color:var(--accent2);background:#271c3e}.list,.orders{display:flex;flex-direction:column;gap:9px}.row{display:flex;justify-content:space-between;gap:10px;padding:13px;border-bottom:1px solid var(--line);font-size:13px}.status{border-radius:999px;padding:2px 8px;font-size:11px}.pending{background:#6b4b142e;color:#fbbf24}.approved,.completed{background:#064e3b44;color:var(--ok)}.rejected{background:#7f1d1d44;color:var(--danger)}.order-card{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:16px}.code{margin-top:10px;background:#080a0f;border:1px dashed #4a5262;padding:10px;border-radius:9px;font-family:monospace;direction:ltr;text-align:center}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.stat{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:17px}.stat strong{display:block;font-size:27px}.admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.admin-item{border-bottom:1px solid var(--line);padding:12px 0}.admin-item button{margin:3px}.danger{background:#40141d;color:#fecdd3;border:1px solid #6b1f2c;border-radius:8px;padding:7px;cursor:pointer}.modal{position:fixed;inset:0;background:#000b;z-index:50;display:grid;place-items:center;padding:20px}.modal-card{width:min(440px,100%);background:#111722;border:1px solid var(--line);border-radius:18px;padding:24px;position:relative}.close{position:absolute;left:15px;top:10px;background:none;border:0;color:white;font-size:28px;cursor:pointer}footer{border-top:1px solid var(--line);padding:25px 0;color:var(--muted)}footer .wrap{display:flex;justify-content:space-between}hr{border:0;border-top:1px solid var(--line);margin:20px 0}@media(max-width:850px){.nav nav{display:none}.hero-grid,.split,.admin-grid{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr}.features,.stats{grid-template-columns:1fr 1fr}.hero{padding-top:55px}}@media(max-width:560px){.grid,.features,.stats{grid-template-columns:1fr}.account .pill{display:none}.nav{justify-content:space-between}h1{font-size:44px}footer .wrap{display:block}}
`,
  "app.js": `const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let token=localStorage.getItem("star_token"), me=null, products=[];

async function api(url,opts={}) {
  const headers={"Content-Type":"application/json",...(opts.headers||{})};
  if(token) headers.Authorization="Bearer "+token;
  const r=await fetch(url,{...opts,headers});
  const d=await r.json().catch(()=>({ok:false,error:"خطأ غير متوقع"}));
  if(!r.ok) throw new Error(d.error||"تعذر تنفيذ العملية");
  return d;
}
function money(n){return Number(n).toFixed(2)}
function status(s){const map={pending:"قيد المراجعة",approved:"تم الاعتماد",rejected:"مرفوض",completed:"مكتمل"};return \`<span class="status \${s}">\${map[s]||s}</span>\`}
function modal(html){$("#modalBody").innerHTML=html;$("#modal").hidden=false}
$("#closeModal").onclick=()=>$("#modal").hidden=true;

function loginModal(){
 modal(\`<h2>تسجيل الدخول</h2><input id="lemail" type="email" placeholder="البريد الإلكتروني"><input id="lpass" type="password" placeholder="كلمة المرور"><button id="doLogin" class="btn primary full">دخول</button><p>ليس لديك حساب؟ <a href="#" id="showRegister">إنشاء حساب</a></p>\`);
 $("#doLogin").onclick=async()=>{try{const d=await api("/api/login",{method:"POST",body:JSON.stringify({email:$("#lemail").value,password:$("#lpass").value})});token=d.token;localStorage.setItem("star_token",token);$("#modal").hidden=true;await refresh()}catch(e){alert(e.message)}};
 $("#showRegister").onclick=e=>{e.preventDefault();registerModal()}
}
function registerModal(){
 modal(\`<h2>إنشاء حساب</h2><input id="rname" placeholder="الاسم"><input id="remail" type="email" placeholder="البريد الإلكتروني"><input id="rpass" type="password" placeholder="كلمة المرور"><button id="doRegister" class="btn primary full">إنشاء الحساب</button>\`);
 $("#doRegister").onclick=async()=>{try{const d=await api("/api/register",{method:"POST",body:JSON.stringify({name:$("#rname").value,email:$("#remail").value,password:$("#rpass").value})});token=d.token;localStorage.setItem("star_token",token);$("#modal").hidden=true;await refresh()}catch(e){alert(e.message)}};
}
$("#loginBtn").onclick=loginModal;
$("#logoutBtn").onclick=async()=>{await api("/api/logout",{method:"POST"}).catch(()=>{});token=null;localStorage.removeItem("star_token");await refresh()};

async function loadProducts(){
 const d=await api("/api/products");products=d.products;$("#productCount").textContent=\`\${products.length} منتجات\`;
 $("#productsGrid").innerHTML=products.map(p=>\`<article class="product"><div class="product-art"><b>\${escapeHtml(p.category)}</b></div><h3>\${escapeHtml(p.name)}</h3><p>\${escapeHtml(p.description||"بطاقة رقمية")}</p><div class="product-meta"><div><div class="price">\${money(p.price)}</div><div class="stock">\${p.stock>0?\`متوفر (\${p.stock})\`:"غير متوفر"}</div></div><button class="btn primary buy" data-id="\${p.id}" \${p.stock<=0?"disabled":""}>شراء</button></div></article>\`).join("");
 $$(".buy").forEach(b=>b.onclick=()=>buy(b.dataset.id));
}
async function buy(id){
 if(!me){loginModal();return}
 const p=products.find(x=>x.id===id);
 if(!confirm(\`شراء \${p.name} مقابل \${money(p.price)}؟\`))return;
 try{const d=await api("/api/orders",{method:"POST",body:JSON.stringify({productId:id})});alert("تم الشراء بنجاح. الكود: "+d.order.code);await refresh()}catch(e){alert(e.message)}
}
async function loadTopups(){
 if(!me){$("#topupsList").innerHTML='<div class="row">سجل الدخول لعرض عمليات الشحن.</div>';return}
 const d=await api("/api/topups");$("#topupsList").innerHTML=d.topups.length?d.topups.map(t=>\`<div class="row"><span>\${money(t.amount)} • \${t.method}</span>\${status(t.status)}</div>\`).join(""):'<div class="row">لا توجد عمليات شحن.</div>';
}
async function loadOrders(){
 if(!me){$("#ordersList").innerHTML='<div class="panel">سجل الدخول لعرض طلباتك.</div>';return}
 const d=await api("/api/orders");$("#ordersList").innerHTML=d.orders.length?d.orders.map(o=>\`<div class="order-card"><b>\${escapeHtml(o.productName)}</b><span style="float:left">\${money(o.amount)}</span><div>\${status(o.status)} • \${new Date(o.createdAt).toLocaleString("ar")}</div><div class="code">\${escapeHtml(o.code)}</div></div>\`).join(""):'<div class="panel">لا توجد طلبات بعد.</div>';
}
$$(".amounts button").forEach(b=>b.onclick=()=>{$$("#.amounts button")?.forEach?.(()=>{});$$(".amounts button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#topAmount").value=b.dataset.amt});
$("#topupBtn").onclick=async()=>{if(!me){loginModal();return}const amount=Number($("#topAmount").value);if(!amount)return alert("أدخل مبلغ الشحن.");try{await api("/api/topups",{method:"POST",body:JSON.stringify({amount,method:$("#topMethod").value,reference:$("#topRef").value})});alert("تم إرسال طلب الشحن.");$("#topAmount").value="";$("#topRef").value="";await loadTopups()}catch(e){alert(e.message)}};

async function loadAdmin(){
 if(!me||me.role!=="admin"){ $("#admin").hidden=true; return }
 $("#admin").hidden=false;
 const d=await api("/api/admin/overview");
 $("#stats").innerHTML=[["المستخدمون",d.stats.users],["المنتجات",d.stats.products],["شحنات معلقة",d.stats.pendingTopups],["المبيعات",money(d.stats.sales)]].map(x=>\`<div class="stat"><span>\${x[0]}</span><strong>\${x[1]}</strong></div>\`).join("");
 $("#adminTopups").innerHTML=d.topups.length?d.topups.map(t=>\`<div class="admin-item"><b>\${money(t.amount)}</b> — \${escapeHtml(t.user)}<br>\${status(t.status)} \${t.status==="pending"?\`<button class="btn primary approve" data-id="\${t.id}">اعتماد</button><button class="danger reject" data-id="\${t.id}">رفض</button>\`:""}</div>\`).join(""):"لا توجد طلبات";
 $$(".approve").forEach(b=>b.onclick=()=>reviewTopup(b.dataset.id,"approved"));$$(".reject").forEach(b=>b.onclick=()=>reviewTopup(b.dataset.id,"rejected"));
 $("#adminProducts").innerHTML=d.products.map(p=>\`<div class="admin-item"><b>\${escapeHtml(p.name)}</b> — \${money(p.price)} — \${p.stock}<button class="danger del" data-id="\${p.id}">حذف</button></div>\`).join("");
 $$(".del").forEach(b=>b.onclick=async()=>{if(confirm("حذف المنتج؟")){await api("/api/admin/products/"+b.dataset.id,{method:"DELETE"});await loadAdmin();await loadProducts()}});
}
async function reviewTopup(id,statusValue){try{await api("/api/admin/topups/"+id,{method:"POST",body:JSON.stringify({status:statusValue})});await refresh()}catch(e){alert(e.message)}}
$("#addProduct").onclick=async()=>{try{await api("/api/admin/products",{method:"POST",body:JSON.stringify({name:$("#newName").value,category:$("#newCategory").value,price:Number($("#newPrice").value),stock:Number($("#newStock").value),codePrefix:$("#newPrefix").value,description:$("#newDesc").value})});["newName","newPrice","newStock","newDesc"].forEach(x=>$("#"+x).value="");await loadAdmin();await loadProducts()}catch(e){alert(e.message)}};

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function refresh(){
 try{const d=await api("/api/me");me=d.user}catch(e){me=null}
 $("#loginBtn").hidden=!!me;$("#logoutBtn").hidden=!me;$("#adminLink").hidden=!(me&&me.role==="admin");$("#balancePill").textContent=me?\`الرصيد: \${money(me.balance)}\`:"الرصيد: 0";
 await loadProducts();await loadTopups();await loadOrders();await loadAdmin();
}
refresh();
`
};
const embeddedDir = path.join(__dirname, "public");
if (!fs.existsSync(embeddedDir)) fs.mkdirSync(embeddedDir, {recursive:true});
for (const [name, content] of Object.entries(embeddedPublic)) fs.writeFileSync(path.join(embeddedDir, name), content, "utf8");

app.use(express.static(path.join(__dirname, "public")));

function load() {
  if (!fs.existsSync(DATA)) {
    const seed = {
      users: [],
      products: [
        {id:"p1",name:"بطاقة رقمية 10$",category:"بطاقات رقمية",price:10,stock:20,description:"بطاقة رقمية فورية.",codePrefix:"STAR10"},
        {id:"p2",name:"بطاقة رقمية 25$",category:"بطاقات رقمية",price:25,stock:15,description:"بطاقة رقمية فورية.",codePrefix:"STAR25"},
        {id:"p3",name:"بطاقة رقمية 50$",category:"بطاقات رقمية",price:50,stock:10,description:"بطاقة رقمية فورية.",codePrefix:"STAR50"}
      ],
      topups: [],
      orders: []
    };
    save(seed);
  }
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}
function save(db){ fs.writeFileSync(DATA, JSON.stringify(db,null,2)); }
function id(prefix="id"){ return prefix+"_"+crypto.randomBytes(6).toString("hex"); }
function hash(p){ return crypto.createHash("sha256").update(String(p)).digest("hex"); }

function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ","");
  const uid = token && sessions.get(token);
  if (!uid) return null;
  const db=load();
  return db.users.find(u=>u.id===uid) || null;
}
function admin(req){
  const u=getUser(req);
  return u && u.role==="admin" ? u : null;
}
function publicUser(u){
  return {id:u.id,email:u.email,name:u.name,balance:u.balance,role:u.role,createdAt:u.createdAt};
}
function ok(res,data){ res.json({ok:true,...data}); }
function fail(res,status,msg){ res.status(status).json({ok:false,error:msg}); }

app.post("/api/register",(req,res)=>{
  const {email,password,name=""}=req.body||{};
  if(!email||!password||password.length<6) return fail(res,400,"أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل.");
  const db=load();
  if(db.users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return fail(res,409,"البريد مستخدم بالفعل.");
  const u={id:id("u"),email:email.toLowerCase(),password:hash(password),name:name.trim()||"عميل",balance:0,role:"user",createdAt:new Date().toISOString()};
  db.users.push(u); save(db);
  const token=crypto.randomBytes(32).toString("hex"); sessions.set(token,u.id);
  ok(res,{token,user:publicUser(u)});
});

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body||{}, db=load();
  let u=db.users.find(x=>x.email===String(email||"").toLowerCase() && x.password===hash(password||""));
  if(!u && email===process.env.ADMIN_EMAIL && password===process.env.ADMIN_PASSWORD){
    u=db.users.find(x=>x.email===String(email).toLowerCase());
    if(!u){ u={id:id("u"),email:String(email).toLowerCase(),password:hash(password),name:"Administrator",balance:0,role:"admin",createdAt:new Date().toISOString()}; db.users.push(u); save(db); }
  }
  if(!u) return fail(res,401,"بيانات الدخول غير صحيحة.");
  const token=crypto.randomBytes(32).toString("hex"); sessions.set(token,u.id);
  ok(res,{token,user:publicUser(u)});
});

app.post("/api/logout",(req,res)=>{
  const token=req.headers.authorization?.replace("Bearer ",""); if(token) sessions.delete(token); ok(res,{});
});

app.get("/api/me",(req,res)=>{
  const u=getUser(req); if(!u) return fail(res,401,"غير مسجل الدخول.");
  ok(res,{user:publicUser(u)});
});

app.get("/api/products",(req,res)=>{
  const db=load(); ok(res,{products:db.products.map(p=>({...p}))});
});

app.get("/api/orders",(req,res)=>{
  const u=getUser(req); if(!u) return fail(res,401,"سجل الدخول أولًا.");
  const db=load(); ok(res,{orders:db.orders.filter(o=>o.userId===u.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
});

app.post("/api/orders",(req,res)=>{
  const u=getUser(req); if(!u) return fail(res,401,"سجل الدخول أولًا.");
  const {productId}=req.body||{}, db=load(), p=db.products.find(x=>x.id===productId);
  if(!p) return fail(res,404,"المنتج غير موجود.");
  if(p.stock<=0) return fail(res,400,"المنتج غير متوفر.");
  if(u.balance<p.price) return fail(res,400,"الرصيد غير كافٍ. اشحن محفظتك أولًا.");
  const dbUser=db.users.find(x=>x.id===u.id);
  dbUser.balance-=p.price; p.stock-=1;
  const code=p.codePrefix+"-"+crypto.randomBytes(5).toString("hex").toUpperCase();
  const order={id:id("ord"),userId:u.id,productId:p.id,productName:p.name,amount:p.price,status:"completed",code,createdAt:new Date().toISOString()};
  db.orders.push(order); save(db);
  ok(res,{order,balance:dbUser.balance});
});

app.get("/api/topups",(req,res)=>{
  const u=getUser(req); if(!u) return fail(res,401,"سجل الدخول أولًا.");
  const db=load();
  const rows=db.topups.filter(t=>t.userId===u.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  ok(res,{topups:rows});
});

app.post("/api/topups",(req,res)=>{
  const u=getUser(req); if(!u) return fail(res,401,"سجل الدخول أولًا.");
  const {amount,method="manual",reference=""}=req.body||{};
  const n=Number(amount);
  if(!Number.isFinite(n)||n<=0||n>10000) return fail(res,400,"مبلغ الشحن غير صالح.");
  const db=load();
  const t={id:id("top"),userId:u.id,amount:n,method,reference:String(reference).slice(0,200),status:"pending",createdAt:new Date().toISOString()};
  db.topups.push(t); save(db);
  ok(res,{topup:t,message:"تم إنشاء طلب الشحن، وسيظهر الرصيد بعد اعتماد العملية."});
});

app.get("/api/admin/overview",(req,res)=>{
  if(!admin(req)) return fail(res,403,"صلاحيات المدير مطلوبة.");
  const db=load();
  ok(res,{stats:{
    users:db.users.length,
    products:db.products.length,
    pendingTopups:db.topups.filter(t=>t.status==="pending").length,
    orders:db.orders.length,
    sales:db.orders.reduce((s,o)=>s+o.amount,0)
  },topups:db.topups.map(t=>({...t,user:db.users.find(u=>u.id===t.userId)?.email||"—"})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
  users:db.users.map(publicUser),
  products:db.products,
  orders:db.orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
});

app.post("/api/admin/topups/:id",(req,res)=>{
  if(!admin(req)) return fail(res,403,"صلاحيات المدير مطلوبة.");
  const {status}=req.body||{}, db=load(), t=db.topups.find(x=>x.id===req.params.id);
  if(!t) return fail(res,404,"طلب الشحن غير موجود.");
  if(!["approved","rejected"].includes(status)) return fail(res,400,"حالة غير صالحة.");
  if(t.status!=="pending") return fail(res,400,"تمت معالجة الطلب سابقًا.");
  t.status=status;
  if(status==="approved"){
    const u=db.users.find(x=>x.id===t.userId);
    if(u) u.balance+=t.amount;
  }
  t.processedAt=new Date().toISOString(); save(db); ok(res,{topup:t});
});

app.post("/api/admin/products",(req,res)=>{
  if(!admin(req)) return fail(res,403,"صلاحيات المدير مطلوبة.");
  const {name,category="بطاقات رقمية",price,stock=0,description="",codePrefix="CARD"}=req.body||{}, n=Number(price), s=Number(stock);
  if(!name||!Number.isFinite(n)||n<=0||s<0) return fail(res,400,"بيانات المنتج غير صحيحة.");
  const db=load(), p={id:id("p"),name,category,price:n,stock:s,description,codePrefix};
  db.products.push(p); save(db); ok(res,{product:p});
});

app.delete("/api/admin/products/:id",(req,res)=>{
  if(!admin(req)) return fail(res,403,"صلاحيات المدير مطلوبة.");
  const db=load(); db.products=db.products.filter(p=>p.id!==req.params.id); save(db); ok(res,{});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Store running on http://localhost:${PORT}`));
