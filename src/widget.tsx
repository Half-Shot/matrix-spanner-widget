import { h, render } from "preact";
import "preact/devtools";
import { WidgetApi } from "matrix-widget-api";
import { App } from "./components/App";
import { SpannerStateEventType } from "./types";

export function startWidget(
  root: HTMLElement,
  queryParams: URLSearchParams,
  widgetApi?: WidgetApi,
) {
  if (!root) {
    console.error("Could not find the root element");
    return;
  }

  const spannerId = queryParams.get("spannerId") || "default";
  const spannerName = queryParams.get("spannerName") || "the Spanner";
  const sendSpannerMsg = queryParams.get("sendSpannerMsg") === "true";
  const widgetId = queryParams.get("widgetId");
  const docsLink = queryParams.get("docsLink");
  const clientTheme = queryParams.get("clientTheme") || "default";

  if (!widgetId) {
    render(
      <p className="error">
        Error: Widget must be opened from within a compatible Matrix client.
      </p>,
      root,
    );
    return;
  }

  const api =
    widgetApi || new WidgetApi(widgetId, queryParams.get("parentUrl") ?? null);

  api.requestCapabilityToReceiveState(SpannerStateEventType, spannerId);
  api.requestCapabilityToReceiveState("m.room.member");
  api.requestCapabilityToSendState(SpannerStateEventType, spannerId);
  if (sendSpannerMsg) {
    api.requestCapabilityToSendEvent("m.room.message");
    api.requestCapabilityToSendMessage("m.emote");
  }

  render(
    <App
      widget={api}
      spannerId={spannerId}
      spannerName={spannerName}
      sendSpannerMsg={sendSpannerMsg}
      docsLink={docsLink}
      clientTheme={clientTheme}
    />,
    root,
  );
}
