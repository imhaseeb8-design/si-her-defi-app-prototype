'use client';
// "Label input" from Bencho (bencho.dev/licence, MIT), adapted as this project's standard text field:
//  - fills its container instead of a fixed 280px: the outline is drawn from the measured width
//  - controlled (value/onChange), with name, autoComplete, required, invalid and disabled for forms
//  - height is a prop (the Figma field is 48px), and the lift follows the label's resting line
//  - `multiline` renders a textarea: the label rests on its first line and lifts the same way
//  - `placeholder` is a hint shown only once you are in an empty field (the label is the placeholder)
//  - `adornment` sits inside the field on the right (e.g. "From your application") and steps aside while you type
// Styles live in globals.css under "Label input". Comments below are Bencho's, kept on purpose.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* ══ Label input ══════════════════════════════════════════
   A field whose label is its placeholder until you are in it.
   On focus the label lifts into the top edge with a small hop
   running along its letters, the outline darkens in place, and
   the top line parts under the label from its middle outward.

   ── ONE THING MOVES ─────────────────────────────────────
   It used to DRAW its outline out of the notch, both ways
   round the field — and that was the field performing, which
   is too much for a thing you focus forty times a day. Now the
   outline is always whole; focus only changes its ink and
   opens the gap. The label is the event, and the line makes
   room for it.

   The gap is two short paths across the notch, each from the
   middle to one side, retracted from the middle outward by a
   negative dash offset. */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* the lifted label's size, against its resting one */
const S = 0.78;
/* the stroke sits half a stroke inside the box so none of it
   is clipped by the svg's own edge */
const IN = 0.75;
/* a multi-line field's label rests on its first line: 14px of
   padding plus half of a 20px line */
const FIRST_LINE = 24;

