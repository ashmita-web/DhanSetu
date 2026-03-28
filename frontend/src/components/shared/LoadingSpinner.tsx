interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ size = 'md', color = 'et-orange' }: LoadingSpinnerProps) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];

  return (
    <div className={`${sizeClass} rounded-full border-2 border-white/20 border-t-${color} animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-et-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-2 border-et-orange/20 border-t-et-orange animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-et-orange font-bold text-lg">DS</span>
          </div>
        </div>
        <p className="text-white/50 text-sm animate-pulse">Loading DhanSetu...</p>
      </div>
    </div>
  );
}
