import{a as b,f as A}from"./gfEUUZ-Y.js";import{af as J,aa as p,ab as s,ac as a,ad as C,g as e,ag as K,av as W,au as X,ah as V,ae as Z}from"./CfWf1j4w.js";import{s as E}from"./DgRZTu1t.js";import{i as B}from"./Bb0Ndv_m.js";import{e as G}from"./BILUrGle.js";import{s as $}from"./z30ZacIF.js";import{c as tt}from"./BqGHGP1s.js";const O=(_,l=X)=>{var R=ot(),P=V(R),i=s(P),k=s(i);a(i),Z(2),a(P);var j=p(P,2);G(j,17,()=>l().sections,y=>y.heading,(y,D)=>{var m=lt(),r=s(m),f=s(r,!0);a(r);var S=p(r,2),d=s(S);G(d,19,()=>e(D).lines,(v,n)=>v.label+n,(v,n,o)=>{var g=at(),h=V(g);{var L=u=>{var t=et();b(u,t)};B(h,u=>{e(o)>0&&u(L)})}var c=p(h,2);{var N=u=>{var t=nt(),w=s(t);a(t),C(()=>E(w,`${e(n).value??""}% ${e(n).label??""}`)),b(u,t)},q=u=>{var t=rt(),w=s(t);a(t),C(()=>E(w,`${e(n).value??""}% ${e(n).label??""}`)),b(u,t)};B(c,u=>{e(n).isMaxInSection?u(N):u(q,-1)})}b(v,g)});var T=p(d,2);{var x=v=>{var n=st();G(n,21,()=>e(D).lines.filter(o=>o.note),o=>o.label,(o,g)=>{var h=it(),L=s(h,!0);a(h),C(()=>E(L,e(g).note)),b(o,h)}),a(n),b(v,n)},I=W(()=>e(D).lines.some(v=>v.note));B(T,v=>{e(I)&&v(x)})}a(S),a(m),C(()=>E(f,e(D).heading)),b(y,m)}),C(()=>E(k,`${l().quadrantPct??""}%`)),b(_,R)};var et=A('<span class="quad__sep">,</span>'),nt=A('<strong class="quad__emph svelte-1gpav7j"> </strong>'),rt=A("<span> </span>"),at=A("<!> <!>",1),it=A('<em class="quad__note svelte-1gpav7j"> </em>'),st=A('<span class="quad__notes svelte-1gpav7j"></span>'),lt=A('<div class="quad__block svelte-1gpav7j"><h3 class="quad__attr svelte-1gpav7j"> </h3> <p class="quad__attr-body svelte-1gpav7j"><!> <!></p></div>'),ot=A('<p class="quad__cell-title svelte-1gpav7j"><strong class="quad__cell-pct svelte-1gpav7j"> </strong> <span class="quad__cell-of svelte-1gpav7j">of young men</span></p> <!>',1),ut=A('<div class="quad__grid svelte-1gpav7j"><div class="quad__corner svelte-1gpav7j" aria-hidden="true"></div> <div class="quad__colhead quad__colhead--rel svelte-1gpav7j"> </div> <div class="quad__colhead quad__colhead--self svelte-1gpav7j"> </div> <div class="quad__rowhead quad__rowhead--trust svelte-1gpav7j"><span class="quad__rowhead-text svelte-1gpav7j"> </span></div> <section class="quad__cell quad__cell--tl svelte-1gpav7j"><!></section> <section class="quad__cell quad__cell--tr svelte-1gpav7j"><!></section> <div class="quad__rowhead quad__rowhead--dist svelte-1gpav7j"><span class="quad__rowhead-text svelte-1gpav7j"> </span></div> <section class="quad__cell quad__cell--bl svelte-1gpav7j"><!></section> <section class="quad__cell quad__cell--br svelte-1gpav7j"><!></section></div>');function Rt(_,l){J(l,!0);let R=W(()=>l.data.trustAxis),P=W(()=>l.data.agencyAxis),i=W(()=>l.data.quadrants);function k(t){return t==="Relational"?`Relational (${e(P).relational}%)`:t==="Self-driven"?`Self-driven (${e(P).selfDriven}%)`:t}function j(t){return t==="Trusting"?`Trusting (${e(R).trusting}%)`:t==="Distrusting"?`Distrusting (${e(R).distrusting}%)`:t}function y(t){return`${t.trustLevel} · ${t.agency}`}var D=ut(),m=p(s(D),2),r=s(m,!0);a(m);var f=p(m,2),S=s(f,!0);a(f);var d=p(f,2),T=s(d),x=s(T,!0);a(T),a(d);var I=p(d,2),v=s(I);O(v,()=>e(i)[0]),a(I);var n=p(I,2),o=s(n);O(o,()=>e(i)[1]),a(n);var g=p(n,2),h=s(g),L=s(h,!0);a(h),a(g);var c=p(g,2),N=s(c);O(N,()=>e(i)[2]),a(c);var q=p(c,2),u=s(q);O(u,()=>e(i)[3]),a(q),a(D),C((t,w,H,Q,U,Y,F,z)=>{E(r,t),E(S,w),E(x,H),$(I,"aria-label",Q),$(n,"aria-label",U),E(L,Y),$(c,"aria-label",F),$(q,"aria-label",z)},[()=>k("Relational"),()=>k("Self-driven"),()=>j("Trusting"),()=>y(e(i)[0]),()=>y(e(i)[1]),()=>j("Distrusting"),()=>y(e(i)[2]),()=>y(e(i)[3])]),b(_,D),K()}function gt(_){const l=String(_).trimStart().toLowerCase();return l.startsWith("<!doctype html")||l.startsWith("<html")||l.startsWith("<style")}function M(_){if(_==null)return null;const l=String(_).trim().replace(/%$/,"");if(!l)return null;const R=Number(l);return Number.isFinite(R)?R:null}const ct={PID:"PID",Ideology:"IDEOLOGY","Race/Ethnicity":"RACE/ETHNICITY","Ed Attainment":"ED ATTAINMENT",Age:"AGE"},dt=[["Trusting","Relational"],["Trusting","Self-driven"],["Distrusting","Relational"],["Distrusting","Self-driven"]];function mt(_){if(_.trim().length===0)return{ok:!1,error:"`typology.csv` is empty or missing."};if(gt(_))return{ok:!1,error:"`typology.csv` looks like HTML (Google login / cookie wall), not CSV. Make the Google Sheet public, then run `npm run gdoc` to regenerate `src/lib/data/typology.csv`."};let l;try{l=tt(_)}catch(r){return{ok:!1,error:`Could not parse CSV: ${r instanceof Error?r.message:String(r)}`}}const R=["trust_level","agency","quadrant_pct","trust_pct","agency_pct","attribute","category","value"],P=l.columns??[];for(const r of R)if(!P.includes(r))return{ok:!1,error:`CSV must include a \`${r}\` column.`};const i=new Map;for(const r of l){const f=String(r.trust_level??"").trim(),S=String(r.agency??"").trim();if(!f||!S)continue;const d=`${f}|${S}`,T=i.get(d)??[];T.push(r),i.set(d,T)}const k=[];for(const[r,f]of dt){const S=`${r}|${f}`,d=i.get(S);if(!d?.length)return{ok:!1,error:`Missing rows for quadrant ${r} + ${f}.`};const T=M(d[0].quadrant_pct);if(T==null)return{ok:!1,error:`Invalid quadrant_pct for ${S}.`};const x=new Map;for(const n of d){const o=String(n.attribute??"").trim();if(!o)continue;const g=x.get(o)??[];g.push(n),x.set(o,g)}const I=[],v=Array.from(x.keys());for(const n of v){const o=x.get(n)??[],g=o.map(c=>M(c.value)).filter(c=>c!=null),h=g.length?Math.max(...g):0,L=o.map(c=>{const N=String(c.category??"").trim(),q=M(c.value),u=String(c.note??"").trim(),t=u.length?u:null;return{label:N,value:q??0,note:t,isMaxInSection:q!=null&&q===h}});I.push({heading:ct[n]??n.toUpperCase(),lines:L})}k.push({trustLevel:r,agency:f,quadrantPct:T,sections:I})}const j=M(i.get("Trusting|Relational")?.[0]?.trust_pct),y=M(i.get("Distrusting|Relational")?.[0]?.trust_pct),D=M(i.get("Trusting|Relational")?.[0]?.agency_pct),m=M(i.get("Trusting|Self-driven")?.[0]?.agency_pct);return j==null||y==null||D==null||m==null?{ok:!1,error:"Could not read axis percentages from CSV."}:{ok:!0,trustAxis:{trusting:j,distrusting:y},agencyAxis:{relational:D,selfDriven:m},quadrants:k}}const St=`trust_level,agency,quadrant_pct,trust_pct,agency_pct,attribute,category,value,note\r
Trusting,Relational,28,74,39,PID,Dem,22,\r
Trusting,Relational,28,74,39,PID,Rep,32,\r
Trusting,Relational,28,74,39,PID,Ind,39,\r
Trusting,Relational,28,74,39,PID,Other,7,\r
Trusting,Relational,28,74,39,Ideology,Moderate,43,\r
Trusting,Relational,28,74,39,Ideology,Conservative,26,\r
Trusting,Relational,28,74,39,Ideology,Liberal,20,\r
Trusting,Relational,28,74,39,Ideology,No opinion,10,\r
Trusting,Relational,28,74,39,Race/Ethnicity,White,52,\r
Trusting,Relational,28,74,39,Race/Ethnicity,Black,10,\r
Trusting,Relational,28,74,39,Race/Ethnicity,Latino,29,\r
Trusting,Relational,28,74,39,Race/Ethnicity,Asian,7,\r
Trusting,Relational,28,74,39,Ed Attainment,No degree,54,\r
Trusting,Relational,28,74,39,Ed Attainment,Degree,45,\r
Trusting,Relational,28,74,39,Age,18-24,39,\r
Trusting,Relational,28,74,39,Age,25-34,61,\r
Trusting,Self-driven,46,74,61,PID,Dem,20,\r
Trusting,Self-driven,46,74,61,PID,Rep,37,\r
Trusting,Self-driven,46,74,61,PID,Ind,38,\r
Trusting,Self-driven,46,74,61,PID,Other,5,\r
Trusting,Self-driven,46,74,61,Ideology,Conservative,36,\r
Trusting,Self-driven,46,74,61,Ideology,Moderate,39,\r
Trusting,Self-driven,46,74,61,Ideology,Liberal,18,\r
Trusting,Self-driven,46,74,61,Ideology,No opinion,8,\r
Trusting,Self-driven,46,74,61,Race/Ethnicity,White,53,\r
Trusting,Self-driven,46,74,61,Race/Ethnicity,Black,16,\r
Trusting,Self-driven,46,74,61,Race/Ethnicity,Latino,18,Lowest % Latino across groups\r
Trusting,Self-driven,46,74,61,Race/Ethnicity,Asian,9,\r
Trusting,Self-driven,46,74,61,Ed Attainment,No degree,53,\r
Trusting,Self-driven,46,74,61,Ed Attainment,Degree,46,\r
Trusting,Self-driven,46,74,61,Age,18-24,43,\r
Trusting,Self-driven,46,74,61,Age,25-34,57,\r
Distrusting,Relational,11,26,39,PID,Dem,27,\r
Distrusting,Relational,11,26,39,PID,Rep,37,\r
Distrusting,Relational,11,26,39,PID,Ind,26,\r
Distrusting,Relational,11,26,39,PID,Other,11,\r
Distrusting,Relational,11,26,39,Ideology,Conservative,34,\r
Distrusting,Relational,11,26,39,Ideology,Moderate,30,\r
Distrusting,Relational,11,26,39,Ideology,Liberal,26,Most even spread in ideology\r
Distrusting,Relational,11,26,39,Ideology,No opinion,10,\r
Distrusting,Relational,11,26,39,Race/Ethnicity,White,52,\r
Distrusting,Relational,11,26,39,Race/Ethnicity,Black,14,\r
Distrusting,Relational,11,26,39,Race/Ethnicity,Latino,26,\r
Distrusting,Relational,11,26,39,Race/Ethnicity,Asian,7,\r
Distrusting,Relational,11,26,39,Ed Attainment,No degree,58,\r
Distrusting,Relational,11,26,39,Ed Attainment,Degree,42,\r
Distrusting,Relational,11,26,39,Age,18-24,42,\r
Distrusting,Relational,11,26,39,Age,25-34,58,\r
Distrusting,Self-driven,15,26,61,PID,Dem,27,\r
Distrusting,Self-driven,15,26,61,PID,Rep,30,\r
Distrusting,Self-driven,15,26,61,PID,Ind,42,\r
Distrusting,Self-driven,15,26,61,PID,Other,1,\r
Distrusting,Self-driven,15,26,61,Ideology,Conservative,34,\r
Distrusting,Self-driven,15,26,61,Ideology,Moderate,36,\r
Distrusting,Self-driven,15,26,61,Ideology,Liberal,21,\r
Distrusting,Self-driven,15,26,61,Ideology,No opinion,9,\r
Distrusting,Self-driven,15,26,61,Race/Ethnicity,White,44,\r
Distrusting,Self-driven,15,26,61,Race/Ethnicity,Black,17,\r
Distrusting,Self-driven,15,26,61,Race/Ethnicity,Latino,25,\r
Distrusting,Self-driven,15,26,61,Race/Ethnicity,Asian,12,Most diverse group by ethnicity/race\r
Distrusting,Self-driven,15,26,61,Ed Attainment,No degree,39,\r
Distrusting,Self-driven,15,26,61,Ed Attainment,Degree,61,Most college educated\r
Distrusting,Self-driven,15,26,61,Age,18-24,32,\r
Distrusting,Self-driven,15,26,61,Age,25-34,68,`;export{Rt as T,mt as p,St as t};
