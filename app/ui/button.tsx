import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ children, className, variant = 'primary', ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        {
          'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/25 active:scale-95 focus-visible:outline-blue-600': 
            variant === 'primary',
          'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white focus-visible:outline-gray-600': 
            variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/25 focus-visible:outline-red-600': 
            variant === 'danger',
        },
        className,
      )}
    >
      {children}
    </button>
  );
}