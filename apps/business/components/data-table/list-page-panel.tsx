"use client";

import { Button, Card, Chip } from "@heroui/react";
import { Icon } from "@theme/icon";
import type { ReactNode } from "react";
import { useState } from "react";
import { FilterModal } from "./filter-modal";

type ListPagePanelProps = {
  title: string;
  description?: string;
  badgeLabel?: string;
  primaryAction?: ReactNode;
  toolbarExtra?: ReactNode;
  filterContent?: ReactNode;
  filterActiveCount?: number;
  onFilterApply?: () => void;
  onFilterReset?: () => void;
  filterTitle?: string;
  children: ReactNode;
};

export function ListPagePanel({
  title,
  description,
  badgeLabel,
  primaryAction,
  toolbarExtra,
  filterContent,
  filterActiveCount = 0,
  onFilterApply,
  onFilterReset,
  filterTitle,
  children,
}: ListPagePanelProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilters = Boolean(filterContent);

  return (
    <Card className="app-card mt-5 overflow-hidden shadow-none active:scale-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/7 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {badgeLabel ? (
              <Chip color="accent" size="sm" variant="soft">
                {badgeLabel}
              </Chip>
            ) : null}
            {filterActiveCount > 0 ? (
              <Chip color="accent" size="sm" variant="soft">
                {filterActiveCount} فیلتر
              </Chip>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarExtra}
          {hasFilters ? (
            <Button variant="secondary" onPress={() => setFilterOpen(true)}>
              <Icon name="slider-line-three-horizontal" size={16} />
              فیلتر
            </Button>
          ) : null}
          {primaryAction}
        </div>
      </div>
      <div className="p-2 sm:p-3">{children}</div>
      {hasFilters && onFilterApply && onFilterReset ? (
        <FilterModal
          isOpen={filterOpen}
          onOpenChange={setFilterOpen}
          title={filterTitle}
          onApply={onFilterApply}
          onReset={onFilterReset}
        >
          {filterContent}
        </FilterModal>
      ) : null}
    </Card>
  );
}
