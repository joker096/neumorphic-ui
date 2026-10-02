import { Suspense, lazy, useState } from "react";
import { DataState } from "../ui/DataState";
import { OnboardingPanel } from "../ui/OnboardingPanel";

const InviteQRModal = lazy(() => import("../ui/InviteQRModal").then((m) => ({ default: m.InviteQRModal })));

type Translate = (key: string, options?: any) => string;

interface ChatListEmptyStateProps {
  view: string;
  isDark: boolean;
  hasSearchQuery: boolean;
  activeFolder: string;
  t: Translate;
  onClearSearch: () => void;
  setShowCreateGroup?: (show: boolean) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowAddContactFromChat?: (show: boolean) => void;
}

/** Empty-list ladder: search miss, empty groups, onboarding for chats, onboarding for channels. */
export function ChatListEmptyState({ view, isDark, hasSearchQuery, activeFolder, t, onClearSearch, setShowCreateGroup, setShowCreateChannel, setShowAddContactFromChat }: ChatListEmptyStateProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (hasSearchQuery) {
    return <DataState status="empty" isDark={isDark} emptyIcon="search" title={t("chat.noResults")} description={t("chat.noResultsHint", "Try a different keyword or clear your search")} action={{ label: t("search.clear", "Clear"), onClick: onClearSearch }} />;
  }
  if (activeFolder === "groups") {
    return <DataState status="empty" isDark={isDark} title={t("chat.noGroups")} description={t("chat.noGroupsHint")} action={setShowCreateGroup ? { label: t("chat.createGroup"), onClick: () => setShowCreateGroup(true) } : undefined} />;
  }
  if (view === "chats") {
    return (
      <>
        <OnboardingPanel
          isDark={isDark}
          t={t}
          onStartChat={() => setShowAddContactFromChat?.(true)}
          onInvite={() => setShowInviteModal(true)}
        />
        <Suspense fallback={null}>
          <InviteQRModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            inviteText={t("onboarding.inviteText")}
            isDark={isDark}
            t={t}
          />
        </Suspense>
      </>
    );
  }
  if (view === "channels") {
    return (
      <OnboardingPanel
        isDark={isDark}
        variant="channels"
        t={t}
        onStartChat={() => setShowCreateChannel(true)}
      />
    );
  }
  return null;
}
