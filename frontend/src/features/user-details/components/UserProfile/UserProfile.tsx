"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { AVATAR_MAX_MB } from "../../user-details.constants";
import { useAvatarActions } from "../../useAvatarActions";
import { AvatarUpload } from "../AvatarUpload";
import { ProfileAvatar } from "../ProfileAvatar";
import { ProfileForm } from "../ProfileForm";
import { useUserProfile } from "./useUserProfile";
import styles from "./UserProfile.module.css";

export interface UserProfileProps {
  userId: string;
}

/**
 * Content of the Profile tab (PLAN S6.3): the avatar with the upload control and the Remove button (only for who may
 * edit), the name, the email and "A member since …", then the profile form (read-only unless `canEdit`).
 */
export function UserProfile({ userId }: UserProfileProps) {
  const t = useTranslations("userDetails.profile.avatar");
  const { name, email, memberSince, canEdit, canVerifyEmail, user, avatarUrl } =
    useUserProfile(userId);
  // `user.id`, not the route's `userId`: the backend answers the id lower case (see `useUserProfile`).
  const avatar = useAvatarActions(user.id);
  const nameId = useId();

  return (
    <section className={styles.profile} aria-labelledby={nameId}>
      <div className={styles.avatarRow}>
        <ProfileAvatar
          name={name}
          src={avatarUrl}
          removeLabel={t("remove")}
          onRemove={canEdit && avatarUrl ? avatar.remove : undefined}
          disabled={avatar.busy}
        />
        {canEdit && (
          <div className={styles.upload}>
            <AvatarUpload
              label={t("upload")}
              hint={t("hint", { max: AVATAR_MAX_MB })}
              disabled={avatar.busy}
              onFileSelect={avatar.upload}
            />
          </div>
        )}
      </div>
      <h2 id={nameId} className={styles.name}>
        {name}
      </h2>
      {email && <p className={styles.email}>{email}</p>}
      {memberSince && <p className={styles.memberSince}>{memberSince}</p>}
      <ProfileForm user={user} canEdit={canEdit} canVerifyEmail={canVerifyEmail} />
    </section>
  );
}
