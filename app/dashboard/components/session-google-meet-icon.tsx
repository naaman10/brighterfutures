import { GoogleMeetCalendarIcon } from "./google-meet-calendar-icon";

type Props = {
  googleMeetAdded?: boolean | null;
  className?: string;
};

/** Laptop icon when a session has Google Meet enabled. */
export function SessionGoogleMeetIcon({ googleMeetAdded, className }: Props) {
  if (!googleMeetAdded) return null;
  return <GoogleMeetCalendarIcon className={className} />;
}
