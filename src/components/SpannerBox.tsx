import { useEffect, useState } from "preact/hooks";
import { calculateProfileFromSender } from "../utils";
import { h } from "preact";
import styles from "./SpannerBox.module.css";
import { Avatar, Text } from "@vector-im/compound-web";
import { WidgetApi } from "matrix-widget-api";

interface IProps {
  widget: WidgetApi;
  spannerName: string;
  owner: { sender: string; reason?: string } | null;
}

export function SpannerState({ widget, spannerName, owner }: IProps) {
  const [spannerProfile, setSpannerProfile] = useState<{
    displayname: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      if (owner) {
        setSpannerProfile(
          await calculateProfileFromSender(widget, owner.sender),
        );
      }
    })();
  }, [widget, owner]);

  if (owner) {
    return (
      <section className={styles.container}>
        <div className={styles.profileBox}>
          <Avatar
            name={spannerProfile?.displayname}
            src={spannerProfile?.avatar}
            id={owner?.sender}
            type="round"
          />
          <Text size="lg">
            {spannerProfile?.displayname ?? owner.sender} has {spannerName}
          </Text>
        </div>
        {owner?.reason && (
          <Text size="lg" className={styles.reason}>
            Reason: {owner?.reason}
          </Text>
        )}
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <div>Nobody has {spannerName}.</div>
    </section>
  );
}
