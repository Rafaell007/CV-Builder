import { DropdownMenu } from "radix-ui";
import { LogoutIcon, PersonOutlineIcon, SettingsIcon } from "@/shared/components/icons";
import { Link } from "@/shared/i18n";
import styles from "./ProfileMenu.module.css";

export interface ProfileMenuLabels {
  profile: string;
  settings: string;
  logout: string;
}

export interface ProfileMenuProps {
  /** Full name of the signed-in user; its first letter is the avatar. */
  name: string;
  profileHref: string;
  settingsHref: string;
  labels: ProfileMenuLabels;
  onLogout: () => void;
}

/** The profile row at the bottom of the sidebar; it opens a menu above itself, as wide as the sidebar. */
export function ProfileMenu({
  name,
  profileHref,
  settingsHref,
  labels,
  onLogout,
}: ProfileMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={styles.trigger}>
        <span className={styles.avatar} aria-hidden="true">
          {name.charAt(0)}
        </span>
        <span className={styles.name}>{name}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} side="top" align="start" sideOffset={5}>
          <DropdownMenu.Item className={styles.item} asChild>
            <Link href={profileHref}>
              <PersonOutlineIcon className={styles.icon} aria-hidden="true" />
              {labels.profile}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={styles.item} asChild>
            <Link href={settingsHref}>
              <SettingsIcon className={styles.icon} aria-hidden="true" />
              {labels.settings}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={styles.separator} />
          <DropdownMenu.Item className={styles.item} onSelect={onLogout}>
            <LogoutIcon className={styles.icon} aria-hidden="true" />
            {labels.logout}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
