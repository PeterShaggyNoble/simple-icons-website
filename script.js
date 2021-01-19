!function(){var e={261:function(e){e.exports={decodeURIComponent:decodeURIComponent,debounce:function(e,t,r){let n,c,l,o,a;const d=function(){const i=+new Date-o;i<t&&i>=0?n=setTimeout(d,t-i):(n=null,r||(a=e.apply(l,c),n||(l=c=null)))};return function(){l=this,c=arguments,o=+new Date;const i=r&&!n;return n||(n=setTimeout(d,t)),i&&(a=e.apply(l,c),l=c=null),a}},normalizeSearchTerm:function(e){return e.toLowerCase().replace(/à|á|â|ã|ä/g,"a").replace(/ç|č|ć/g,"c").replace(/è|é|ê|ë/g,"e").replace(/ì|í|î|ï/g,"i").replace(/ñ|ň|ń/g,"n").replace(/ò|ó|ô|õ|ö/g,"o").replace(/š|ś/g,"s").replace(/ù|ú|û|ü/g,"u").replace(/ý|ÿ/g,"y").replace(/ž|ź/g,"z")}}}},t={};function r(n){if(t[n])return t[n].exports;var c=t[n]={exports:{}};return e[n](c,c.exports,r),c.exports}!function(){"use strict";function e(e){e.classList.add("copied"),setTimeout((()=>e.classList.remove("copied")),1e3)}const t="preferred-color-scheme",n="preferred-ordering",c={getItem(){},setItem(){}},l="dark",o="light",a="system",d=a,i="dark",s="light";let u=d;const m="alphabetically",p="color",f="relevance",g=m,v="order-alphabetically",y="order-by-color",b="order-by-relevance";let h=g,L=g;function I(e){e&&(e.classList.add("hidden"),e.setAttribute("aria-hidden","true"))}function E(e){e&&(e.classList.remove("hidden"),e.removeAttribute("aria-hidden"))}var S=r(261);let k="";document.body.classList.remove("no-js");const D=function(e){return e?{getItem:t=>e.getItem(t),setItem:(t,r)=>e.setItem(t,r)}:c}(localStorage);!function(e,r){const n=e.querySelector("body"),c=e.getElementById("color-scheme-dark"),m=e.getElementById("color-scheme-light"),p=e.getElementById("color-scheme-system");c.disabled=!1,m.disabled=!1,p.disabled=!1;function f(e){e===l?(n.classList.add(i),n.classList.remove(s)):e===o?(n.classList.add(s),n.classList.remove(i)):n.classList.remove(i,s),r.setItem(t,e),u=e}f(r.getItem(t)||d),c.addEventListener("click",(e=>{e.preventDefault(),u!=l&&(f(l),c.blur())})),m.addEventListener("click",(e=>{e.preventDefault(),u!=o&&(f(o),m.blur())})),p.addEventListener("click",(e=>{e.preventDefault(),u!=a&&(f(a),p.blur())}))}(document,D),function(t,r){const n=t.getElementById("copy-input"),c=t.querySelectorAll(".grid-item__color"),l=t.querySelectorAll(".grid-item__preview");function o(e){r.clipboard?r.clipboard.writeText(e):(n.value=e,n.select(),t.execCommand("copy"),n.blur())}c.forEach((t=>{t.removeAttribute("disabled"),t.addEventListener("click",(r=>{r.preventDefault();const n=t.innerHTML;t.blur(),o(n),e(t)}))})),l.forEach((t=>{t.removeAttribute("disabled"),t.addEventListener("click",(r=>{r.preventDefault();const n=t.parentNode.querySelector("svg").outerHTML;t.blur(),o(n),e(t)}))}))}(document,navigator);const q=function(e,t){const r=e.querySelector("body"),c=e.getElementById("order-alpha"),l=e.getElementById("order-color"),o=e.getElementById("order-relevance");c.disabled=!1,l.disabled=!1,o.disabled=!1;function a(e){r.classList.remove(v,y,b),e===m?r.classList.add(v):e===p?r.classList.add(y):e===f&&r.classList.add(b),e!==f&&(L=e,t.setItem(n,e)),h=e}return a(t.getItem(n)||g),c.addEventListener("click",(e=>{e.preventDefault(),h!=m&&(a(m),c.blur())})),l.addEventListener("click",(e=>{e.preventDefault(),h!=p&&(a(p),l.blur())})),o.addEventListener("click",(e=>{e.preventDefault(),h!=f&&(a(f),o.blur())})),{currentOrderingIs:function(e){return h===e},selectOrdering:a,resetOrdering:function(){return a(L)}}}(document,D);!function(e,t,r){const n=t.getElementById("search-input"),c=t.getElementById("search-clear"),l=t.getElementById("order-relevance"),o=t.querySelector(".grid-item--if-empty"),a=t.querySelector("#carbonads"),d=t.querySelectorAll(".grid-item[data-brand]");n.disabled=!1,n.focus(),n.addEventListener("input",(0,S.debounce)((e=>{e.preventDefault(),s(n.value)}))),c.addEventListener("click",(e=>{e.preventDefault(),n.value="",s("")}));const i=function(e){const t=new RegExp("[\\?&]q=([^&#]*)").exec(location.search);return null!==t?(0,S.decodeURIComponent)(t[1].replace(/\+/g," ")):""}();function s(n){!function(e,t,r){""!==r?e.replaceState(null,"",`${t}?q=${encodeURIComponent(r)}`):e.replaceState(null,"",t)}(e,t.location.pathname,n);const i=(0,S.normalizeSearchTerm)(n);""!==i?(E(c),E(l),I(a),""===k&&r.selectOrdering(f)):(I(c),I(l),E(a),r.currentOrderingIs(f)&&r.resetOrdering());let s=!0;d.forEach((e=>{const t=e.getAttribute("data-brand"),r=function(e,t){let r=t.length-e.length,n=0;for(const c of e){if(n=t.indexOf(c,n),-1===n)return-1;r+=n,n++}return r}(i,t);r<0?(e.style.removeProperty("--order-relevance"),I(e)):(e.style.setProperty("--order-relevance",r),E(e),s=!1)})),s?E(o):I(o),k=i}i&&(n.value=i,s(i))}(window.history,document,q)}()}();