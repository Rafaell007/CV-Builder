import { useImperativeHandle, type Ref } from "react";

// Gives the caller's ref (React Hook Form's field.ref) the element with this id.
// Libraries such as Downshift, Radix and react-datepicker keep their own ref on the element,
// so the form's ref is filled from the DOM instead. The element exists once the component has mounted.
export function useElementByIdRef<T extends HTMLElement>(ref: Ref<T> | undefined, id: string) {
  useImperativeHandle(ref, () => document.getElementById(id) as T, [id]);
}
