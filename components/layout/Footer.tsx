export function Footer() {
  return (
    <footer className="border-t border-slate-200/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-2 text-center text-sm text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">码</span>
          <span className="font-medium text-slate-500">码途</span>
        </div>
        <p>跨平台岗位聚合 · 简历智能匹配</p>
      </div>
    </footer>
  );
}
