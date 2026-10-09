'use client';
// "Label input" from Bencho (bencho.dev/licence, MIT), adapted for real forms in this project:
//  - fills its container instead of a fixed 280px: the outline is drawn from the measured width
//  - controlled (value/onChange), with name, autoComplete, invalid and disabled for forms
//  - height is a prop (the Figma field is 48px), and the lift follows half of it
// Styles live in globals.css under "Label input". Comments below are Bencho's, kept on purpose.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
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

export function LabelInput({
  field = 'Email',
  label: labelText,
  /* the field's corner, px — at half the height it is a pill */
  corner = 14,
  /* the field's height, px (Bencho's is 52; the Figma field is 48) */
  height = 52,
  /* a showcase, not a form: on a touch screen, keep the device's
     keyboard down. Off by default — a real field wants its
     keyboard — and the bench turns it on for its feed */
  showcase = false,
  value: controlled,
  onChange,
  name,
  autoComplete = 'off',
  invalid = false,
  disabled = false,
  describedBy,
  id: idProp,
}: {
  field?: 'Email' | 'Password';
  label?: string;
  corner?: number;
  height?: number;
  showcase?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  autoComplete?: string;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  id?: string;
} = {}) {
  const H = height;
  const r = clamp(corner, 0, H / 2);
  const secret = field === 'Password';
  const label = labelText ?? (secret ? 'Password' : 'Email');
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

  return (
    <div className="lbi" data-up={up} data-focus={focus} data-filled={value.length > 0} data-invalid={invalid} data-disabled={disabled}>
      <div
        ref={box}
        className="lbi-box"
        style={{ width: '100%', height: H, borderRadius: r, '--lbi-x': `${lx}px`, '--lbi-lift': `${H / 2}px` } as React.CSSProperties}
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

        <input
          ref={input}
          id={id}
          name={name}
          className="lbi-field"
          data-flip={flip % 2}
          type={secret && !show ? 'password' : secret ? 'text' : 'email'}
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => { setValue(e.target.value); if (autofilled) setAutofilled(false); }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          /* a browser's autofill sets the value without a change
             event; the field hears it through a no-op animation
             (see .lbi-field:-webkit-autofill) and lifts the label */
          onAnimationStart={(e) => { if (e.animationName === 'lbi-autofill') setAutofilled(true); }}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          /* ── no keyboard, when it is only being shown ─────
             In a feed you are scrolling on a phone, a tap that
             lands on the field threw the keyboard up over the
             page. inputMode "none" keeps everything the block is
             about — the focus, the label lifting, the gap
             opening — and only tells the device not to raise its
             keyboard. A mouse and a hardware keyboard are
             untouched, and so is any real use of this field. */
          inputMode={quiet ? 'none' : secret ? undefined : 'email'}
          style={{ paddingRight: secret ? 48 : lx }}
        />

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
