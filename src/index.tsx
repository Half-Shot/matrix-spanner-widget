import { h, render, Fragment } from 'preact';
import 'preact/devtools';
import { useCallback, useState } from 'preact/hooks';
import { MatrixCapabilities, WidgetApi, WidgetApiFromWidgetAction, WidgetApiToWidgetAction } from "matrix-widget-api";
// Avoids snowpack crash
// import "@fontsource/open-sans/files/open-sans-latin-400-normal.woff2";

interface IProps {
    widget: WidgetApi;
    spannerId: string;
    spannerName: string;
    sendSpannerMsg: boolean;
}

const StateEventType = "uk.half-shot.spanner";

// This is a bit cheeky, but the widget API doesn't allow us to fetch profiles or the user's HS.
const ProfileLookupURL = "https://matrix.org/_matrix/client/r0/profile/"
const ThumbnailURL = "https://matrix.org/_matrix/media/r0/thumbnail/"

export function App(props: IProps) {
    const [hasSpanner, setHasSpanner] = useState<{displayname: string, avatar?: string}|"loading"|null>("loading");
    const takeSpanner = useCallback(() => {
        props.widget.sendStateEvent(StateEventType, props.spannerId, { active: true });
        if (props.sendSpannerMsg) {
            props.widget.sendRoomEvent("m.room.message", {
                "type": "m.emote",
                "body": `takes the ${props.spannerName} spanner`,
            })
        }
    }, []);
    const dropSpanner = useCallback(() => {
        props.widget.sendStateEvent(StateEventType, props.spannerId, { });
        if (props.sendSpannerMsg) {
            props.widget.sendRoomEvent("m.room.message", {
                "type": "m.emote",
                "body": `drops the ${props.spannerName} spanner`,
            })
        }
    }, []);

    const processSpannerState = useCallback((event: any) => {
        if (event?.content.active) {
            fetch(new Request(`${ProfileLookupURL}${encodeURIComponent(event.sender)}`)).then(res => {
                return res.json();
            }).then((res) => {
                let avatar = undefined;
                if (res.avatar_url) {
                    avatar = `${ThumbnailURL}${res.avatar_url.replace("mxc://", "")}?width=48&height=48&method=scale`;
                }
                setHasSpanner({displayname: res.displayname || event.sender, avatar});
            }).catch((err) => {
                // No profile, just set the sender.
                setHasSpanner({displayname: event.sender});
            });
            return;
        }
        setHasSpanner(null);
    }, [setHasSpanner]);

    if (hasSpanner === "loading") {
        props.widget.on(`action:${WidgetApiToWidgetAction.SendEvent}`, (event) => {
            const { data } = event.detail;
            processSpannerState(data);
        });
    
        props.widget.readStateEvents(StateEventType, 1, props.spannerId).then(stateEvents => {
            const [event] = stateEvents as any[];
            processSpannerState(event);
        }).catch((err) => {
            console.log("Err fetching state", err);
        });
        setHasSpanner(null);
        return <p> Loading </p>;
    }

    if (hasSpanner) {
        return <>
            <p>
                {hasSpanner.avatar && <img width="48" src={hasSpanner.avatar}/>}
                {hasSpanner.displayname} has {props.spannerName}.
            </p>
            <button onClick={dropSpanner}>Drop it</button>
        </>;
    }

    return <>
        <p>
            Nobody has {props.spannerName}.
        </p>
        <button onClick={takeSpanner}>Take it</button>
    </>;
}

const root = document.getElementsByTagName('main')[0];
if (root) {
    const queryParams = new URLSearchParams(window.location.search);
    const spannerId = queryParams.get("spannerId") || "default";
    const spannerName = queryParams.get("spannerName") || "the Spanner";
    const sendSpannerMsg = queryParams.get("sendSpannerMsg") === "true";

    const api = new WidgetApi(queryParams.get("widgetId") || undefined);
    api.requestCapabilityToReceiveState("uk.half-shot.spanner", spannerId);
    api.requestCapabilityToSendState("uk.half-shot.spanner", spannerId);
    if (sendSpannerMsg) {
        api.requestCapabilityToSendMessage("m.emote");
    }
    // Before doing anything else, request capabilities:
    api.start();

    api.on("ready", () => {
        render(<App widget={api} spannerId={spannerId} spannerName={spannerName} sendSpannerMsg={sendSpannerMsg} />, root);
    });

} else {
    console.error("Could not find the root element");
}
