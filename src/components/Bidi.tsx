import { Fragment } from 'react';

// An Arabic-script run: keeps internal spaces, never trailing whitespace
// (a trailing space inside an RTL <bdi> collapses against the next word).
const ARABIC_RUN = /([؀-ۿ](?:[؀-ۿ\s]*[؀-ۿ])?)/g;
const HAS_ARABIC = /[؀-ۿ]/;

/**
 * Renders mixed-direction text safely: Arabic-script runs are wrapped in
 * <bdi dir="rtl"> so they read right-to-left without disturbing the
 * surrounding left-to-right sentence.
 */
export default function Bidi({ text }: { text: string }) {
  if (!HAS_ARABIC.test(text)) return <>{text}</>;
  const parts = text.split(ARABIC_RUN);
  return (
    <>
      {parts.map((part, i) =>
        HAS_ARABIC.test(part) ? (
          <bdi key={i} dir="rtl" lang="ar">
            {part}
          </bdi>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
