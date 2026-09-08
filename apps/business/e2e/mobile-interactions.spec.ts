import { test, expect } from "@playwright/test";
import { publicClubFixture, setBrowserSession } from "../../application/e2e/support/mock-api";
test("mobile cards retain student actions and searchable navigation",async({page})=>{
 const club=publicClubFixture();let writes=0;
 let student={id:"student",firstName:"سارا",lastName:"احمدی",phone:"09121234567",status:"active",createdAt:"2026-09-01T10:00:00Z"};
 await setBrowserSession(page,true);
 await page.setViewportSize({width:375,height:812});
 await page.route("**/api/v1/**",async route=>{
  const path=new URL(route.request().url()).pathname;let data:unknown={items:[]};
  if(path.endsWith("/business/me")||path.endsWith("/account/me"))data={id:club.ownerId,roles:["owner"],hasPassword:true,status:"active"};
  else if(path==="/api/v1/business/clubs")data={items:[club]};
  else if(path.endsWith("/students/student")){student={...student,...route.request().postDataJSON()};writes++;data=student;}
  else if(path.endsWith("/students"))data={items:[student]};
  await route.fulfill({json:{data}});
 });
 await page.goto("/students");
 const list=page.locator(".business-mobile-list");await expect(list).toBeVisible();
 await list.getByRole("button",{name:"غیرفعال کردن",exact:true}).click();
 await expect.poll(()=>writes).toBe(1);await expect(list.getByRole("button",{name:"فعال کردن",exact:true})).toBeVisible();
 await page.reload();await expect(list.getByRole("button",{name:"فعال کردن",exact:true})).toBeVisible();
 await list.getByRole("button",{name:"جزئیات",exact:true}).click();await expect(page.getByRole("dialog")).toBeVisible();
 await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);
 await page.getByRole("navigation",{name:"دسترسی سریع",exact:true}).getByRole("button").click();
 await page.getByRole("searchbox",{name:"جستجو در بخش‌ها"}).fill("تنظیمات");
 await page.getByRole("dialog").getByRole("link",{name:"تنظیمات",exact:true}).click();
 await expect(page).toHaveURL(/\/settings$/);await expect(page.getByRole("dialog")).toHaveCount(0);
});
