import { Button, Form, TextInput } from "@vector-im/compound-web";
import { WidgetApi } from "matrix-widget-api";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { SpannerStateEventType } from "../types";
import { EventHandler, h, SubmitEventHandler } from "preact";
import styles from "./SpannerControls.module.css";

interface IProps {
  widget: WidgetApi;
  spannerId: string;
  spannerName: string;
  sendSpannerMsg: boolean;
  owner: { sender: string } | null;
}

export function SpannerControls({
  widget,
  spannerName,
  spannerId,
  sendSpannerMsg,
  owner,
}: IProps) {
  const [error, setError] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState<boolean>(false);

  useEffect(() => {
    setInProgress(false);
  }, [owner]);

  const alterSpanner = useCallback<SubmitEventHandler<HTMLFormElement>>(
    async (ev) => {
      ev.preventDefault();
      const formElement = ev.target! as HTMLFormElement;
      const reason = (formElement.firstChild! as HTMLInputElement).value;
      const action = owner ? "drop" : "take";
      setError(null);
      setInProgress(true);
      try {
        await widget.sendStateEvent(
          SpannerStateEventType,
          spannerId,
          action === "take"
            ? { active: true, reason: !!reason ? reason : undefined }
            : {},
        );
        if (sendSpannerMsg) {
          const hasSpannerMsg =
            action === "take" && owner ? ` from ${owner.sender}` : "";
          const reasonText = reason ? ` Reason: ${reason}` : "";
          await widget.sendRoomEvent("m.room.message", {
            msgtype: "m.emote",
            body: `${action}s the ${spannerName} spanner${hasSpannerMsg}. ${reasonText}`,
          });
        }
      } catch (ex) {
        console.error(`Failed to ${action} spanner`, ex);
        setError(`Failed to ${action} spanner`);
      }
      formElement.reset();
    },
    [widget, spannerId, owner],
  );

  return (
    <Form.Root className={styles.container} onSubmit={alterSpanner}>
      <TextInput disabled={owner} type="text" placeholder="Reason (optional)" />
      <Button type="submit" disabled={inProgress}>
        {owner ? "🫳 Drop" : "🔧 Take"}
      </Button>
    </Form.Root>
  );
}
