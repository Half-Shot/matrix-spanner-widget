import { useEffect, useState } from "preact/hooks";
import { calculateProfileFromSender } from "../utils";
import { h } from "preact";
import styles from "./SpannerBox.module.css";
import { Avatar, Text } from "@vector-im/compound-web";
import { WidgetApi } from "matrix-widget-api";
import { SpannerProfileState } from "../types";

interface IProps {
  widget: WidgetApi;
  spannerName: string;
  owner: { sender: string; reason?: string } | null;
}

export function SpannerState({ widget, spannerName, owner }: IProps) {
  const [spannerProfile, setSpannerProfile] =
    useState<SpannerProfileState | null>(null);

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
        <p className={styles.profileBox}>
          <Avatar
            name={spannerProfile?.displayname}
            src={spannerProfile?.avatarUrl}
            id={owner?.sender}
            type="round"
          />
          <p>
            <Text as="span" weight="bold">
              {spannerProfile?.displayname ?? owner.sender}
            </Text>{" "}
            has {spannerName}
          </p>
        </p>
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
