'use client';

interface Props {
  iso: string;
  short?: boolean;
}

export default function LocalTime({ iso, short = true }: Props) {
  const date = new Date(iso);
  const formatted = date.toLocaleString('en-US', short
    ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }
  );
  return <>{formatted}</>;
}
