interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}

