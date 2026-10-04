import { useEffect, useState } from "react";
import { findStoryUser } from "../components/stories/storiesData";
import { toast } from "../components/ui/Toast";

export interface AppBootStoryUser { id: number | string; name: string; color: string }

/**
 * One-shot app boot: recording retention, SDK install, CRM/story deep links and
 * the `?invite=` param. Owns `pendingInvite` so the invite modal state lives
 * next to the code path that can produce it.
 */
export const useAppBootEffects = ({ setActiveStory }: { setActiveStory: (user: AppBootStoryUser) => void }) => {
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  useEffect(() => {
    let stopRetention: () => void = () => {};
    import("../lib/recordingRetention").then(({ startRecordingRetention }) => {
      stopRetention = startRecordingRetention();
    }).catch(() => {});
    Promise.all([
      import("../lib/sdk"),
      import("../lib/crm/deepLink"),
      import("../lib/stories/storyDeepLink"),
    ]).then(([sdkModule, crmDeepLinkModule, storyDeepLinkModule]) => {
      sdkModule.installMessAngerSdk();
      const sdk = sdkModule.createMessAngerSdk();
      if (typeof window !== 'undefined') {
        crmDeepLinkModule.runCrmDeepLink(sdk, window.location.search, window.location.hash)
          .then((r) => { if (r && r.imported > 0) toast(`Imported ${r.imported} contacts from link`, 'success'); })
          .catch(() => {});
        const invite = new URLSearchParams(window.location.search).get('invite');
        if (invite) setPendingInvite(invite);
        const storyLink = storyDeepLinkModule.parseStoryDeepLink(window.location.hash, window.location.search);
        if (storyLink) {
          const u = findStoryUser(storyLink.userId);
          setActiveStory({ id: u.id, name: u.name, color: u.color });
          storyDeepLinkModule.clearStoryDeepLink();
        }
      }
    }).catch(() => {});
    return () => stopRetention();
  }, []);

  return { pendingInvite, setPendingInvite };
};
