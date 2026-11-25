"use client";

import { useId } from "react";
import { Avatar } from "@/shared/components";
import { useUserProfile } from "./useUserProfile";
import styles from "./UserProfile.module.css";

export interface UserProfileProps {
  userId: string;
}

/** Content of the Profile tab (PLAN S6.3): the avatar (initials), the name, the email and "A member since …". */
export function UserProfile({ userId }: UserProfileProps) {
  const { name, email, memberSince } = useUserProfile(userId);
  const nameId = useId();

  return (
    <section className={styles.profile} aria-labelledby={nameId}>
      <Avatar name={name} size="large" />
      <h2 id={nameId} className={styles.name}>
        {name}
      </h2>
      {email && <p className={styles.email}>{email}</p>}
      {memberSince && <p className={styles.memberSince}>{memberSince}</p>}
    </section>
  );
}
