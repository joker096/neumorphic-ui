import { useAppStore } from "../../store";
import { AcceptInviteModal } from "../crm/AcceptInviteModal";
import { toast } from "../ui/Toast";

/**
 * `?invite=<code>` landing modal. Accepting is a store action (the code is
 * validated on-device); both outcomes toast and dismiss.
 */
export const PendingInviteGate = ({
  code,
  t,
  onDismiss,
}: {
  code: string;
  t: (key: string, fallback: string) => string;
  onDismiss: () => void;
}) => (
  <AcceptInviteModal
    code={code}
    onAccept={async () => {
      const ok = await useAppStore.getState().acceptInvite(code);
      toast(
        ok
          ? t('crm.inviteAccepted', 'Invitation accepted')
          : t('crm.inviteInvalid', 'Invite not valid on this device'),
        ok ? 'success' : 'error',
      );
      onDismiss();
    }}
    onClose={onDismiss}
  />
);
