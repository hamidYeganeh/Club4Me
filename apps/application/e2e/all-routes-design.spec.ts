import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emptyCoachProfessionalProfile } from "@api";
import { createMockApiState, installApiMock, reservationFixture } from "./support/mock-api";
const routes:string[]=JSON.parse(readFileSync(resolve(__dirname,"../../../docs/design/route-inventory.json"),"utf8")).application;
const params:Record<string,string>={clubId:"energy-plus-demo",reservationId:"66d700000000000000000001",coachId:"demo",classId:"demo",articleId:"demo",entitlementId:"demo",locationId:"demo",membershipId:"demo",ticketId:"demo",offeringId:"demo",provinceId:"tehran",cityId:"tehran",districtId:"demo",regionId:"demo",sportId:"demo",typeId:"demo"};
for(const theme of ["light","dark"] as const) for(const template of routes){
 const path=template.replace(/\[([^\]]+)\]/g,(_,key)=>params[key]??"demo");
 test(`application route ${theme} ${template}`,async({page},info)=>{
  const state=createMockApiState();state.user.roles=["athlete","coach"];
  state.reservation=reservationFixture(state.startsAt,state.endsAt,"reserved","paid");
  if(path==="/auth/set-password")state.user.hasPassword=false;
  await installApiMock(page,state);
  await page.addInitScript(({theme,path})=>{
   // Entry animation has dedicated tests; it must not replace the route screenshot.
   sessionStorage.setItem("gym4me.splash.shown","1");
   localStorage.setItem("theme",theme);
   if(path.startsWith("/welcome")) return;
   localStorage.setItem("gym4me.welcome.seen","1");
   localStorage.setItem("gym4me.accessToken","e2e-access-token");
   localStorage.setItem("gym4me.refreshToken","e2e-refresh-token");
  },{theme,path});
  await page.emulateMedia({reducedMotion:"reduce"});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/api/v1/coach/**",route=>{
   const p=new URL(route.request().url()).pathname;
   if(p.endsWith("/profile"))return route.fulfill({json:{data:{id:"demo",userId:state.user.id,displayName:"نگار احمدی",shortBio:"مربی تمرین قدرتی",bio:"تمرین اصولی برای همه",experienceYears:8,galleryMediaIds:[],specialties:[],trainingStyles:[],experience:[],faqs:[],languages:["فارسی"],serviceModes:["club"],contact:{},reviewStatus:"approved",visibility:"public",professionalProfile:emptyCoachProfessionalProfile()}}});
   if(p.endsWith("/availability"))return route.fulfill({json:{data:{rules:[],exceptions:[]}}});
   if(p.endsWith("/demo"))return route.fulfill({status:404,json:{error:{code:"NOT_FOUND",message:"مورد پیدا نشد"}}});
   return route.fulfill({json:{data:{items:[]}}});
  });
  // Unknown detail IDs exercise the designed unavailable state, not malformed successful data.
  await page.route("**/api/v1/**/demo",route=>route.fulfill({status:404,json:{error:{code:"NOT_FOUND",message:"مورد پیدا نشد"}}}));
  await page.route("**/api/v1/discovery/*/sections*",route=>route.fulfill({json:{data:[]}}));
  await page.route("**/api/v1/benefits/wallet",route=>route.fulfill({json:{data:{availableAmount:0,reservedAmount:0,transactions:[]}}}));
  await page.route("**/api/v1/benefits/referral-code",route=>route.fulfill({json:{data:{code:"GYM-DEMO"}}}));
  await page.setViewportSize({width:375,height:900});
  await page.goto(path.endsWith("/confirm") ? `${path}?phone=09121234567` : path);
  await expect(page.getByRole("status",{name:"Gym4Me",exact:true})).toHaveCount(0);
  await expect(page.locator("main").first()).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.getByText("بارگذاری کامل نشد",{exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
  await page.screenshot({path:info.outputPath("mobile.png")});
  expect(errors).toEqual([]);
 });
}
