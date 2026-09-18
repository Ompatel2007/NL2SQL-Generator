"use client";

import Image from "next/image";

interface DevelopedByViewProps {
  onBackToWorkspace?: () => void;
}

export function DevelopedByView({ onBackToWorkspace }: DevelopedByViewProps) {
  const members = [
    {
      label: "MEMBER 1",
      namePlaceholder: "Om Patel",
      regPlaceholder: "25BCE1047",
      image: "/om.jpeg"
    },
    {
      label: "MEMBER 2",
      namePlaceholder: "Utkarsh Raj",
      regPlaceholder: "25BCE1084",
      image: "/utk.jpg"
    },
    {
      label: "MEMBER 3",
      namePlaceholder: "Saurabh Kumar Satya",
      regPlaceholder: "25BCE5692",
      image: "/sau.jpg"
    },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full">
      <main
        className="max-w-5xl mx-auto w-full p-4 md:p-8 flex flex-col select-none"
        style={{ color: "var(--foreground)" }}
        aria-label="Developed By section"
      >
      {/* Top Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-8 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1
            className="text-xl md:text-2xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Developed By
          </h1>
        </div>
      </div>

      {/* Exactly Three Team Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.map((member, idx) => (
          <div
            key={idx}
            className="panel p-6 rounded-xl border flex flex-col items-center text-center shadow-xs"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
            }}
          >
            <span
              className="text-xs font-bold uppercase tracking-wider mb-4 px-2.5 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              {member.label}
            </span>

            {/* Photo Placeholder / Image */}
            <div
              className="w-44 h-44 rounded-xl border flex flex-col items-center justify-center gap-2.5 mb-5 transition-colors overflow-hidden"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--muted)",
              }}
            >
              <Image
                src={member.image}
                width={176}
                height={176}
                alt={member.label}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Member Details */}
            <div className="w-full space-y-3 text-left pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div>
                <span
                  className="text-xs font-semibold block"
                  style={{ color: "var(--muted)" }}
                >
                  Name:
                </span>
                <span
                  className="text-sm font-medium block"
                  style={{ color: "var(--foreground)" }}
                >
                  {member.namePlaceholder}
                </span>
              </div>

              <div>
                <span
                  className="text-xs font-semibold block"
                  style={{ color: "var(--muted)" }}
                >
                  Registration No:
                </span>
                <span
                  className="text-sm font-medium font-mono block"
                  style={{ color: "var(--foreground)" }}
                >
                  {member.regPlaceholder}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Faculty Advisor Section */}
      <div
        className="mt-10 pt-6 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="panel p-6 rounded-xl border max-w-md mx-auto text-center flex flex-col items-center shadow-xs"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider mb-4 px-2.5 py-0.5 rounded border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--accent)",
              color: "var(--accent)",
            }}
          >
            Guided By
          </span>

          {/* Guide Photo */}
          <div
            className="w-44 h-44 rounded-xl border flex flex-col items-center justify-center gap-2.5 mb-5 transition-colors overflow-hidden"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--muted)",
            }}
          >
            <Image
              src="/guide.jpg"
              width={176}
              height={176}
              alt="Dr. Swaminathan A"
              className="w-full h-full object-cover"
            />
          </div>

          <h2
            className="text-base md:text-lg font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Dr. Swaminathan A
          </h2>
          <p
            className="text-xs md:text-sm opacity-80 mt-0.5"
            style={{ color: "var(--muted)" }}
          >
            Assistant Professor
          </p>
        </div>
      </div>
    </main>
    </div>
  );
}
