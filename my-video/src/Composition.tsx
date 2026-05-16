import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const subjects = [
  { label: "English", grade: "A", score: 8 },
  { label: "Mathematics", grade: "B", score: 7 },
  { label: "Biology", grade: "A", score: 8 },
  { label: "Chemistry", grade: "B", score: 7 },
  { label: "Physics", grade: "B", score: 7 },
  { label: "Setswana", grade: "A", score: 8 },
];

const programmes = [
  { name: "BSc Computer Science", school: "University of Botswana", points: 42, status: "Match" },
  { name: "BSc Data Science", school: "BIUST", points: 43, status: "Close" },
  { name: "BCom Accounting", school: "Botswana School of Business Sciences", points: 38, status: "Match" },
];

const logos = [
  { src: "university-logos/ub.jpg", label: "UB" },
  { src: "university-logos/biust.jpg", label: "BIUST" },
  { src: "university-logos/botho.jpg", label: "Botho" },
  { src: "university-logos/bac.jpg", label: "BSBS" },
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const sceneProgress = (frame: number, start: number, end: number) => {
  return clamp(interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
};

function SceneTitle({ eyebrow, title, progress }: { eyebrow: string; title: string; progress: number }) {
  return (
    <div
      style={{
        opacity: interpolate(progress, [0, 0.18], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(progress, [0, 0.2], [22, 0], { extrapolateRight: "clamp" })}px)`,
      }}
    >
      <div className="text-[21px] font-bold uppercase tracking-[0.28em] text-[#ffd166]">{eyebrow}</div>
      <div className="mt-4 max-w-[560px] text-[64px] font-black leading-[0.96] tracking-[-0.04em] text-white">
        {title}
      </div>
    </div>
  );
}

function PhoneFrame({ children, progress }: { children: React.ReactNode; progress: number }) {
  const lift = interpolate(progress, [0, 1], [34, 0], { extrapolateRight: "clamp" });
  return (
    <div
      className="absolute right-[88px] top-[70px] h-[580px] w-[392px] overflow-hidden rounded-[44px] border-[10px] border-[#111827] bg-[#f8f5ee] shadow-[0_34px_90px_rgba(0,0,0,0.38)]"
      style={{
        opacity: interpolate(progress, [0, 0.14], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${lift}px) rotate(${interpolate(progress, [0, 1], [2.5, 0], {
          extrapolateRight: "clamp",
        })}deg)`,
      }}
    >
      <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-[#111827]" />
      {children}
    </div>
  );
}

function GradeScene({ progress }: { progress: number }) {
  return (
    <>
      <SceneTitle eyebrow="Step 01" title="Start with the grades you already have." progress={progress} />
      <PhoneFrame progress={progress}>
        <div className="h-full bg-[#fbfaf6] px-7 pt-16">
          <div className="text-[18px] font-bold uppercase tracking-[0.18em] text-[#0f766e]">BGCSE results</div>
          <div className="mt-3 text-[34px] font-black leading-none text-[#111827]">Build your score</div>
          <div className="mt-7 space-y-3">
            {subjects.map((subject, index) => {
              const rowProgress = sceneProgress(progress, index / 12, index / 12 + 0.18);
              return (
                <div
                  key={subject.label}
                  className="flex items-center justify-between rounded-[22px] border border-[#d8d1c4] bg-white px-5 py-4 shadow-sm"
                  style={{
                    opacity: rowProgress,
                    transform: `translateX(${interpolate(rowProgress, [0, 1], [26, 0])}px)`,
                  }}
                >
                  <span className="text-[22px] font-bold text-[#1f2937]">{subject.label}</span>
                  <span className="rounded-full bg-[#0f766e] px-4 py-2 text-[22px] font-black text-white">
                    {subject.grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </PhoneFrame>
    </>
  );
}

function MatchScene({ progress }: { progress: number }) {
  return (
    <>
      <SceneTitle eyebrow="Step 02" title="See the programmes within reach." progress={progress} />
      <PhoneFrame progress={progress}>
        <div className="h-full bg-[#0f172a] px-7 pt-16 text-white">
          <div className="rounded-[28px] bg-[#ffd166] px-6 py-5 text-[#111827]">
            <div className="text-[18px] font-black uppercase tracking-[0.18em]">Indicative points</div>
            <div className="mt-1 text-[78px] font-black leading-none">45</div>
          </div>
          <div className="mt-7 space-y-4">
            {programmes.map((programme, index) => {
              const rowProgress = sceneProgress(progress, index / 10, index / 10 + 0.2);
              return (
                <div
                  key={programme.name}
                  className="rounded-[24px] bg-white/95 p-5 text-[#111827]"
                  style={{
                    opacity: rowProgress,
                    transform: `translateY(${interpolate(rowProgress, [0, 1], [24, 0])}px) scale(${interpolate(
                      rowProgress,
                      [0, 1],
                      [0.96, 1],
                    )})`,
                  }}
                >
                  <div className="text-[22px] font-black leading-tight">{programme.name}</div>
                  <div className="mt-1 text-[15px] font-bold text-[#64748b]">{programme.school}</div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[17px] font-black text-[#0f766e]">From {programme.points} pts</span>
                    <span className="rounded-full bg-[#ff6b5f] px-3 py-1 text-[14px] font-black text-white">
                      {programme.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PhoneFrame>
    </>
  );
}

function CompareScene({ progress }: { progress: number }) {
  const bar = interpolate(progress, [0.12, 0.9], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <SceneTitle eyebrow="Step 03" title="Compare details before applications open." progress={progress} />
      <div
        className="absolute right-[58px] top-[108px] w-[560px] rounded-[34px] border border-white/20 bg-white p-7 shadow-[0_34px_90px_rgba(0,0,0,0.34)]"
        style={{
          opacity: interpolate(progress, [0, 0.18], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(progress, [0, 0.2], [34, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[18px] font-black uppercase tracking-[0.18em] text-[#0f766e]">Compare</div>
            <div className="mt-2 text-[36px] font-black leading-none text-[#111827]">3 options</div>
          </div>
          <div className="rounded-full bg-[#111827] px-5 py-3 text-[18px] font-black text-white">Shareable</div>
        </div>
        <div className="mt-7 overflow-hidden rounded-[24px] border border-[#d8d1c4]">
          {["Minimum points", "Subjects", "Duration", "Application"].map((row, index) => (
            <div key={row} className="grid grid-cols-[1.1fr_0.9fr_0.9fr] border-b border-[#d8d1c4] last:border-b-0">
              <div className="bg-[#f8f5ee] px-4 py-4 text-[18px] font-black text-[#475569]">{row}</div>
              <div className="px-4 py-4 text-[18px] font-bold text-[#111827]">{["42", "Maths", "4 yrs", "Open"][index]}</div>
              <div className="px-4 py-4 text-[18px] font-bold text-[#111827]">{["43", "Science", "4 yrs", "Soon"][index]}</div>
            </div>
          ))}
        </div>
        <div className="mt-7 h-4 overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${bar}%` }} />
        </div>
      </div>
    </>
  );
}

function UniversityScene({ progress }: { progress: number }) {
  return (
    <>
      <SceneTitle eyebrow="Step 04" title="Move from guesswork to a shortlist." progress={progress} />
      <div className="absolute right-[70px] top-[132px] grid w-[520px] grid-cols-2 gap-5">
        {logos.map((logo, index) => {
          const cardProgress = sceneProgress(progress, index / 9, index / 9 + 0.22);
          return (
            <div
              key={logo.label}
              className="flex h-[170px] flex-col items-center justify-center rounded-[30px] bg-white p-7 shadow-[0_28px_70px_rgba(0,0,0,0.26)]"
              style={{
                opacity: cardProgress,
                transform: `translateY(${interpolate(cardProgress, [0, 1], [28, 0])}px)`,
              }}
            >
              <Img src={staticFile(logo.src)} className="max-h-[82px] max-w-[164px] object-contain" />
              <div className="mt-4 text-[22px] font-black text-[#111827]">{logo.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export const MyComposition = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const grade = sceneProgress(frame, 0, 88);
  const match = sceneProgress(frame, 72, 162);
  const compare = sceneProgress(frame, 148, 232);
  const university = sceneProgress(frame, 218, durationInFrames - 1);

  return (
    <AbsoluteFill className="overflow-hidden bg-[#111827] font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(118deg,#0f172a_0%,#172554_44%,#115e59_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div
        className="absolute left-[70px] top-[58px] flex items-center gap-4"
        style={{ opacity: intro, transform: `translateY(${interpolate(intro, [0, 1], [-18, 0])}px)` }}
      >
        <Img src={staticFile("icons/thuto-logo.png")} className="h-[72px] w-[72px] rounded-[24px] bg-white object-contain p-1" />
        <div>
          <div className="text-[44px] font-black leading-none tracking-[-0.04em] text-white">Thuto</div>
          <div className="mt-1 text-[18px] font-bold uppercase tracking-[0.3em] text-[#99f6e4]">Botswana University Companion</div>
        </div>
      </div>
      <div className="absolute left-[70px] top-[190px] w-[590px]">
        <div style={{ opacity: interpolate(frame, [0, 72], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <GradeScene progress={grade} />
        </div>
        <div style={{ opacity: interpolate(frame, [72, 92, 148], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <MatchScene progress={match} />
        </div>
        <div style={{ opacity: interpolate(frame, [148, 168, 218], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <CompareScene progress={compare} />
        </div>
        <div style={{ opacity: interpolate(frame, [218, 238], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <UniversityScene progress={university} />
        </div>
      </div>
      <div className="absolute bottom-10 left-[70px] h-2 w-[520px] overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-[#ffd166]"
          style={{
            width: `${interpolate(frame, [0, durationInFrames - 1], [8, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
