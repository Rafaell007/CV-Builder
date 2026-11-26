"use client";

import { useId, type ChangeEvent } from "react";
import { FileUploadIcon } from "@/shared/components/icons";
import { AVATAR_MIME_TYPES } from "../../user-details.constants";
import styles from "./AvatarUpload.module.css";

export interface AvatarUploadProps {
  /** Visible text of the control, also the file input's name (e.g. "Upload avatar image"). */
  label: string;
  /** Line under the control with the allowed types and size; screen readers read it as the description. */
  hint: string;
  /** True while an upload or a removal runs: the file picker cannot open. */
  disabled?: boolean;
  /** Called with the chosen file. Not called when the picker is closed without a file. */
  onFileSelect: (file: File) => void;
}

/**
 * Figma Design system › Avatar Uploader (Default, "Adding" on hover): an upload icon and a label for a visually
 * hidden file input, so the browser's own picker opens by click, Enter or Space. Texts come by props.
 */
export function AvatarUpload({ label, hint, disabled = false, onFileSelect }: AvatarUploadProps) {
  const hintId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input, so choosing the same file again (e.g. after an error) fires `change` again.
    event.target.value = "";
    if (file) onFileSelect(file);
  }

  return (
    <div className={styles.upload}>
      <label className={styles.control}>
        <input
          type="file"
          className={styles.input}
          accept={AVATAR_MIME_TYPES.join(",")}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={handleChange}
        />
        <FileUploadIcon className={styles.icon} width={35} height={35} />
        <span className={styles.label}>{label}</span>
      </label>
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
    </div>
  );
}
