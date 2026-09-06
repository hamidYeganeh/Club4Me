"use client";

import { Avatar, Button, Input } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { ThemeToggle } from "@theme/theme-toggle";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";

import { coachThreadSectionStyles } from "./CoachThreadSection.styles";
import type { CoachThreadSectionProps } from "./CoachThreadSection.types";

const waveHeights = [28, 52, 38, 74, 46, 88, 60, 42, 70, 34, 56, 48, 80, 36, 64];

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
  gptBadge,
  chatsLeft,
  downloadApp,
  voiceDuration,
}: CoachThreadSectionProps) {
  const styles = coachThreadSectionStyles();
  const [activeChat, setActiveChat] = useState(0);
  const [navKey, setNavKey] = useState("metrics");
  const [tab, setTab] = useState("main");

  return (
    <main className={styles.root()}>
      <aside className={styles.sidebar()}>
        <div className={styles.profile()}>
          <Avatar className="size-11">
            <Avatar.Image
              alt={name}
              src="https://picsum.photos/seed/gym4me-business/160/160"
            />
            <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted">{tokensLeft}</p>
          </div>
          <Icon name="chevron-down" className="ms-auto text-muted" size={16} />
        </div>

        <Tabs value={tab} onValueChange={setTab} variant="underline" className={styles.tabs()}>
          <TabsList className="w-full border-transparent">
            <TabsTrigger value="main">{main}</TabsTrigger>
            <TabsTrigger value="settings">{settings}</TabsTrigger>
            <TabsTrigger value="subscription">{subscription}</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className={styles.sectionLabel()}>{title}</p>
        <nav className={styles.nav()} aria-label={title}>
          {(
            [
              ["main", title, "house-1"],
              ["canvas", canvas, "grid-four"],
              ["metrics", metrics, "chart-trend-up"],
              ["appointment", appointment, "calendar-1"],
            ] as const
          ).map(([id, label, icon]) => (
            <Button
              key={id}
              className={cn(
                styles.navItem(),
                navKey === id && styles.navItemActive(),
              )}
              variant="ghost"
              onPress={() => setNavKey(id)}
            >
              <Icon name={icon} size={18} />
              {label}
            </Button>
          ))}
        </nav>

        <p className={styles.sectionLabel()}>{recent}</p>
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
                <span className="flex shrink-0 gap-1 text-muted">
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
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <div className={styles.headMeta()}>
              <span className={styles.badge()}>{gptBadge}</span>
              <span>{chatsLeft}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="app-icon-button" />
            <Button isIconOnly aria-label={placeholder} variant="tertiary">
              <Icon name="magnifying-glass" />
            </Button>
            <Button isIconOnly aria-label={settings} variant="tertiary">
              <Icon name="gear-1" />
            </Button>
            <ButtonLink href="/" className={styles.downloadBtn()} variant="secondary">
              <Icon name="arrow-down-circle" size={16} />
              {downloadApp}
            </ButtonLink>
          </div>
        </div>

        <div className={styles.messages()}>
          <div className={styles.aiRow()}>
            <span className={styles.aiAvatar()}>
              <Icon name="plus-fat" size={16} />
            </span>
            <div className={styles.aiBubble()}>
              <p>{aiReply}</p>
              <div className={styles.linkCard()}>
                <div className="flex items-start gap-2">
                  <Icon name="link-1" className="mt-0.5 text-accent" size={16} />
                  <div>
                    <p className="font-medium">{linkTitle}</p>
                    <p className="mt-1 text-muted">{linkBody}</p>
                  </div>
                </div>
              </div>
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
            </div>
          </div>

          <div className={styles.voiceBubble()} aria-label={voice}>
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-accent-foreground/15 text-accent-foreground"
              variant="ghost"
            >
              <Icon name="play" size={14} />
            </Button>
            <div className={styles.voiceWave()} aria-hidden>
              {waveHeights.map((height, index) => (
                <span
                  key={index}
                  className="w-1 rounded-full bg-accent-foreground/85"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <span className="text-xs tabular-nums opacity-90">{voiceDuration}</span>
          </div>

          <div className={styles.userBubble()}>{userReply}</div>

          <div className={styles.aiRow()}>
            <span className={styles.aiAvatar()}>
              <Icon name="plus-fat" size={16} />
            </span>
            <span className={styles.typing()} aria-hidden>
              <span className={styles.typingDot()} />
              <span className={cn(styles.typingDot(), "animation-delay-150")} />
              <span className={cn(styles.typingDot(), "animation-delay-300")} />
            </span>
          </div>
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
          <Button
            isIconOnly
            aria-label={send}
            className="rounded-full"
            variant="primary"
          >
            <Icon name="paper-plane-horizontal" />
          </Button>
        </form>
      </section>
    </main>
  );
}
