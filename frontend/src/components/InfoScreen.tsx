import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import type { ReactNode } from "react";

/** Static informational page route supported by the app. */
export type InfoPageKind = "about" | "contact" | "privacy" | "terms";

type InfoScreenProps = {
  page: InfoPageKind;
  onReturnHome: () => void;
};

type InfoPageAction = {
  href: string;
  icon: ReactNode;
  label: string;
};

type InfoPageSection = {
  title: string;
  paragraphs: ReactNode[];
  list?: string[];
  afterList?: ReactNode;
  action?: InfoPageAction;
};

type InfoPage = {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate?: string;
  sections: InfoPageSection[];
};

const CONTACT_EMAIL = "matrizaev@gmail.com";
const REPOSITORY_URL = "https://github.com/matrizaev/rust-daily";
const ISSUES_URL = `${REPOSITORY_URL}/issues`;
const effectiveDate = "July 9, 2026";

const INFO_PAGES: Record<InfoPageKind, InfoPage> = {
  about: {
    eyebrow: "The project",
    title: "About Rust Daily",
    summary:
      "Short, deterministic Rust practice built around realistic code and local-first progress.",
    sections: [
      {
        title: "Focused, practical Rust",
        paragraphs: [
          "Rust Daily is a local-first learning app for developers who know Rust syntax and want regular practice writing clear, idiomatic code. Lessons use short production-style refactors, deterministic checks, public tests, hints, and authored solutions.",
        ],
      },
      {
        title: "How it works",
        paragraphs: [
          "Your progress, preferences, and draft code stay in your browser. Browser checks provide immediate feedback, while Cargo-backed checks send the current lesson files to an isolated Rust runner. There are no user accounts, cloud progress sync, advertisements, or analytics.",
        ],
      },
      {
        title: "Project",
        paragraphs: [
          "Rust Daily is an independent project. It is not affiliated with or endorsed by the Rust Project or the Rust Foundation.",
        ],
        action: {
          href: REPOSITORY_URL,
          icon: <ExternalLink size={17} aria-hidden="true" />,
          label: "View the source repository",
        },
      },
    ],
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Contact",
    summary:
      "Choose a private email or a public issue based on what you need to share.",
    sections: [
      {
        title: "Email",
        paragraphs: [
          "For privacy requests, security reports, or questions that should not be public, send an email. Do not include passwords, access tokens, or other secrets.",
        ],
        action: {
          href: `mailto:${CONTACT_EMAIL}`,
          icon: <Mail size={17} aria-hidden="true" />,
          label: CONTACT_EMAIL,
        },
      },
      {
        title: "Issues and feedback",
        paragraphs: [
          "For bugs, lesson corrections, and feature requests, open a GitHub issue. Issues are public, so do not post personal or security-sensitive information there.",
        ],
        action: {
          href: ISSUES_URL,
          icon: <ExternalLink size={17} aria-hidden="true" />,
          label: "Open the issue tracker",
        },
      },
    ],
  },
  privacy: {
    eyebrow: "Your data",
    title: "Privacy Policy",
    summary:
      "What Rust Daily stores, what reaches the server, and the choices available to you.",
    effectiveDate,
    sections: [
      {
        title: "Who is responsible",
        paragraphs: [
          <>
            Rust Daily is operated by Viacheslav Matrizaev. Questions and
            requests about this policy can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>,
        ],
      },
      {
        title: "Information stored in your browser",
        paragraphs: [
          "Rust Daily uses local storage for lesson progress, draft code, theme, editor font size, and reduced-motion preference. The service worker also caches app files and lessons for offline use. This information remains on your device unless you export it or submit draft code for a validation run.",
          "You can delete progress and drafts from Settings. You can clear all local data and cached files using your browser or by uninstalling the PWA.",
        ],
      },
      {
        title: "Validation runs",
        paragraphs: [
          "When you run Cargo-backed validation, the current lesson files and the dependency-set selection are sent to the Rust Daily server. They are placed in an isolated temporary workspace, used to compile and test the submission, and removed after the run. Do not submit secrets, personal data, or code you are not permitted to share.",
        ],
      },
      {
        title: "Server and network data",
        paragraphs: [
          "The hosting and network infrastructure may process IP addresses, request timestamps, requested paths, browser or device metadata, and security events. The application also records operational job IDs, outcomes, durations, and runner errors, but does not intentionally log submitted source code.",
          "This data is used to deliver and secure the service, diagnose failures, prevent abuse, and maintain capacity. It is processed on the basis of the operator's legitimate interests in running a reliable and secure service and retained only as long as needed for those purposes under the applicable server and provider retention settings.",
        ],
      },
      {
        title: "Cookies and similar technologies",
        paragraphs: [
          "Rust Daily does not currently set cookies or use advertising, analytics, cross-site tracking, or third-party embeds. Its local storage and offline cache support features you request, such as saving a draft, remembering preferences, recording progress, and using the app offline. Because no non-essential storage or tracking is used, the app does not display a cookie consent banner.",
          "If non-essential storage, analytics, or tracking is introduced, this policy and the app will be updated with appropriate controls before that technology is enabled.",
        ],
      },
      {
        title: "Sharing and international processing",
        paragraphs: [
          "Data may be processed by infrastructure providers that deliver, protect, or host the service, including Cloudflare and the server hosting provider. Data may also be disclosed when required by law or necessary to protect the service and its users. These providers may process data in countries outside your own under their applicable safeguards.",
          "If you contact the project by email or GitHub, those services process the information you provide under their own privacy policies.",
        ],
      },
      {
        title: "Your choices and rights",
        paragraphs: [
          "You control browser-stored data directly. Depending on where you live, you may also have rights to request access, correction, deletion, restriction, portability, or objection regarding personal data handled by the service. Email the address above to make a request. You may also complain to your local data protection authority.",
        ],
      },
      {
        title: "Changes to this policy",
        paragraphs: [
          "This policy may change when the service or its data practices change. The effective date above will be updated when material revisions are published.",
        ],
      },
    ],
  },
  terms: {
    eyebrow: "Service rules",
    title: "Terms of Service",
    summary:
      "The conditions that apply when you use Rust Daily and its validation runner.",
    effectiveDate,
    sections: [
      {
        title: "Agreement",
        paragraphs: [
          "By using Rust Daily, you agree to these Terms. If you do not agree, do not use the service. You must be legally able to accept these Terms in your location. If you use the service for an organization, you confirm that you have authority to bind it.",
        ],
      },
      {
        title: "The service",
        paragraphs: [
          "Rust Daily provides educational lessons, browser-based editing, local progress storage, and remote Rust compilation and testing. It is a learning aid, not professional, employment, security, or production engineering advice. Features and lesson content may change.",
        ],
      },
      {
        title: "Your submissions",
        paragraphs: [
          "You retain any rights you have in code you submit. You grant Rust Daily a limited permission to transmit, copy, compile, test, and temporarily store that code only as needed to provide validation results and operate the service.",
          "You are responsible for your submissions. Do not submit secrets, personal data, unlawful material, malicious code, or content that infringes another person's rights.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: ["You must not:"],
        list: [
          "attack, probe, bypass, or disrupt the service or its safeguards;",
          "use automated requests or workloads that unreasonably burden the validation runner;",
          "attempt to access another system, user, or submission; or",
          "use the service in violation of applicable law.",
        ],
        afterList:
          "Access may be limited or blocked when reasonably necessary to protect the service, other users, or infrastructure.",
      },
      {
        title: "Content and third-party materials",
        paragraphs: [
          "Rust Daily's lessons, interface, and branding are protected by applicable intellectual property laws. Public source code and third-party dependencies remain subject to their respective license terms. Rust names and marks belong to their respective owners; Rust Daily is not affiliated with the Rust Project or Rust Foundation.",
        ],
      },
      {
        title: "Availability and disclaimers",
        paragraphs: [
          'The service is provided on an "as is" and "as available" basis. To the extent permitted by law, no warranty is made that the service will be uninterrupted, error-free, secure, or suitable for a particular purpose. Validation results may be incomplete or incorrect, and you remain responsible for reviewing and testing your code.',
        ],
      },
      {
        title: "Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, the operator is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost data, profits, opportunities, or business arising from use of the service. Nothing in these Terms excludes liability that cannot legally be excluded.",
        ],
      },
      {
        title: "Changes and contact",
        paragraphs: [
          <>
            These Terms may be updated as the service changes. Continued use
            after revised Terms are published means you accept them. Questions
            can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>,
        ],
      },
    ],
  },
};

