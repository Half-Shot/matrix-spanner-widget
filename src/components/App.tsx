import { h, render } from "preact";
import "preact/devtools";
import { useEffect, useState } from "preact/hooks";
import {
  IUpdateStateToWidgetActionRequest,
  WidgetApi,
  WidgetApiToWidgetAction,
} from "matrix-widget-api";
import { SpannerState } from "./SpannerBox";
import { SpannerStateEventType } from "../types";
import { InlineSpinner, Link } from "@vector-im/compound-web";
import { onWidgetEventHook } from "../utils";
import { SpannerControls } from "./SpannerControls";
import styles from "./App.module.css";

interface IProps {
  widget: WidgetApi;
  spannerId: string;
  spannerName: string;
  clientTheme: string;
  sendSpannerMsg: boolean;
  docsLink: string | null;
}

export function App({
  widget,
  spannerName,
  spannerId,
  sendSpannerMsg,
  docsLink,
  clientTheme,
}: IProps) {
  const [spannerOwner, setSpannerOwner] = useState<
    { sender: string; reason?: string } | null | undefined
  >(undefined);
  const stateHooked = onWidgetEventHook<IUpdateStateToWidgetActionRequest>(
    widget,
    WidgetApiToWidgetAction.UpdateState,
    (ev) => {
      const [spannerEvent] = ev.detail.data.state.filter(
        (e) => e.type === SpannerStateEventType && e.state_key === spannerId,
      );
      console.log("Got state update", ev.detail.data.state[0], spannerEvent);
      if (
        !spannerEvent ||
        "active" in spannerEvent.content === false ||
        !spannerEvent.content.active
      ) {
        console.log("No owner");
        setSpannerOwner(null);
      } else {
        setSpannerOwner({
          sender: spannerEvent.sender,
          reason:
            typeof spannerEvent.content.reason === "string"
              ? spannerEvent.content.reason
              : undefined,
        });
      }
    },
  );
  const themeHooked = onWidgetEventHook(
    widget,
    WidgetApiToWidgetAction.ThemeChange,
    (ev) => {
      console.log("theme changed", ev);
    },
  );
  const eventHooked = onWidgetEventHook(
    widget,
    WidgetApiToWidgetAction.SendEvent,
    (ev) => {
      console.log("Got event update", ev);
      // Ununsed, but here to prevent annoying errors.
    },
  );

  useEffect(() => {
    // Request once we have all our hooks setup.
    widget.start();
  }, [widget, stateHooked, themeHooked, eventHooked, spannerId]);

  return (
    <div className={styles.container}>
      {spannerOwner !== undefined ? (
        <>
          <SpannerState
            widget={widget}
            owner={spannerOwner}
            spannerName={spannerName}
          />
          <SpannerControls
            owner={spannerOwner}
            spannerName={spannerName}
            spannerId={spannerId}
            widget={widget}
            sendSpannerMsg={sendSpannerMsg}
          />
        </>
      ) : (
        <InlineSpinner />
      )}
      {docsLink && (
        <Link rel="noopener" target="_blank" href={docsLink}>
          Information about this spanner
        </Link>
      )}
    </div>
  );
}
