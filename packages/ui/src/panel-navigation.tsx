"use client";

import { useState } from "react";
import { Button, Drawer } from "@heroui/react";
import { Icon, type IconName } from "@repo/theme/icon";
import Link from "next/link";

export type PanelNavItem = {
  href: string;
  icon: IconName;
  label: string;
  exact?: boolean;
};
export function panelItemActive(path: string, item: PanelNavItem) {
  return (
    path === item.href ||
    (!item.exact && item.href !== "/" && path.startsWith(`${item.href}/`))
  );
}
function groupFor(href: string, business: boolean) {
  if (business) {
    if (["/", "/check-in", "/calendar", "/attendance"].includes(href))
      return "کارهای روزانه";
    if (["/students", "/coaches", "/classes", "/memberships"].includes(href))
      return "اعضا و خدمات";
    if (["/payments", "/reviews"].includes(href)) return "مالی و بازخورد";
    return "مدیریت کسب‌وکار";
  }
  if (["/", "/role-requests", "/reports", "/support"].includes(href))
    return "پیگیری و رسیدگی";
  if (["/users", "/clubs", "/coach", "/classes"].includes(href))
    return "کاربران و خدمات";
  if (["/articles", "/discovery", "/resources"].includes(href)) return "محتوا";
  return "مدیریت پلتفرم";
}
export function PanelNavLinks({
  items,
  pathname,
  business = false,
  collapsed = false,
  onNavigate,
  search = "",
}: {
  items: PanelNavItem[];
  pathname: string;
  business?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  search?: string;
}) {
  const normalize = (text: string) =>
    text.replaceAll("ي", "ی").replaceAll("ك", "ک").replaceAll("‌", "").trim();
  const visible = items.filter((item) =>
    normalize(item.label).includes(normalize(search)),
  );
  const groups = business
    ? ["کارهای روزانه", "اعضا و خدمات", "مالی و بازخورد", "مدیریت کسب‌وکار"]
    : ["پیگیری و رسیدگی", "کاربران و خدمات", "محتوا", "مدیریت پلتفرم"];
  return (
    <>
      {groups.map((group) => {
        const entries = visible.filter(
          (item) => groupFor(item.href, business) === group,
        );
        return entries.length ? (
          <div key={group} className="panel-nav-group">
            {!collapsed && <p className="panel-nav-group-label">{group}</p>}
            {entries.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onKeyDown={(event) => {
                  if (event.key === "Escape")
                    event.currentTarget.dataset.tooltipDismissed = "true";
                }}
                onFocus={(event) => {
                  delete event.currentTarget.dataset.tooltipDismissed;
                }}
                onMouseEnter={(event) => {
                  delete event.currentTarget.dataset.tooltipDismissed;
                }}
                onClick={onNavigate}
                className="panel-nav-link"
                aria-label={collapsed ? item.label : undefined}
                aria-current={
                  panelItemActive(pathname, item) ? "page" : undefined
                }
              >
                <Icon name={item.icon} size={21} />
                <span className={collapsed ? "panel-nav-tooltip" : ""}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        ) : null;
      })}
      {!visible.length && (
        <p role="status" className="p-4 text-sm text-muted">
          بخشی پیدا نشد؛ عبارت دیگری بنویسید.
        </p>
      )}
    </>
  );
}
export function PanelDesktopNavigation({
  items,
  pathname,
  business = false,
}: {
  items: PanelNavItem[];
  pathname: string;
  business?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className="panel-sidebar" data-collapsed={collapsed}>
      <div className="panel-sidebar-heading">
        <span className={collapsed ? "sr-only" : "font-bold text-sm"}>
          {business ? "پنل کسب‌وکار" : "مدیریت کلاب‌فورمی"}
        </span>
        <Button
          isIconOnly
          variant="ghost"
          aria-label={collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}
          aria-expanded={!collapsed}
          onPress={() => setCollapsed(!collapsed)}
        >
          <Icon name="hamburger" />
        </Button>
      </div>
      <nav
        aria-label={business ? "بخش‌های کسب‌وکار" : "بخش‌های مدیریت"}
        className="panel-sidebar-scroll"
      >
        <PanelNavLinks
          items={items}
          pathname={pathname}
          business={business}
          collapsed={collapsed}
        />
      </nav>
    </aside>
  );
}
export function PanelMobileMenu({
  items,
  pathname,
}: {
  items: PanelNavItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <>
      <Button
        className="lg:hidden"
        variant="tertiary"
        isIconOnly
        aria-label="باز کردن منوی مدیریت"
        aria-expanded={open}
        onPress={() => {
          setSearch("");
          setOpen(true);
        }}
      >
        <Icon name="hamburger" />
      </Button>
      <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-[min(90vw,22rem)] bg-surface">
            <Drawer.CloseTrigger aria-label="بستن منو" />
            <Drawer.Header>
              <Drawer.Heading>بخش‌های مدیریت</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <input
                type="search"
                aria-label="جستجو در بخش‌ها"
                placeholder="جستجو در بخش‌ها"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3 w-full rounded-xl border border-border bg-surface-secondary p-3"
              />
              <nav aria-label="منوی مدیریت">
                <PanelNavLinks
                  items={items}
                  pathname={pathname}
                  search={search}
                  onNavigate={() => setOpen(false)}
                />
              </nav>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
