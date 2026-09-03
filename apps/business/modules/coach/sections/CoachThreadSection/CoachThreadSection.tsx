"use client";

import { Avatar, Button, Input } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";

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
        <div className={styles.tabs()}>
          <span className={styles.tabActive()}>{main}</span>
          <span>{settings}</span>
          <span>{subscription}</span>
        </div>
        <nav className={styles.nav()}>
          <span className={styles.navItem()}>{title}</span>
          <span className={styles.navItem()}>{canvas}</span>
          <span className={cn(styles.navItem(), styles.navItemActive())}>
            <Icon name="chart-trend-up" />
            {metrics}
          </span>
          <span className={styles.navItem()}>{appointment}</span>
        </nav>
        <p className="mt-6 text-xs text-muted">{recent}</p>
        <div className={styles.chats()}>
          {chats.map((chat, index) => (
            <div
              key={chat}
              className={cn(styles.chatItem(), index === 0 && styles.chatActive())}
            >
              <span className="truncate">{chat}</span>
              {index === 0 ? (
                <span className="flex gap-1 text-muted">
                  <Icon name="pencil-1" size="sm" />
                  <Icon name="trash-1" size="sm" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </aside>

      <section className={styles.thread()}>
        <div className={styles.head()}>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <Icon name="magnifying-glass" className="text-muted" />
            <Icon name="gear-1" className="text-muted" />
          </div>
        </div>
        <div className={styles.messages()}>
          <div className={styles.aiBubble()}>
            <p>{aiReply}</p>
            <div className={styles.linkCard()}>
              <p className="font-medium">{linkTitle}</p>
              <p className="mt-1 text-muted">{linkBody}</p>
            </div>
            <div className="mt-3 flex gap-3 text-muted">
              <Icon name="volume-high" size="sm" />
              <Icon name="copy-1" size="sm" />
              <Icon name="arrow-repeat-clockwise-1" size="sm" />
            </div>
          </div>
          <div className={styles.userBubble()}>{userReply}</div>
        </div>
        <form className={styles.composer()} onSubmit={(event) => event.preventDefault()}>
          <Button isIconOnly variant="tertiary" aria-label={attach}>
            <Icon name="paper-clip-1" />
          </Button>
          <Input
            aria-label={placeholder}
            placeholder={placeholder}
            variant="secondary"
            className="flex-1"
          />
          <Button isIconOnly variant="tertiary" aria-label={voice}>
            <Icon name="microphone" />
          </Button>
          <Button variant="primary" aria-label={send} className="rounded-full">
            <Icon name="paper-plane-horizontal" />
          </Button>
        </form>
      </section>
    </main>
  );
}
