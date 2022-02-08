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
const ProfileLookupURL = "https://matrix.org/_matrix/client/r0/profile/";
const ThumbnailURL = "https://matrix.org/_matrix/media/r0/thumbnail/";

export function App(props: IProps) {
    const [error, setError] = useState<string|null>(null);
    const [hasSpanner, setHasSpanner] = useState<{displayname: string, avatar?: string}|"loading"|null>("loading");
    const takeSpanner = useCallback(() => {
        setError(null);
        props.widget.sendStateEvent(StateEventType, props.spannerId, { active: true }).then(() => {
            if (props.sendSpannerMsg) {
                // Don't await / error
                props.widget.sendRoomEvent("m.room.message", {
                    "msgtype": "m.emote",
                    "body": `takes the ${props.spannerName} spanner`,
                })
            }
        }).catch(ex => {
            console.error('Failed to take spanner', ex);
            setError('Failed to take spanner');
        });
    }, [setError]);
    const dropSpanner = useCallback(() => {
        setError(null);
        props.widget.sendStateEvent(StateEventType, props.spannerId, { }).then(() => {
            if (props.sendSpannerMsg) {
                // Don't await / error
                props.widget.sendRoomEvent("m.room.message", {
                    "msgtype": "m.emote",
                    "body": `drops the ${props.spannerName} spanner`,
                })
            }
        }).catch(ex => {
            console.error('Failed to drop spanner', ex);
            setError('Failed to drop spanner');
        });
    }, [setError]);

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

    let content;
    if (hasSpanner === "loading") {
        props.widget.on(`action:${WidgetApiToWidgetAction.SendEvent}`, (event) => {
            event.preventDefault();
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
        content = <p> Loading </p>;
    } else if (hasSpanner) {
        content =  <>
            {error && <p className="error">Error: {error}</p> }
            <p>
                {hasSpanner.avatar && <img width="48" src={hasSpanner.avatar}/>}
                {hasSpanner.displayname} has {props.spannerName}.
            </p>
            <button onClick={dropSpanner}>Drop it</button>
        </>;
    } else {
        content =  <>
            <p>
                Nobody has {props.spannerName}.
            </p>
            <button onClick={takeSpanner}>Take it</button>
        </>;
    }

    return <>
        {error && <p className="error">Error: {error}</p> }
        {content}
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
        api.requestCapabilityToSendEvent("m.room.message")
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
