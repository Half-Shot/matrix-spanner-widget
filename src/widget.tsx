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
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [hasSpanner, setHasSpanner] = useState<{displayname: string, avatar?: string}|"loading"|null>("loading");

    const alterSpanner = (action: "take"|"drop") => {
        setError(null);
        setInProgress(true);
        props.widget.sendStateEvent(StateEventType, props.spannerId, action === "take" ? { active: true }: {}).then(() => {
            if (props.sendSpannerMsg) {
                // Don't await / error
                props.widget.sendRoomEvent("m.room.message", {
                    "msgtype": "m.emote",
                    "body": `${action}s the ${props.spannerName} spanner`,
                })
            }
        }).catch(ex => {
            console.error(`Failed to ${action} spanner`, ex);
            setError(`Failed to ${action} spanner`);
        });
    }

    const takeSpanner = useCallback(() => {
        alterSpanner("take");
    }, [setError, setInProgress]);

    const dropSpanner = useCallback(() => {
        alterSpanner("drop");
    }, [setError, setInProgress]);

    const processSpannerState = useCallback((event: any) => {
        setInProgress(false);
        if (event?.content.active) {
            fetch(new Request(`${ProfileLookupURL}${encodeURIComponent(event.sender)}`)).then(res => {
                return res.json();
            }).then((res) => {
                let avatar = undefined;
                if (res.avatar_url) {
                    avatar = `${ThumbnailURL}${res.avatar_url.replace("mxc://", "")}?width=48&height=48&method=scale`;
                }
                setHasSpanner({displayname: res.displayname || event.sender, avatar});
            }).catch(() => {
                // No profile, just set the sender.
                setHasSpanner({displayname: event.sender});
            });
            return;
        }
        setHasSpanner(null);
    }, [setHasSpanner, setInProgress]);

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
            <section className={`profileWrapper taken`}>
                {hasSpanner.avatar && <img className='avatar' width="48" src={hasSpanner.avatar}/>}
                <div className="spannerText">
                    {hasSpanner.displayname} has {props.spannerName}
                </div>
            </section>
            <button onClick={dropSpanner} disabled={inProgress}>🫳 Drop</button>
        </>;
    } else {
        content = <>
            <section className={`profileWrapper dropped`}>
            <div className="spannerText">
                Nobody has {props.spannerName}.
            </div>
            </section>
            <button onClick={takeSpanner} disabled={inProgress}>🔧 Take</button>
        </>;
    }

    return <>
        {error && <p className="error">Error: {error}</p> }
        {content}
    </>;
}

export function startWidget (root: HTMLElement, queryParams: URLSearchParams, widgetApi?: WidgetApi) {
    if (root) {
        const spannerId = queryParams.get("spannerId") || "default";
        const spannerName = queryParams.get("spannerName") || "the Spanner";
        const sendSpannerMsg = queryParams.get("sendSpannerMsg") === "true";
        const widgetId = queryParams.get("widgetId");

        if (!widgetId) {
            render(<p className="error">Error: Widget must be opened from within a compatible Matrix client.</p>, root);
            return;
        }

    
        const api = widgetApi || new WidgetApi(widgetId);
        api.requestCapabilityToReceiveState("uk.half-shot.spanner", spannerId);
        api.requestCapabilityToSendState("uk.half-shot.spanner", spannerId);
        if (sendSpannerMsg) {
            api.requestCapabilityToSendEvent("m.room.message")
            api.requestCapabilityToSendMessage("m.emote");
        }
        // Before doing anything else, request capabilities:
        api.start();

        render(<p>Requesting capabilities...</p>, root);
    
        api.on("ready", () => {
            render(<App widget={api} spannerId={spannerId} spannerName={spannerName} sendSpannerMsg={sendSpannerMsg} />, root);
        });
    } else {
        console.error("Could not find the root element");
    }
}