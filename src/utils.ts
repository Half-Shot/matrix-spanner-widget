import {
  IWidgetApiRequest,
  WidgetApi,
  WidgetApiToWidgetAction,
} from "matrix-widget-api";
import { SpannerProfileState } from "./types";
import { useEffect, useState } from "preact/hooks";

export function onWidgetEventHook<T = IWidgetApiRequest>(
  widget: WidgetApi,
  action: WidgetApiToWidgetAction,
  innerFn: (ev: CustomEvent<T>) => void,
): boolean {
  const [hooked, setHooked] = useState<boolean>(false);
  useEffect(() => {
    const fn = (ev: CustomEvent<T>) => {
      innerFn(ev);
      ev.preventDefault();
    };
    widget.on(`action:${action}`, fn);
    setHooked(true);
    return () => {
      widget.off(`action:${action}`, fn);
    };
  }, [widget]);
  return hooked;
}

export async function calculateProfileFromSender(
  widget: WidgetApi,
  sender: string,
): Promise<SpannerProfileState> {
  const [memberState] = await widget.readStateEvents(
    "m.room.member",
    1,
    sender,
  );
  const profile =
    memberState?.content &&
    (memberState.content as { displayname?: string; avatar_url?: string });
  if (!profile.displayname) {
    return { displayname: sender };
  }
  let avatarUrl: string | undefined;
  if (profile.avatar_url) {
    const { file } = await widget.downloadFile(profile.avatar_url);
    if (file instanceof Blob) {
      avatarUrl = URL.createObjectURL(file);
    } else {
      console.log("File not a blob, could not handle");
    }
  }
  return { displayname: profile.displayname, avatarUrl };
  // if (event?.content.active) {
  //   fetch(new Request(`${ProfileLookupURL}${encodeURIComponent(event.sender)}`))
  //     .then((res) => {
  //       return res.json();
  //     })
  //     .then((res) => {
  //       let avatar = undefined;
  //       if (res.avatar_url) {
  //         avatar = `${ThumbnailURL}${res.avatar_url.replace("mxc://", "")}?width=48&height=48&method=scale`;
  //       }
  //       setHasSpanner({
  //         displayname: res.displayname || event.sender,
  //         avatar,
  //       });
  //     })
  //     .catch(() => {
  //       // No profile, just set the sender.
  //       setHasSpanner({ displayname: event.sender });
  //     });
  //   return;
  // }
  // setHasSpanner(null);
}
