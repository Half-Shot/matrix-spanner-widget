import { h, render, Fragment } from 'preact';
import 'preact/devtools';
import { useCallback, useState } from 'preact/hooks';
import { MatrixCapabilities, WidgetApi, WidgetApiFromWidgetAction, WidgetApiToWidgetAction } from "matrix-widget-api";
// Avoids snowpack crash
// import "@fontsource/open-sans/files/open-sans-latin-400-normal.woff2";

interface IProps {
    widget: WidgetApi;
    spannerId: string;
}

const StateEventType = "uk.half-shot.spanner";

export function App(props: IProps) {
    const [hasSpanner, setHasSpanner] = useState<string|null>("loading");
    const takeSpanner = useCallback(() => {
        props.widget.sendStateEvent(StateEventType, props.spannerId, { active: true });
    }, []);
    const dropSpanner = useCallback(() => {
        props.widget.sendStateEvent(StateEventType, props.spannerId, { });
    }, []);

    const processSpannerState = useCallback((event: any) => {
        if (event?.content.active) {
            setHasSpanner(event.sender);
            return;
        }
        setHasSpanner(null);
    }, [hasSpanner]);

    if (hasSpanner === "loading") {

        props.widget.on(`action:${WidgetApiToWidgetAction.SendEvent}`, (event) => {
            const { data } = event.detail;
            processSpannerState(data);
        });
    
        props.widget.readStateEvents(StateEventType, 1, props.spannerId).then(stateEvents => {
            console.log("STATE:", stateEvents);
            const [event] = stateEvents as any[];
            processSpannerState(event);
        }).catch((err) => {
            console.log("Err fetching state", err);
        });
        setHasSpanner(null);
    }

    if (hasSpanner) {
        return <>
            <p>
                {hasSpanner} has the Spanner.
            </p>
            <button onClick={dropSpanner}>Drop it</button>
        </>;
    }

    return <>
        <p>
            Nobody has the Spanner.
        </p>
        <button onClick={takeSpanner}>Take it</button>
    </>;
}

const root = document.getElementsByTagName('main')[0];
if (root) {
    const queryParams = new URLSearchParams(window.location.search);
    const spannerId = queryParams.get("spannerId") || "default";

    const api = new WidgetApi(queryParams.get("widgetId") || undefined);
    api.requestCapabilityToReceiveState("uk.half-shot.spanner", spannerId);
    api.requestCapabilityToSendState("uk.half-shot.spanner", spannerId);
    // Before doing anything else, request capabilities:
    api.start();

    render(<App widget={api} spannerId={spannerId} />, root);
    api.sendContentLoaded();
} else {
    console.error("Could not find the root element");
}