const InfoSection = ({ section }: { section: InfoPageSection }) => (
  <section>
    <h2>{section.title}</h2>
    {section.paragraphs.map((paragraph, index) => (
      <p key={`${section.title}-paragraph-${index}`}>{paragraph}</p>
    ))}
    {section.list ? (
      <ul>
        {section.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : null}
    {section.afterList ? <p>{section.afterList}</p> : null}
    {section.action ? (
      <a className="info-link" href={section.action.href}>
        {section.action.icon}
        {section.action.label}
      </a>
    ) : null}
  </section>
);

/** Returns the document title text for a static info page. */
export const getInfoPageTitle = (page: InfoPageKind) => INFO_PAGES[page].title;

/** Renders an about, contact, privacy, or terms page. */
export function InfoScreen({ page, onReturnHome }: InfoScreenProps) {
  const infoPage = INFO_PAGES[page];

  return (
    <main className="app-shell info-shell">
      <header className="info-header">
        <button className="icon-text-button" type="button" onClick={onReturnHome}>
          <ArrowLeft size={20} aria-hidden="true" />
          Home
        </button>
        <div>
          <p className="eyebrow">{infoPage.eyebrow}</p>
          <h1>{infoPage.title}</h1>
          <p className="info-summary">{infoPage.summary}</p>
        </div>
      </header>
      <article className="info-content">
        {infoPage.effectiveDate ? (
          <p className="info-effective-date">
            Effective {infoPage.effectiveDate}
          </p>
        ) : null}
        {infoPage.sections.map((section) => (
          <InfoSection key={section.title} section={section} />
        ))}
      </article>
    </main>
  );
}
