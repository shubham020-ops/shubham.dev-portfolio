import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { submitContactForm } from '../services/contactService';
import AnimatedButton from './AnimatedButton';
import { usePortfolio } from '../context/PortfolioContext';

const initial = { name: '', email: '', subject: '', message: '', website: '' };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v) {
  const e = {};
  const name = v.name.trim();
  const email = v.email.trim();
  const subject = v.subject.trim();
  const message = v.message.trim();
  if (name.length < 2 || name.length > 100) e.name = 'Please enter a name between 2 and 100 characters.';
  if (email.length > 254 || !emailRe.test(email)) e.email = 'Please enter a valid email address.';
  if (subject.length < 2) e.subject = 'Please enter a subject.';
  if (subject.length > 160) e.subject = 'Subject must be 160 characters or fewer.';
  if (message.length < 20 || message.length > 10000) e.message = 'Message must be between 20 and 10,000 characters.';
  return e;
}

function submissionError(error) {
  if (error.status === 429) return 'Too many messages were sent. Please wait a little before trying again.';
  if (error.status === 400 && error.message) return error.message;
  if (error.status >= 500) return 'The message service could not save this right now. Please try again shortly.';
  return 'Could not reach the message service. Check your connection and try again, or email me directly.';
}

const fieldBase =
  'w-full border-b border-line bg-transparent px-0 py-3.5 text-base text-fg placeholder:text-muted/70 transition-colors focus:border-lime focus:outline-none';

export default function ContactForm() {
  const { content } = usePortfolio();
  const site = content.site;
  const submitting = useRef(false);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const set = (name) => (e) => {
    const next = { ...values, [name]: e.target.value };
    setValues(next);
    if (status !== 'loading') setStatus('idle');
    setErrorMessage('');
    if (touched[name]) setErrors(validate(next));
  };
  const blur = (name) => () => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(values));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    const found = validate(values);
    setErrors(found);
    setTouched({ name: true, email: true, subject: true, message: true });
    if (Object.keys(found).length) {
      // move focus to the first invalid field
      const first = ['name', 'email', 'subject', 'message'].find((k) => found[k]);
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }
    submitting.current = true;
    setStatus('loading');
    setErrorMessage('');
    try {
      const result = await submitContactForm(values);
      if (!result.stored) throw new Error('Message could not be stored.');
      setStatus('success');
      setValues(initial);
      setErrors({});
      setTouched({});
    } catch (error) {
      setStatus('error');
      setErrorMessage(submissionError(error));
    } finally {
      submitting.current = false;
    }
  };

  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(
    values.subject || 'Project enquiry'
  )}&body=${encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`)}`;

  const field = (id, label, control, error) => (
    <div>
      <label htmlFor={`cf-${id}`} className="eyebrow">
        {label}
      </label>
      {control}
      {error && touched[id] && (
        <p id={`cf-${id}-error`} role="alert" className="mt-2 text-sm text-[#ff7a7a]">
          {error}
        </p>
      )}
    </div>
  );

  const aria = (id) => ({
    'aria-invalid': Boolean(errors[id] && touched[id]),
    'aria-describedby': errors[id] && touched[id] ? `cf-${id}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-7" aria-label="Contact form">
      <input
        type="text"
        name="website"
        value={values.website}
        onChange={set('website')}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      <div className="grid gap-7 md:grid-cols-2">
        {field(
          'name',
          'Full name',
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            disabled={status === 'loading'}
            placeholder="Jane Doe"
            value={values.name}
            onChange={set('name')}
            onBlur={blur('name')}
            className={fieldBase}
            {...aria('name')}
          />,
          errors.name
        )}
        {field(
          'email',
          'Email address',
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={status === 'loading'}
            placeholder="jane@company.com"
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            className={fieldBase}
            {...aria('email')}
          />,
          errors.email
        )}
      </div>

      {field(
        'subject',
        'Subject',
        <>
          <input
            id="cf-subject"
            name="subject"
            type="text"
            required
            maxLength={160}
            autoComplete="off"
            disabled={status === 'loading'}
            list={content.contactTypes.length > 0 ? 'cf-subject-suggestions' : undefined}
            placeholder="What would you like to discuss?"
            value={values.subject}
            onChange={set('subject')}
            onBlur={blur('subject')}
            className={fieldBase}
            {...aria('subject')}
          />
          {content.contactTypes.length > 0 && (
            <datalist id="cf-subject-suggestions">
              {content.contactTypes.map((type) => <option key={type} value={type} />)}
            </datalist>
          )}
        </>,
        errors.subject
      )}

      {field(
        'message',
        'Message',
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          maxLength={10000}
          disabled={status === 'loading'}
          placeholder="Tell me about your project, timeline and goals…"
          value={values.message}
          onChange={set('message')}
          onBlur={blur('message')}
          className={`${fieldBase} resize-y`}
          {...aria('message')}
        />,
        errors.message
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'loading'} className="btn btn-primary">
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            'Send message'
          )}
        </button>
        {site.email && <AnimatedButton href={mailto} variant="ghost" icon={false}>
          Or email directly
        </AnimatedButton>}
      </div>

      <div aria-live="polite" className="min-h-[3.5rem]">
        {status === 'success' && (
          <p className="border border-lime/40 bg-lime/5 p-4 text-sm text-fg/90">
            <strong className="text-lime">Message saved.</strong> Thanks for reaching out. Your message is in the contact inbox.
          </p>
        )}
        {status === 'error' && (
          <p className="border border-[#ff7a7a]/40 bg-[#ff7a7a]/5 p-4 text-sm text-fg/90">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
