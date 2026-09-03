"use client";

import { Button, Card, Chip, Spinner, Table } from "@heroui/react";
import { useArticles } from "@api/articles";
import { Icon } from "@theme/icon";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";

export function ArticlesScreen() {
  const t = useTranslations("articlesPage");
  const router = useRouter();
  const articles = useArticles();
  const items = articles.data?.items ?? [];

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <ButtonLink href="/articles/new" variant="primary">
          <Icon name="plus-fat" size="sm" />
          {t("new")}
        </ButtonLink>
      </div>

      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        {articles.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : articles.isError ? (
          <p className="px-6 py-12 text-center text-muted">{t("error")}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12">
            <p className="text-center text-muted">{t("empty")}</p>
            <Button
              variant="primary"
              onPress={() => router.push("/articles/new")}
            >
              {t("new")}
            </Button>
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={t("title")}>
                <Table.Header>
                  <Table.Column isRowHeader>{t("titleColumn")}</Table.Column>
                  <Table.Column>{t("author")}</Table.Column>
                  <Table.Column>{t("category")}</Table.Column>
                  <Table.Column>{t("status")}</Table.Column>
                  <Table.Column>{t("updatedAt")}</Table.Column>
                </Table.Header>
                <Table.Body>
                  {items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell className="font-medium">
                        <Link
                          href={`/articles/${item.id}`}
                          className="text-foreground hover:text-accent"
                        >
                          {item.title}
                        </Link>
                      </Table.Cell>
                      <Table.Cell className="text-muted">
                        {item.authorName}
                      </Table.Cell>
                      <Table.Cell>{item.categoryName}</Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={
                            item.status === "published" ? "success" : "warning"
                          }
                          size="sm"
                        >
                          {item.status === "published"
                            ? t("published")
                            : t("draft")}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-muted tabular-nums">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.updatedAt))}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card>
    </main>
  );
}
