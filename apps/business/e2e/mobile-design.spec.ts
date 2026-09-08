import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { publicClubFixture, setBrowserSession } from "../../application/e2e/support/mock-api";
const inventory = JSON.parse(readFileSync(resolve(__dirname,"../../../docs/design/route-inventory.json"), "utf8"));
const club = {...publicClubFixture(), isOwner:true, imageUrl:"/design/cover.jpg"};
const training = {id:"class-demo",clubId:club.id,title:"کلاس قدرت و آمادگی",model:"recurring",sport:"بدنسازی",status:"published",pricingModel:"per_session",price:2500000,capacity:12,enrollmentCount:3,startDate:"2026-09-01",endDate:"2027-01-01",schedule:[{dayOfWeek:6,startTime:"18:00",durationMinutes:60}],description:"تمرین گروهی با مربی",createdAt:"2026-09-01T10:00:00Z",updatedAt:"2026-09-01T10:00:00Z"};
for (const theme of ["light","dark"] as const) for (const template of [...inventory.business,"/missing-page"] as string[]) {
 const path=template.replaceAll("[clubId]",club.id).replaceAll("[classId]",training.id);
 test(`business mobile ${theme} ${template}`, async({page},info)=>{
  await setBrowserSession(page,!path.startsWith("/auth"));
  await page.addInitScript(t=>localStorage.setItem("theme",t),theme);
  await page.emulateMedia({reducedMotion:"reduce"});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/api/v1/**",async route=>{
   const p=new URL(route.request().url()).pathname;
   let data:unknown={items:[]};
   if(p.endsWith("/business/me")||p.endsWith("/account/me")) data={id:club.ownerId,roles:["owner"],phone:"09120000000",firstName:"نگار",lastName:"احمدی",hasPassword:true,status:"active"};
   else if(p==="/api/v1/business/clubs")data={items:[club]};
   else if(p===`/api/v1/business/clubs/${club.id}`)data=club;
   else if(p.endsWith(`/classes/${training.id}`))data=training;
   else if(p.endsWith("/classes"))data={items:[training]};
   else if(p.endsWith("/students"))data={items:[{id:"student",firstName:"سارا",lastName:"احمدی",phone:"09121234567",status:"active",joinedAt:"2026-09-01T10:00:00Z",createdAt:"2026-09-01T10:00:00Z"}]};
   else if(p.includes("dashboard"))data={stats:{},revenueByMonth:[],attendanceByDay:[],paymentMix:{tuition:0,session:0,other:0}};
   else if(p.endsWith("/balance"))data={availableAmount:0,pendingAmount:0,currency:"IRR"};
   await route.fulfill({json:{data}});
  });
  for(const width of [375,820]){
   await page.setViewportSize({width,height:900});await page.goto(path.endsWith("/confirm") ? `${path}?phone=09121234567` : path);

   await expect(page.getByRole("heading").first()).toBeVisible();
   await expect(page.getByText("نمایش صفحه کامل نشد",{exact:true})).toHaveCount(0);
   await page.evaluate(()=>document.fonts.ready);
   expect(new URL(page.url()).pathname).toBe(path);
   if(path.startsWith("/auth")) await expect(page.locator(".business-auth")).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
   if(!path.startsWith("/auth") && path!=="/missing-page") await expect(page.getByRole("navigation",{name:"دسترسی سریع",exact:true})).toBeVisible();
   await page.screenshot({path:info.outputPath(`page-${width}.png`),fullPage:false});
  }
  expect(errors).toEqual([]);
 });
}
