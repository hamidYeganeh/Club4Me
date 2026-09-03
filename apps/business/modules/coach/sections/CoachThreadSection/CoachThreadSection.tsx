"use client";

import { Avatar, Button, Card, Input, Tabs } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { useState } from "react";

import { coachThreadSectionStyles } from "./CoachThreadSection.styles";
import type { CoachThreadSectionProps } from "./CoachThreadSection.types";

export function CoachThreadSection({
  name,
  tokensLeft,
  title,
  main,
  settings,
  subscription,
  canvas,
  metrics,
  appointment,
  recent,
  chats,
  aiReply,
  userReply,
  linkTitle,
  linkBody,
  placeholder,
  send,
  attach,
  voice,
}: CoachThreadSectionProps) {
  const styles = coachThreadSectionStyles();
  const [activeChat, setActiveChat] = useState(0);

  return (
    <main className={styles.root()}>
      <aside className={styles.sidebar()}>
        <div className={styles.profile()}>
          <Avatar className="size-11">
            <Avatar.Image
              alt={name}
              src="https://picsum.photos/seed/club4me-business/160/160"
            />
            <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted">{tokensLeft}</p>
          </div>
        </div>
        <Tabs className={styles.tabs()} defaultSelectedKey="main">
          <Tabs.ListContainer className="rounded-none bg-transparent">
            <Tabs.List aria-label={title}>
              <Tabs.Tab className="text-muted data-[selected=true]:text-accent" id="main">
                {main}
                <Tabs.Indicator className="bg-accent" />
              </Tabs.Tab>
              <Tabs.Tab className="text-muted data-[selected=true]:text-accent" id="settings">
                {settings}
                <Tabs.Indicator className="bg-accent" />
              </Tabs.Tab>
              <Tabs.Tab
                className="text-muted data-[selected=true]:text-accent"
                id="subscription"
              >
                {subscription}
                <Tabs.Indicator className="bg-accent" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <nav className={styles.nav()}>
          <Button className={styles.navItem()} variant="ghost">
            {title}
          </Button>
          <Button className={styles.navItem()} variant="ghost">
            {canvas}
          </Button>
          <Button
            className={cn(styles.navItem(), styles.navItemActive())}
            variant="ghost"
          >
            <Icon name="chart-trend-up" />
            {metrics}
          </Button>
          <Button className={styles.navItem()} variant="ghost">
            {appointment}
          </Button>
        </nav>
        <p className="mt-6 text-xs text-muted">{recent}</p>
        <div className={styles.chats()}>
          {chats.map((chat, index) => (
            <Button
              key={chat}
              className={cn(
                styles.chatItem(),
                index === activeChat && styles.chatActive(),
              )}
              variant="ghost"
              onPress={() => setActiveChat(index)}
            >
              <span className="truncate">{chat}</span>
              {index === activeChat ? (
                <span className="flex gap-1 text-muted">
                  <Icon name="pencil-1" size="sm" />
                  <Icon name="trash-1" size="sm" />
                </span>
              ) : null}
            </Button>
          ))}
        </div>
      </aside>

      <section className={styles.thread()}>
        <div className={styles.head()}>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <Button isIconOnly aria-label={placeholder} variant="ghost">
              <Icon name="magnifying-glass" />
            </Button>
            <Button isIconOnly aria-label={settings} variant="ghost">
              <Icon name="gear-1" />
            </Button>
          </div>
        </div>
        <div className={styles.messages()}>
          <Card variant="transparent" className={styles.aiBubble()}>
            <p>{aiReply}</p>
            <Card variant="transparent" className={styles.linkCard()}>
              <p className="font-medium">{linkTitle}</p>
              <p className="mt-1 text-muted">{linkBody}</p>
            </Card>
            <div className="mt-3 flex gap-1 text-muted">
              <Button isIconOnly size="sm" variant="ghost">
                <Icon name="volume-high" size="sm" />
              </Button>
              <Button isIconOnly size="sm" variant="ghost">
                <Icon name="copy-1" size="sm" />
              </Button>
              <Button isIconOnly size="sm" variant="ghost">
                <Icon name="arrow-repeat-clockwise-1" size="sm" />
              </Button>
            </div>
          </Card>
          <div className={styles.userBubble()}>{userReply}</div>
        </div>
        <form
          className={styles.composer()}
          onSubmit={(event) => event.preventDefault()}
        >
          <Button isIconOnly aria-label={attach} variant="tertiary">
            <Icon name="paper-clip-1" />
          </Button>
          <Input
            aria-label={placeholder}
            className="flex-1"
            placeholder={placeholder}
            variant="secondary"
          />
          <Button isIconOnly aria-label={voice} variant="tertiary">
            <Icon name="microphone" />
          </Button>
          <Button aria-label={send} className="rounded-full" variant="primary">
            <Icon name="paper-plane-horizontal" />
          </Button>
        </form>
      </section>
    </main>
  );
}
