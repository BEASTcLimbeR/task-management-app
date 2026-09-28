"use client";

import type { ReactNode, SVGProps } from "react";
import Link from "next/link";
import { SquareCheck } from "lucide-react";
import { motion, MotionConfig } from "motion/react";

type IconProps = SVGProps<SVGSVGElement>;

// GitHub mark (lucide-react 1.x no longer ships brand icons)
function Github(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

// LinkedIn mark (same stroke style as lucide)
function Linkedin(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

type FooterProps = {
  onAddTask?: () => void;
  onPendingTasks?: () => void;
  onCompletedTasks?: () => void;
  onOpenShortcuts?: () => void;
};

type FooterItem = {
  title: string;
  href: string;
  onClick?: () => void;
  external?: boolean;
  icon?: typeof Github;
};

const FOCUS_CLASS =
  "rounded-sm focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:focus-visible:ring-sky-400";

const ITEM_CLASS = `inline-flex max-w-full items-center text-left transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-100 ${FOCUS_CLASS}`;

// Shared fade-and-blur-in wrapper (MotionConfig below turns this off when the user prefers less motion)
function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: {
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      transition={{ delay, duration: 0.8 }}
      viewport={{ once: true }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}

// Render an in-page action, an internal Next.js route, or an external URL
function FooterLink({ item }: { item: FooterItem }) {
  const Icon = item.icon;

  const content = (
    <>
      {Icon ? <Icon className="me-1 size-4 shrink-0" aria-hidden="true" /> : null}
      <span className="break-words">{item.title}</span>
    </>
  );

  if (item.onClick) {
    return (
      <button type="button" className={ITEM_CLASS} onClick={item.onClick}>
        {content}
      </button>
    );
  }

  if (item.external) {
    return (
      <a
        className={ITEM_CLASS}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={ITEM_CLASS} href={item.href}>
      {content}
    </Link>
  );
}

// Site footer: brand, app actions, docs, stack, and social links
export function Footer({
  onAddTask,
  onPendingTasks,
  onCompletedTasks,
  onOpenShortcuts,
}: FooterProps) {
  const year = new Date().getFullYear();

  const footerLinks: { label: string; links: FooterItem[] }[] = [
    {
      label: "App",
      links: [
        { title: "Add a task", href: "/#add-task", onClick: onAddTask },
        {
          title: "Pending tasks",
          href: "/?status=pending#task-list",
          onClick: onPendingTasks,
        },
        {
          title: "Completed tasks",
          href: "/?status=completed#task-list",
          onClick: onCompletedTasks,
        },
        { title: "Keyboard shortcuts", href: "/", onClick: onOpenShortcuts },
      ],
    },
    {
      label: "Docs",
      links: [
        { title: "Documentation", href: "/docs" },
        { title: "Tech stack", href: "/docs#tech-stack" },
        { title: "API reference", href: "/docs#api" },
        {
          title: "Source code",
          href: "https://github.com/BEASTcLimbeR/task-management-app",
          external: true,
        },
      ],
    },
    {
      label: "Built with",
      links: [
        { title: "Next.js", href: "https://nextjs.org", external: true },
        {
          title: "Flask",
          href: "https://flask.palletsprojects.com",
          external: true,
        },
        { title: "SQLite", href: "https://www.sqlite.org", external: true },
        {
          title: "Tailwind CSS",
          href: "https://tailwindcss.com",
          external: true,
        },
      ],
    },
    {
      label: "Connect",
      links: [
        {
          title: "GitHub",
          href: "https://github.com/BEASTcLimbeR",
          external: true,
          icon: Github,
        },
        {
          title: "LinkedIn",
          href: "https://www.linkedin.com/in/rutvij-deo-08aa93194/",
          external: true,
          icon: Linkedin,
        },
      ],
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
    <footer className="page-gutter relative mx-auto mt-10 flex w-full min-w-0 max-w-5xl flex-col items-center justify-center overflow-x-hidden rounded-t-[2rem] border-t border-slate-200 bg-white py-6 md:rounded-t-[3rem] md:px-6 dark:border-slate-700 dark:bg-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(35%_128px_at_50%_0%,rgba(14,165,233,0.14),transparent)] dark:bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.08),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400/40 blur dark:bg-slate-300/20"
      />

      <div className="relative grid w-full min-w-0 gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="min-w-0 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <SquareCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="font-semibold">Task Manager App</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Plan, track and finish your tasks — fast.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {year} Rutvij Deo
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer
              className="min-w-0"
              delay={0.1 + index * 0.1}
              key={section.label}
            >
              <div className="mb-4 md:mb-0">
                <h3 className="text-xs font-medium tracking-wide text-slate-900 uppercase dark:text-slate-100">
                  {section.label}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {section.links.map((link) => (
                    <li className="min-w-0" key={`${section.label}-${link.title}`}>
                      <FooterLink item={link} />
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
    </MotionConfig>
  );
}
