import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChannelComposer } from "./ChannelComposer";
import type { PendingMedia } from "./ChannelComposer";

const t = (key: string, fallback?: string) => fallback ?? key;

function stageFile(container: HTMLElement, name: string, type: string) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["x"], name, { type });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

function renderComposer(overrides: Partial<React.ComponentProps<typeof ChannelComposer>> = {}) {
  const ref = React.createRef<HTMLTextAreaElement>();
  const onSend = vi.fn();
  const utils = render(
    <ChannelComposer
      isDark
      isOwner
      isMuted={false}
      onToggleMute={vi.fn()}
      msgText=""
      onMsgTextChange={vi.fn()}
      morseMode={false}
      onSend={onSend}
      inputRef={ref}
      t={t}
      {...overrides}
    />,
  );
  return { ...utils, onSend, ref };
}

describe("ChannelComposer", () => {
  let created: string[] = [];
  let revoked: string[] = [];

  beforeEach(() => {
    created = [];
    revoked = [];
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        const url = `blob:staged-${created.length}`;
        created.push(url);
        return url;
      }),
      revokeObjectURL: vi.fn((url: string) => {
        revoked.push(url);
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("revokes a staged object URL when its thumbnail is dropped", () => {
    const { container } = renderComposer();
    stageFile(container, "photo.png", "image/png");

    const remove = screen.getByLabelText("chat.removeMedia");
    expect(created).toHaveLength(1);
    expect(revoked).toHaveLength(0);

    fireEvent.click(remove);
    expect(revoked).toEqual(created);
  });

  it("revokes still-staged URLs on unmount", () => {
    const { container, unmount } = renderComposer();
    stageFile(container, "a.png", "image/png");
    stageFile(container, "b.mp4", "video/mp4");
    expect(created).toHaveLength(2);

    unmount();
    expect(revoked.sort()).toEqual([...created].sort());
  });

  it("hands a sent URL to the consumer instead of revoking it", () => {
    const { container, onSend } = renderComposer({ msgText: "hello" });
    stageFile(container, "photo.png", "image/png");

    fireEvent.click(screen.getByLabelText("channelComposer.send"));

    // The posted message still renders this thumbnail, so revoking breaks it.
    expect(revoked).toHaveLength(0);
    const sent = onSend.mock.calls[0][0] as PendingMedia[];
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(created[0]);
    expect(sent[0].type).toBe("image");
  });

  it("sends a video file as a video and clears the batch", () => {
    const { container, onSend } = renderComposer({ msgText: "clip" });
    stageFile(container, "clip.mp4", "video/mp4");
    stageFile(container, "photo.png", "image/png");

    fireEvent.click(screen.getByLabelText("channelComposer.send"));

    const sent = onSend.mock.calls[0][0] as PendingMedia[];
    expect(sent.map((m) => m.type)).toEqual(["video", "image"]);
    expect(screen.queryByLabelText("chat.removeMedia")).not.toBeInTheDocument();
  });

  it("shows only the mute control to a non-owner", () => {
    renderComposer({ isOwner: false, isMuted: true });
    expect(screen.getByLabelText("chat.filters.unmuteChannel")).toBeInTheDocument();
    expect(screen.queryByLabelText("channelComposer.send")).not.toBeInTheDocument();
  });
});
