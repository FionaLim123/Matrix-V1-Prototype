import { ArrowRight, Bot, MessageCircle } from "lucide-react";

/**
 * “If you need help” row — static UI only (matches Magic Patterns).
 */
export function HelpSection() {
  return (
    <div className="border-t border-[#EAE3DE] pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        If you need help
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2.5 rounded-lg bg-matrix-maroon p-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-matrix-red/20">
            <Bot size={15} className="text-matrix-red" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-white">Ask Max</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/60">
              Your personal AI study buddy, made by Matrix teachers
            </p>
          </div>
          <ArrowRight
            size={14}
            className="ml-auto flex-shrink-0 text-white/40"
          />
        </div>

        <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-matrix-maroon/5">
            <MessageCircle size={15} className="text-matrix-maroon" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-gray-900">Discussion Forum</p>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              Get a direct response from one of our Matrix teachers shortly
            </p>
          </div>
          <ArrowRight
            size={14}
            className="ml-auto flex-shrink-0 text-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
