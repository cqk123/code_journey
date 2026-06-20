import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-blue-500/20">码</span>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-1">注册 码途</h1>
        <p className="text-slate-400 text-sm text-center mb-6">开启你的智能求职之旅</p>
        <div className="glass-card p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
