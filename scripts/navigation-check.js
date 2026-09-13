#!/usr/bin/env node
/* Navigation smoke test. Usage: node scripts/navigation-check.js [base-url] */
'use strict';
var fs=require('fs'), path=require('path');
var base=(process.argv[2]||'https://'+path.basename(path.join(__dirname,'..'))+'.apptonomia.uk/').replace(/\/+$/,'')+'/';
var routes=['/','/site/','/config/','/legal/index.html'], failures=[];
var file=path.join(__dirname,'..','data.js');
if(fs.existsSync(file)){var s=fs.readFileSync(file,'utf8'),m,re=/href:\s*'([^']+)'/g;while((m=re.exec(s))!==null)if(/^tools\//.test(m[1])&&routes.indexOf('/'+m[1])<0)routes.push('/'+m[1]);}
(async function(){for(var i=0;i<routes.length;i++){var r=routes[i],u=new URL(r.replace(/^\//,''),base);try{var x=await fetch(u,{redirect:'follow'}),t=await x.text(),ct=x.headers.get('content-type')||'';if(!x.ok||!/text\/html/i.test(ct)||!/<html[\s>]/i.test(t))failures.push(r+' — HTTP '+x.status+' o HTML inválido');else console.log('OK  '+r);}catch(e){failures.push(r+' — '+e.message);}}console.log('\nRutas comprobadas: '+routes.length);if(failures.length){failures.forEach(function(f){console.error('FAIL '+f);});process.exitCode=1;}else console.log('Navegación OK');})();
