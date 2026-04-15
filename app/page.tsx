import Link from "next/link";
import LogoLink from "@/components/LogoLink";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-items-start py-32 px-16 bg-white sm:items-start">
        <LogoLink />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black">
            APIIS Administrator Tools
          </h1>
          <p className="max-w-md text-md leading-8 text-zinc-600">
            The following tools are available to you as an APIIS administrator:
          </p>
          <div className="flex items-center gap-6 text-center sm:items-start sm:text-left w-full">
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left rounded-lg border border-gray-200 p-4 transition-colors hover:cursor-pointer hover:bg-zinc-50">
              <h2 className="text-lg font-semibold text-black">
                <Link href="/quiz-result-summary">Quiz Result Summary</Link>
              </h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
