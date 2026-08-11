(()=>{var a={};a.id=784,a.ids=[784],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48152:(a,b,c)=>{"use strict";c.d(b,{UU:()=>f});var d=c(4410),e=c(86802);async function f(){let a=await (0,e.UL)();return(0,d.createServerClient)("https://udwmxzbpmkhimzctoemg.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkd214emJwbWtoaW16Y3RvZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzM3OTcsImV4cCI6MjEwMDc0OTc5N30.P-Gca7vdp6XT0S3WX7xXqpun295Ykf9CsjoUo5-8Y2USUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_here",{cookies:{getAll:()=>a.getAll(),setAll(b){try{b.forEach(({name:b,value:c,options:d})=>{a.set(b,c,d)})}catch{}}}})}},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},77245:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>C,patchFetch:()=>B,routeModule:()=>x,serverHooks:()=>A,workAsyncStorage:()=>y,workUnitAsyncStorage:()=>z});var d={};c.r(d),c.d(d,{GET:()=>w});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(48152),v=c(10641);async function w(a,{params:b}){let{id:c}=await b,d=await (0,u.UU)(),{data:{user:e},error:f}=await d.auth.getUser();if(f||!e)return new v.NextResponse("Unauthorized",{status:401});let{data:g,error:h}=await d.from("deals").select(`
      *,
      party_a:companies!party_a_id(id, name),
      party_b:companies!party_b_id(id, name)
    `).eq("id",c).single();if(h||!g)return new v.NextResponse("Deal record not found",{status:404});let i=new Date().toISOString(),j=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>TradeIt.tv B2B Contract - ${g.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: 900; color: #0284c7; letter-spacing: -0.5px; }
        .title { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #334155; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .meta-item { font-size: 12px; }
        .meta-label { text-transform: uppercase; color: #64748b; font-size: 10px; font-weight: 700; display: block; margin-bottom: 2px; }
        .meta-value { font-weight: 600; color: #0f172a; }
        .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .term-box { border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; font-size: 13px; }
        .term-title { font-weight: 700; color: #0369a1; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
        .escrow-banner { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 16px; border-radius: 8px; font-size: 12px; margin-bottom: 30px; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; margin-top: 40px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <div>
          <div class="logo">TradeIt<span style="color: #0284c7;">.tv</span></div>
          <div style="font-size: 11px; color: #64748b;">Immutable B2B Barter Escrow Ledger</div>
        </div>
        <div style="text-align: right;">
          <div class="title">Bilateral Trade Agreement</div>
          <span class="badge">Status: ${g.status}</span>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Contract Reference ID</span>
          <span class="meta-value">${g.id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Escrow Credit Valuation</span>
          <span class="meta-value">${Number(g.credit_amount).toLocaleString()} CR</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Party A (Initiator)</span>
          <span class="meta-value">${g.party_a?.name||"N/A"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Party B (Counterparty)</span>
          <span class="meta-value">${g.party_b?.name||"N/A"}</span>
        </div>
      </div>

      <div class="escrow-banner">
        <strong>Escrow Security Guarantee:</strong> This contract was digitally logged and executed via atomic PostgreSQL private schema RPC functions (<code style="background:#dcfce7; padding:2px 4px;">private.sign_deal</code> / <code style="background:#dcfce7; padding:2px 4px;">private.settle_deal</code>) on the TradeIt.tv network.
      </div>

      <div class="terms-grid">
        <div class="term-box">
          <div class="term-title">${g.party_a?.name} Deliverable Commitment</div>
          <div>${g.party_a_deliverable}</div>
        </div>
        <div class="term-box">
          <div class="term-title">${g.party_b?.name} Deliverable Commitment</div>
          <div>${g.party_b_deliverable}</div>
        </div>
      </div>

      <div class="footer">
        Generated automatically on ${new Date(i).toUTCString()} &bull; TradeIt.tv Corporate Barter Network &bull; Page 1 of 1
      </div>
    </body>
    </html>
  `;return new v.NextResponse(j,{headers:{"Content-Type":"text/html; charset=utf-8"}})}let x=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/deals/[id]/pdf/route",pathname:"/api/deals/[id]/pdf",filename:"route",bundlePath:"app/api/deals/[id]/pdf/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Projects\\tradeit-b2b\\src\\app\\api\\deals\\[id]\\pdf\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:y,workUnitAsyncStorage:z,serverHooks:A}=x;function B(){return(0,g.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:z})}async function C(a,b,c){var d;let e="/api/deals/[id]/pdf/route";"/index"===e&&(e="/");let g=await x.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||x.isDev||y||(G="/index"===(G=D)?"/":G);let H=!0===x.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>x.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>x.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await x.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await x.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await x.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[1331,5903,4410,6802,1692],()=>b(b.s=77245));module.exports=c})();