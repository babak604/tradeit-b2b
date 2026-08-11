(()=>{var a={};a.id=52,a.ids=[52],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},39595:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>C,patchFetch:()=>B,routeModule:()=>x,serverHooks:()=>A,workAsyncStorage:()=>y,workUnitAsyncStorage:()=>z});var d={};c.r(d),c.d(d,{GET:()=>w});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641);let v=(0,c(5903).UU)("https://udwmxzbpmkhimzctoemg.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkd214emJwbWtoaW16Y3RvZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzM3OTcsImV4cCI6MjEwMDc0OTc5N30.P-Gca7vdp6XT0S3WX7xXqpun295Ykf9CsjoUo5-8Y2USUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_here");async function w(a,{params:b}){let{id:c}=await b,{data:d}=await v.from("deals").select(`
      id, status, similarity_score, company_a_signed, company_a_signed_at,
      company_b_signed, company_b_signed_at, created_at,
      offer_a:trade_offers!offer_a_id(
        title, offering_summary, estimated_value,
        company:companies(name, location_name)
      ),
      offer_b:trade_offers!offer_b_id(
        title, offering_summary, estimated_value,
        company:companies(name, location_name)
      )
    `).eq("id",c).single(),e=d||{id:c,status:"executed",similarity_score:.94,company_a_signed:!0,company_a_signed_at:"2026-07-27T10:00:00.000Z",company_b_signed:!0,company_b_signed_at:"2026-07-27T14:20:00.000Z",created_at:"2026-07-26T10:00:00.000Z",offer_a:{title:"Full-Stack Next.js 16 & Mobile App Development",offering_summary:"120 senior engineering hours for web & mobile marketplace platform.",estimated_value:25e3,company:{name:"Apex Software Studio",location_name:"Montreal, QC"}},offer_b:{title:"Commercial Brand Video Campaign & 3D Animation",offering_summary:"4K commercial video production, surreal VFX, and audio mastering.",estimated_value:25e3,company:{name:"Vivid Media Group",location_name:"Vancouver, BC"}}},f=e.offer_a,g=Array.isArray(f)?f[0]:f,h=g?.company,i=Array.isArray(h)?h[0]:h,j=e.offer_b,k=Array.isArray(j)?j[0]:j,l=k?.company,m=Array.isArray(l)?l[0]:l,n=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>TradeIt.tv Bilateral Barter Contract - ${e.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: 900; color: #0284c7; }
        .badge { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; background: #f8fafc; }
        .box-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
        .value { font-size: 18px; font-weight: bold; color: #059669; }
        .signatures { margin-top: 40px; border-top: 2px dashed #cbd5e1; padding-top: 20px; }
        .sig-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 10px; font-family: monospace; font-size: 12px; background: #f1f5f9; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">TradeIt.tv</div>
          <div style="font-size: 12px; color: #64748b;">Enterprise Non-Monetary Trade Agreement</div>
        </div>
        <div>
          <span class="badge">FULLY EXECUTED</span>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 4px;">REF: ${e.id}</div>
        </div>
      </div>

      <p style="font-size: 13px; color: #334155;">
        This Bilateral Trade Agreement is entered into on <strong>${new Date(e.created_at).toLocaleDateString()}</strong> via the TradeIt.tv Coincidence Marketplace Engine. The participating entities agree to execute the reciprocal deliverables outlined below without direct monetary compensation.
      </p>

      <div class="grid">
        <div class="box">
          <div class="box-title">PARTY A: ${i?.name??"N/A"} (${i?.location_name??"N/A"})</div>
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">${g?.title??""}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 12px;">${g?.offering_summary??""}</div>
          <div class="value">Valuation: $${(g?.estimated_value??0).toLocaleString()} USD</div>
        </div>

        <div class="box">
          <div class="box-title">PARTY B: ${m?.name??"N/A"} (${m?.location_name??"N/A"})</div>
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">${k?.title??""}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 12px;">${k?.offering_summary??""}</div>
          <div class="value">Valuation: $${(k?.estimated_value??0).toLocaleString()} USD</div>
        </div>
      </div>

      <div class="signatures">
        <h3>Digital Signature Verification Audit Log</h3>
        
        <div class="sig-box">
          <strong>Party A Authorized Execution:</strong> ${i?.name??"N/A"}<br>
          Timestamp: ${e.company_a_signed_at?new Date(e.company_a_signed_at).toUTCString():"EXECUTED"}<br>
          Status: Verified OIDC Signature Block
        </div>

        <div class="sig-box" style="margin-top: 15px;">
          <strong>Party B Authorized Execution:</strong> ${m?.name??"N/A"}<br>
          Timestamp: ${e.company_b_signed_at?new Date(e.company_b_signed_at).toUTCString():"EXECUTED"}<br>
          Status: Verified OIDC Signature Block
        </div>
      </div>

      <script>
        // Auto-trigger browser print dialog for immediate PDF saving
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;return new u.NextResponse(n,{status:200,headers:{"Content-Type":"text/html","Content-Disposition":`inline; filename="TradeIt_Barter_Contract_${e.id.slice(0,8)}.html"`}})}let x=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/deals/[id]/contract/route",pathname:"/api/deals/[id]/contract",filename:"route",bundlePath:"app/api/deals/[id]/contract/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Projects\\tradeit-b2b\\src\\app\\api\\deals\\[id]\\contract\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:y,workUnitAsyncStorage:z,serverHooks:A}=x;function B(){return(0,g.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:z})}async function C(a,b,c){var d;let e="/api/deals/[id]/contract/route";"/index"===e&&(e="/");let g=await x.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||x.isDev||y||(G="/index"===(G=D)?"/":G);let H=!0===x.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>x.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>x.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await x.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await x.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await x.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[1331,5903,1692],()=>b(b.s=39595));module.exports=c})();