export function LabelInput({
  field = 'Email',
  label: labelText,
  type,
  multiline = false,
  /* the field's corner, px — at half the height it is a pill */
  corner = 14,
  /* the field's height, px (Bencho's is 52; the Figma field is 48) */
  height,
  /* a showcase, not a form: on a touch screen, keep the device's
     keyboard down. Off by default — a real field wants its
     keyboard — and the bench turns it on for its feed */
  showcase = false,
  value: controlled,
  onChange,
  name,
  autoComplete = 'off',
  placeholder,
  maxLength,
  required = false,
  invalid = false,
  disabled = false,
  autoFocus = false,
  describedBy,
  adornment,
  id: idProp,
}: {
  field?: 'Email' | 'Password';
  label?: string;
  type?: 'text' | 'email' | 'url';
  multiline?: boolean;
  corner?: number;
  height?: number;
  showcase?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
  adornment?: ReactNode;
  id?: string;
} = {}) {
  const H = height ?? (multiline ? 104 : 52);
  const r = clamp(corner, 0, H / 2);
  const secret = !multiline && field === 'Password' && !type;
  const label = labelText ?? (secret ? 'Password' : 'Email');
  const inputType = type ?? (secret ? 'password' : 'email');
  const auto = `lbi-${useId().replace(/:/g, '')}`;
  const id = idProp ?? auto;

  const [focus, setFocus] = useState(false);
  const [quiet] = useState(() => showcase && typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [own, setOwn] = useState('');
  const value = controlled ?? own;
  const setValue = (v: string) => { if (controlled === undefined) setOwn(v); onChange?.(v); };
  const [autofilled, setAutofilled] = useState(false);
  const [show, setShow] = useState(false);
  const [flip, setFlip] = useState(0);
  const input = useRef<HTMLInputElement | null>(null);

  /* the outline is drawn to the field's real width, so the box
     is measured and redrawn when its container changes size */
  const box = useRef<HTMLDivElement | null>(null);
  const [W, setW] = useState(280);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setW(Math.max(120, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* the notch is the label's own width, so it is measured */
  const lab = useRef<HTMLLabelElement | null>(null);
  const [lw, setLw] = useState(40);
  useLayoutEffect(() => {
    if (lab.current) setLw(lab.current.offsetWidth);
  }, [label]);

  /* the adornment's width is kept clear of the text */
  const adorn = useRef<HTMLSpanElement | null>(null);
  const [aw, setAw] = useState(0);
  useLayoutEffect(() => {
    setAw(adornment && adorn.current ? adorn.current.offsetWidth + 12 : 0);
  }, [adornment]);

  /* a different kind of field starts empty — an email left in
     a password box would be shown in the clear */
  useEffect(() => {
    setOwn('');
    setShow(false);
  }, [field]);

  const up = focus || value.length > 0 || autofilled;

  /* ── where the label sits, and the gap it leaves ─────────
     Never inside the corner's curve: the notch has to open on
     the straight part of the top edge, so a rounder field
     starts its label further in. */
  const lx = Math.max(14, r + 4);
  const x0 = Math.max(r * 0.6, lx - 5);
  const x1 = lx + lw * S + 5;
  const a = r - IN;
  const R = W - IN;
  const B = H - IN;
  const mid = W / 2;
  /* the gap, as two halves from its middle to each side */
  const nm = (x0 + x1) / 2;
  const gapL = `M${nm},${IN} L${x0},${IN}`;
  const gapR = `M${nm},${IN} L${x1},${IN}`;
  /* right: from the notch, clockwise, to the bottom middle */
  const right = r > 0
    ? `M${x1},${IN} L${W - r},${IN} A${a},${a} 0 0 1 ${R},${r} L${R},${H - r} A${a},${a} 0 0 1 ${W - r},${B} L${mid},${B}`
    : `M${x1},${IN} L${R},${IN} L${R},${B} L${mid},${B}`;
  /* left: from the notch, the other way round, to the same point */
  const left = r > 0
    ? `M${x0},${IN} L${r},${IN} A${a},${a} 0 0 0 ${IN},${r} L${IN},${H - r} A${a},${a} 0 0 0 ${r},${B} L${mid},${B}`
    : `M${x0},${IN} L${IN},${IN} L${IN},${B} L${mid},${B}`;

  const reveal = () => {
    setShow((s) => !s);
    setFlip((f) => f + 1);
  };

  /* where the label rests, and how far it travels to the edge:
     half the field for one line, the first line for many */
  const rest = multiline ? `${FIRST_LINE}px` : '50%';
  const lift = multiline ? FIRST_LINE : H / 2;
  const padRight = secret ? 48 : Math.max(lx, aw);

  const shared = {
    id,
    name,
    className: 'lbi-field',
    value,
    disabled,
    required,
    maxLength,
    placeholder,
    autoFocus,
    'aria-invalid': invalid,
    'aria-describedby': describedBy,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    spellCheck: false,
  };

  return (
    <div className="lbi" data-up={up} data-focus={focus} data-filled={value.length > 0} data-invalid={invalid} data-disabled={disabled} data-multiline={multiline}>
      <div
        ref={box}
        className="lbi-box"
        style={{ width: '100%', height: H, borderRadius: r, '--lbi-x': `${lx}px`, '--lbi-rest': rest, '--lbi-lift': `${lift}px` } as React.CSSProperties}
      >
        <svg className="lbi-ring" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <path d={right} />
          <path d={left} />
          <path className="lbi-gap" d={gapL} pathLength={1} />
          <path className="lbi-gap" d={gapR} pathLength={1} />
        </svg>

        <label className="lbi-label" htmlFor={id} ref={lab}>
          {[...label].map((ch, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties}>{ch}</span>
          ))}
        </label>

        {multiline ? (
          <textarea
            {...shared}
            onChange={(e) => setValue(e.target.value)}
            style={{ paddingRight: padRight }}
          />
        ) : (
          <input
            {...shared}
            ref={input}
            data-flip={flip % 2}
            type={secret && show ? 'text' : inputType === 'password' && !secret ? 'text' : inputType}
            onChange={(e) => { setValue(e.target.value); if (autofilled) setAutofilled(false); }}
            /* a browser's autofill sets the value without a change
               event; the field hears it through a no-op animation
               (see .lbi-field:-webkit-autofill) and lifts the label */
            onAnimationStart={(e) => { if (e.animationName === 'lbi-autofill') setAutofilled(true); }}
            autoComplete={autoComplete}
            autoCapitalize={inputType === 'text' ? undefined : 'none'}
            /* ── no keyboard, when it is only being shown ─────
               In a feed you are scrolling on a phone, a tap that
               lands on the field threw the keyboard up over the
               page. inputMode "none" keeps everything the block is
               about — the focus, the label lifting, the gap
               opening — and only tells the device not to raise its
               keyboard. A mouse and a hardware keyboard are
               untouched, and so is any real use of this field. */
            inputMode={quiet ? 'none' : inputType === 'email' ? 'email' : inputType === 'url' ? 'url' : undefined}
            style={{ paddingRight: padRight }}
          />
        )}

        {adornment && <span ref={adorn} className="lbi-adorn" aria-hidden="true">{adornment}</span>}

        {secret && (
          <button
            className="lbi-eye"
            type="button"
            data-show={show}
            /* keep focus in the field: the eye is a toggle on
               what you are typing, not somewhere to go */
            onPointerDown={(e) => e.preventDefault()}
            onClick={reveal}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
            <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
